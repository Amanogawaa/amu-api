import { CourseRepository } from "../course/repository";
import { ProgressRepository } from "../progress/repository";
import type { Course } from "../course/types";
import { logger } from "../../utils/loggers";
import { AppError } from "../../utils/errors";
import { RecommendationRepository } from "./repository";
import type {
  LearningContinuityParams,
  Recommendation,
  RecommendationWithCourse,
  ScoringFactors,
  ScoringWeights,
} from "./types";

export class RecommendationService {
  private recommendationRepo: RecommendationRepository;
  private courseRepo: CourseRepository;
  private progressRepo: ProgressRepository;

  private defaultWeights: ScoringWeights = {
    sequentialProgression: 0.5,
    topicSimilarity: 0.3,
    popularity: 0.2,
  };

  constructor(
    recommendationRepo: RecommendationRepository,
    courseRepo: CourseRepository,
    progressRepo: ProgressRepository,
  ) {
    this.recommendationRepo = recommendationRepo;
    this.courseRepo = courseRepo;
    this.progressRepo = progressRepo;
  }

  async getLearningContinuityRecommendations(
    params: LearningContinuityParams,
  ): Promise<{
    recommendations: RecommendationWithCourse[];
    fromCache: boolean;
  }> {
    const { userId, completedCourseId, limit = 10 } = params;

    try {
      const cached = await this.getCachedRecommendations(
        userId,
        "learning-continuity",
        completedCourseId,
      );

      if (cached) {
        logger.info("Returning cached learning continuity recommendations", {
          userId,
          completedCourseId,
          count: cached.length,
        });
        return { recommendations: cached, fromCache: true };
      }

      const completedCourse =
        await this.courseRepo.getCourseById(completedCourseId);
      if (!completedCourse) {
        throw new AppError("Completed course not found", 404);
      }

      const allCourses = await this.courseRepo.getCourse({
        publish: true,
      });

      const userProgress = await this.progressRepo.getProgressByUser(userId);
      const completedCourseIds = new Set(
        userProgress
          .filter((p) => p.percentComplete === 100)
          .map((p) => p.courseId),
      );

      const candidates = allCourses.filter(
        (course) =>
          course.id !== completedCourseId && !completedCourseIds.has(course.id),
      );

      const scoredRecommendations = candidates
        .map((course) => {
          const factors = this.calculateScoringFactors(completedCourse, course);
          const score = this.calculateScore(factors);
          const reason = this.generateReason(completedCourse, course, factors);

          return {
            courseId: course.id,
            score,
            reason,
            metadata: {
              isSequentialNext: factors.isNextInSequence,
              topicSimilarity: factors.topicSimilarity,
              tagOverlap: factors.tagOverlap,
              difficultyProgression: factors.difficultyProgression > 0.5,
              enrollmentCount: course.enrollmentCount || 0,
            },
          } as Recommendation;
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      await this.setCachedRecommendations(
        userId,
        "learning-continuity",
        scoredRecommendations,
        24,
        completedCourseId,
      );

      const enrichedRecommendations = await this.enrichRecommendations(
        scoredRecommendations,
      );

      logger.info("Generated learning continuity recommendations", {
        userId,
        completedCourseId,
        count: enrichedRecommendations.length,
      });

      return { recommendations: enrichedRecommendations, fromCache: false };
    } catch (error) {
      logger.error(
        "Error generating learning continuity recommendations:",
        error,
      );
      throw error;
    }
  }

  private calculateScoringFactors(
    completedCourse: Course,
    candidate: Course,
  ): ScoringFactors {
    const isNextInSequence =
      completedCourse.nextCourses?.includes(candidate.id) || false;
    const difficultyProgression = this.calculateDifficultyProgression(
      completedCourse.level,
      candidate.level,
    );
    const topicSimilarity = this.calculateTopicSimilarity(
      completedCourse.topic,
      candidate.topic,
      completedCourse.category,
      candidate.category,
    );
    const tagOverlap = this.calculateTagOverlap(
      completedCourse.tags,
      candidate.tags,
    );

    return {
      isNextInSequence,
      difficultyProgression,
      topicSimilarity,
      tagOverlap,
      enrollmentCount: candidate.enrollmentCount || 0,
      likesCount: candidate.likesCount || 0,
    };
  }

  private calculateScore(factors: ScoringFactors): number {
    const weights = this.defaultWeights;

    const sequentialScore = factors.isNextInSequence
      ? 1.0
      : factors.difficultyProgression;

    const topicScore = factors.topicSimilarity + factors.tagOverlap * 0.3;

    const maxEnrollment = 10000;
    const enrollmentScore = Math.min(
      factors.enrollmentCount / maxEnrollment,
      1,
    );
    const likesScore = Math.min(factors.likesCount / 1000, 1);
    const popularityScore = (enrollmentScore + likesScore) / 2;

    const finalScore =
      sequentialScore * weights.sequentialProgression +
      topicScore * weights.topicSimilarity +
      popularityScore * weights.popularity;

    return Math.min(Math.max(finalScore, 0), 1);
  }

  private calculateDifficultyProgression(
    completedLevel: string,
    candidateLevel: string,
  ): number {
    const levelMap: Record<string, number> = {
      beginner: 1,
      intermediate: 2,
      advanced: 3,
    };

    const completedLevelNum = levelMap[completedLevel] || 1;
    const candidateLevelNum = levelMap[candidateLevel] || 1;
    const diff = candidateLevelNum - completedLevelNum;

    if (diff === 0 || diff === 1) return 1.0;

    if (diff === 2) return 0.5;

    if (diff < 0) return 0.3;

    return 0.1;
  }

  private calculateTopicSimilarity(
    completedTopic: string,
    candidateTopic: string,
    completedCategory: string,
    candidateCategory: string,
  ): number {
    const categoryMatch = completedCategory === candidateCategory ? 0.5 : 0;

    const completedWords = new Set(completedTopic.toLowerCase().split(/\s+/));
    const candidateWords = candidateTopic.toLowerCase().split(/\s+/);

    const matchingWords = candidateWords.filter((word) =>
      completedWords.has(word),
    ).length;

    const totalWords = Math.max(completedWords.size, candidateWords.length);
    const wordOverlap = totalWords > 0 ? matchingWords / totalWords : 0;

    if (completedTopic.toLowerCase() === candidateTopic.toLowerCase()) {
      return 1.0;
    }

    return Math.min(categoryMatch + wordOverlap * 0.5, 1.0);
  }

  private calculateTagOverlap(
    completedTags?: string[],
    candidateTags?: string[],
  ): number {
    if (
      !completedTags ||
      !candidateTags ||
      completedTags.length === 0 ||
      candidateTags.length === 0
    ) {
      return 0;
    }

    const completedSet = new Set(completedTags.map((tag) => tag.toLowerCase()));
    const candidateSet = new Set(candidateTags.map((tag) => tag.toLowerCase()));

    // Calculate intersection
    const intersection = [...completedSet].filter((tag) =>
      candidateSet.has(tag),
    ).length;

    const union = new Set([...completedSet, ...candidateSet]).size;

    return union > 0 ? intersection / union : 0;
  }

  private generateReason(
    completedCourse: Course,
    candidate: Course,
    factors: ScoringFactors,
  ): string {
    const reasons: string[] = [];

    if (factors.isNextInSequence) {
      reasons.push("Recommended as the next course in your learning path");
    }

    if (factors.difficultyProgression >= 0.9) {
      if (completedCourse.level === candidate.level) {
        reasons.push(
          `Similar ${candidate.level} level as your completed course`,
        );
      } else {
        reasons.push(`Natural progression to ${candidate.level} level`);
      }
    }

    if (factors.topicSimilarity > 0.5) {
      reasons.push(`Related to ${completedCourse.topic}`);
    }

    if (completedCourse.category === candidate.category) {
      reasons.push(`Same category: ${candidate.category}`);
    }

    if (factors.enrollmentCount > 100) {
      reasons.push("Popular course with many learners");
    }

    if (reasons.length === 0) {
      reasons.push("Recommended for continued learning");
    }

    return reasons.join(" • ");
  }

  private async getCachedRecommendations(
    uid: string,
    type: string,
    courseId?: string,
  ): Promise<RecommendationWithCourse[] | null> {
    const cached = await this.recommendationRepo.getCache(uid, type, courseId);

    if (cached && cached.expiresAt > new Date()) {
      return this.enrichRecommendations(cached.recommendations);
    }

    return null;
  }

  private async setCachedRecommendations(
    uid: string,
    type: string,
    recommendations: Recommendation[],
    ttlHours: number = 6,
    courseId?: string,
  ): Promise<void> {
    await this.recommendationRepo.setCache(
      uid,
      type,
      recommendations,
      ttlHours,
      courseId,
    );
  }

  private async enrichRecommendations(
    recommendations: Recommendation[],
  ): Promise<RecommendationWithCourse[]> {
    const courseIds = recommendations.map((r) => r.courseId);

    const courses = await Promise.all(
      courseIds.map((id) => this.courseRepo.getCourseById(id)),
    );

    return recommendations.map((rec, index) => {
      const course = courses[index];
      if (!course) {
        logger.warn("Course not found for recommendation", {
          courseId: rec.courseId,
        });
      }

      return {
        ...rec,
        course: course
          ? {
              name: course.name,
              topic: course.topic,
              level: course.level,
              description: course.description,
              category: course.category,
              authorId: course.uid,
              enrollmentCount: course.enrollmentCount,
              likesCount: course.likesCount,
            }
          : {
              name: "Unknown Course",
              topic: "",
              level: "beginner",
              description: "",
              category: "",
              authorId: "",
            },
      };
    });
  }

  async invalidateCache(
    uid: string,
    type: string,
    courseId?: string,
  ): Promise<void> {
    await this.recommendationRepo.invalidateCache(uid, type, courseId);
  }
}
