import { CourseRepository } from "../course/repository";
import { ProgressRepository } from "../progress/repository";
import type { Course } from "../course/types";
import { logger } from "../../core/utils/loggers";
import { AppError } from "../../core/utils/errors";
import { RecommendationRepository } from "./repository";
import type {
  LearningContinuityParams,
  LikedBasedParams,
  Recommendation,
  RecommendationWithCourse,
  ScoringFactors,
  ScoringWeights,
  UserLikeProfile,
  LikedBasedScoringFactors,
} from "./types";
import type { LikesRepository } from "modules/likes/repository";

export class RecommendationService {
  private recommendationRepo: RecommendationRepository;
  private courseRepo: CourseRepository;
  private progressRepo: ProgressRepository;
  private likedRepo: LikesRepository;

  private defaultWeights: ScoringWeights = {
    sequentialProgression: 0.5,
    topicSimilarity: 0.3,
    popularity: 0.2,
  };
  private readonly minLikesForPersonalizedRecommendations = 3;

  constructor(
    recommendationRepo: RecommendationRepository,
    courseRepo: CourseRepository,
    progressRepo: ProgressRepository,
    likedRepo: LikesRepository,
  ) {
    this.recommendationRepo = recommendationRepo;
    this.courseRepo = courseRepo;
    this.progressRepo = progressRepo;
    this.likedRepo = likedRepo;
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
      const prefilteredCandidates = this.prefilterLearningContinuityCandidates(
        completedCourse,
        candidates,
        limit,
      );

      const scoredRecommendations = prefilteredCandidates
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

  async getLikedCoursesRecommendations(params: LikedBasedParams): Promise<{
    recommendations: RecommendationWithCourse[];
    fromCache: boolean;
  }> {
    const { userId, limit = 10 } = params;
    try {
      const cached = await this.getCachedRecommendations(userId, "liked-based");
      if (cached) {
        logger.info("Returning cached liked-based recommendations", {
          userId,
          count: cached.length,
        });
        return { recommendations: cached, fromCache: true };
      }

      const likes = await this.likedRepo.getLikesByUser(userId);

      logger.info("User likes fetched", {
        userId,
        likeCount: likes.length,
      });

      if (likes.length < this.minLikesForPersonalizedRecommendations) {
        logger.info("Insufficient likes for personalized recommendations", {
          userId,
          likeCount: likes.length,
          minimumRequired: this.minLikesForPersonalizedRecommendations,
        });
        return { recommendations: [], fromCache: false };
      }

      const likedCourses = await Promise.all(
        likes.map((like) => this.courseRepo.getCourseById(like.courseId)),
      );

      const validLikedCourses = likedCourses.filter((course) => course != null);

      logger.info("Liked courses fetched", {
        userId,
        likedCourseCount: validLikedCourses.length,
      });

      const userProfile = this.buildUserLikeProfile(
        validLikedCourses,
        likes.map((like) => like.courseId),
      );


      const allCourses = await this.courseRepo.getCourse({ publish: true });
      

      const likedCourseIds = new Set(likes.map((like) => like.courseId));
      
      const candidates = allCourses.filter(
        (course) => !likedCourseIds.has(course.id),
      );
      const prefilteredCandidates = this.prefilterLikedBasedCandidates(
        candidates,
        userProfile,
        limit,
      );

      const scoredRecommendations = prefilteredCandidates
        .map((course) => {
          const factors = this.calculateLikedBasedScoringFactors(
            course,
            userProfile,
          );
          const score = this.calculateLikedBasedScore(factors);
          const reason = this.generateLikedBasedReason(course, userProfile);

          return {
            courseId: course.id,
            score,
            reason,
            metadata: {
              categoryAffinity: factors.categoryAffinity,
              topicClustering: factors.topicClustering,
              tagAffinity: factors.tagAffinity,
              levelMatch: course.level === userProfile.preferredLevel,
            },
          } as Recommendation;
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);


      const diversifiedResults = this.applyDiversityFilter(
        scoredRecommendations,
        allCourses,
        limit,
      );

    
      await this.setCachedRecommendations(
        userId,
        "liked-based",
        diversifiedResults,
        12,
      );

      const enrichedRecommendations =
        await this.enrichRecommendations(diversifiedResults);

      logger.info("Generated liked-based recommendations", {
        userId,
        count: enrichedRecommendations.length,
      });

      return { recommendations: enrichedRecommendations, fromCache: false };
    } catch (error) {
      logger.error("Error generating liked-based recommendations:", error);
      throw error;
    }
  }

  private buildUserLikeProfile(
    courses: Course[],
    recentLikes: string[],
  ): UserLikeProfile {
    const categoryMap = new Map<string, number>();
    const topicWords = new Map<string, number>();
    const tagMap = new Map<string, number>();
    const levelMap = new Map<string, number>();
    const topics: string[] = [];
    let totalEnrollment = 0;

    courses.forEach((course) => {
      categoryMap.set(
        course.category,
        (categoryMap.get(course.category) || 0) + 1,
      );

      topics.push(course.topic);
      const words = this.tokenize(course.topic);
      words.forEach((word) => {
        topicWords.set(word, (topicWords.get(word) || 0) + 1);
      });

      course.tags?.forEach((tag) => {
        tagMap.set(tag.toLowerCase(), (tagMap.get(tag.toLowerCase()) || 0) + 1);
      });

      levelMap.set(course.level, (levelMap.get(course.level) || 0) + 1);

      totalEnrollment += course.enrollmentCount || 0;
    });

    const categoryDistribution = new Map<string, number>();
    categoryMap.forEach((count, category) => {
      categoryDistribution.set(category, count / courses.length);
    });

    const topCategories = Array.from(categoryMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category]) => category);

    const topicFrequency = new Map<string, number>();
    topics.forEach((topic) => {
      topicFrequency.set(topic, (topicFrequency.get(topic) || 0) + 1);
    });
    const dominantTopics = Array.from(topicFrequency.entries())
      .filter(([_, count]) => count > 1)
      .map(([topic]) => topic);

    const preferredTags = Array.from(tagMap.entries())
      .filter(([_, count]) => count >= 2)
      .map(([tag]) => tag);

    const levelDistribution = new Map<string, number>();
    levelMap.forEach((count, level) => {
      levelDistribution.set(level, count / courses.length);
    });

    const preferredLevel =
      Array.from(levelMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      "beginner";

    return {
      categoryDistribution,
      topCategories,
      topicKeywords: topicWords,
      dominantTopics,
      tagFrequency: tagMap,
      preferredTags,
      levelDistribution,
      preferredLevel,
      averageEnrollmentPreference:
        courses.length > 0 ? totalEnrollment / courses.length : 0,
      totalLikes: courses.length,
      recentLikes: recentLikes.slice(-5),
    };
  }

  private calculateLikedBasedScoringFactors(
    course: Course,
    profile: UserLikeProfile,
  ): LikedBasedScoringFactors {
    let categoryAffinity =
      profile.categoryDistribution.get(course.category) || 0;
    if (profile.topCategories.includes(course.category)) {
      categoryAffinity = Math.min(categoryAffinity * 1.2, 1.0);
    }

    const candidateWords = this.tokenize(course.topic);
    let matchScore = 0;
    const totalKeywordWeight = Array.from(
      profile.topicKeywords.values(),
    ).reduce((sum, val) => sum + val, 0);

    candidateWords.forEach((word) => {
      if (profile.topicKeywords.has(word)) {
        matchScore += profile.topicKeywords.get(word) || 0;
      }
    });

    // Safe division with zero check
    let topicClustering =
      totalKeywordWeight > 0 && matchScore > 0
        ? matchScore / totalKeywordWeight
        : 0;

    if (profile.dominantTopics.includes(course.topic)) {
      topicClustering = Math.max(topicClustering, 0.8);
    }

    let tagAffinity = 0;
    if (
      course.tags &&
      course.tags.length > 0 &&
      profile.preferredTags.length > 0
    ) {
      const courseTags = new Set(course.tags.map((t) => t.toLowerCase()));
      const preferredTagsSet = new Set(profile.preferredTags);

      let weightedIntersection = 0;
      courseTags.forEach((tag) => {
        if (preferredTagsSet.has(tag)) {
          const weight =
            (profile.tagFrequency.get(tag) || 0) / profile.totalLikes;
          weightedIntersection += weight;
        }
      });

      const union = new Set([...courseTags, ...preferredTagsSet]).size;
      // Safe division with zero check
      tagAffinity =
        union > 0 && weightedIntersection > 0
          ? weightedIntersection / union
          : 0;
    }

    let levelPreference = profile.levelDistribution.get(course.level) || 0;
    if (course.level === profile.preferredLevel) {
      levelPreference = Math.max(levelPreference, 0.8);
    }

    // Safe popularity calculation with dynamic normalization
    const baseEnrollment =
      profile.averageEnrollmentPreference > 0
        ? profile.averageEnrollmentPreference
        : 100;
    const enrollmentRatio = (course.enrollmentCount || 0) / baseEnrollment;
    const likesRatio =
      (course.likesCount || 0) / Math.max(profile.totalLikes * 10, 50);

    const enrollmentScore = Math.min(enrollmentRatio / 2, 1);
    const likesScore = Math.min(likesRatio, 1);
    const popularityBoost = (enrollmentScore + likesScore) / 2;

    return {
      categoryAffinity,
      topicClustering,
      tagAffinity,
      levelPreference,
      popularityBoost,
    };
  }

  private calculateLikedBasedScore(factors: LikedBasedScoringFactors): number {
    const score =
      factors.categoryAffinity * 0.3 +
      factors.topicClustering * 0.25 +
      factors.tagAffinity * 0.2 +
      factors.levelPreference * 0.15 +
      factors.popularityBoost * 0.1;

    return Math.min(Math.max(score, 0), 1);
  }

  private generateLikedBasedReason(
    course: Course,
    profile: UserLikeProfile,
  ): string {
    const reasons: string[] = [];

    if (profile.topCategories.includes(course.category)) {
      const categoryPercent = Math.round(
        (profile.categoryDistribution.get(course.category) || 0) * 100,
      );
      reasons.push(
        `${categoryPercent}% of your likes are in ${course.category}`,
      );
    }

    const candidateWords = new Set(this.tokenize(course.topic));
    const hasTopicOverlap = Array.from(candidateWords).some((word) =>
      profile.topicKeywords.has(word),
    );
    if (hasTopicOverlap) {
      reasons.push("Similar to topics you've liked");
    }

    if (course.tags && course.tags.length > 0) {
      const matchingTags = course.tags.filter((tag) =>
        profile.preferredTags.includes(tag.toLowerCase()),
      );
      if (matchingTags.length > 0) {
        reasons.push(`Tags: ${matchingTags.slice(0, 2).join(", ")}`);
      }
    }

    if (course.level === profile.preferredLevel) {
      reasons.push(`Matches your preferred ${course.level} level`);
    }

    if (
      course.enrollmentCount &&
      course.enrollmentCount > profile.averageEnrollmentPreference * 1.5
    ) {
      reasons.push("Highly popular course");
    }

    return reasons.length > 0
      ? reasons.join(" • ")
      : "Based on your liked courses";
  }

  private applyDiversityFilter(
    recommendations: Recommendation[],
    allCourses: Course[],
    limit: number,
  ): Recommendation[] {
    const diversified: Recommendation[] = [];
    const categoryCount = new Map<string, number>();
    const categoryLimit = 3;

    for (const rec of recommendations) {
      const course = allCourses.find((c) => c.id === rec.courseId);
      if (!course) continue;

      const currentCount = categoryCount.get(course.category) || 0;

      if (currentCount < categoryLimit || diversified.length < limit * 0.7) {
        diversified.push(rec);
        categoryCount.set(course.category, currentCount + 1);
      }

      if (diversified.length >= limit) break;
    }

    return diversified;
  }

  private tokenize(text: string | undefined | null): string[] {
    if (!text || typeof text !== "string") {
      return [];
    }
    return text
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 2 && word.trim().length > 0);
  }

  private prefilterLearningContinuityCandidates(
    completedCourse: Course,
    candidates: Course[],
    limit: number,
  ): Course[] {
    if (candidates.length === 0) {
      return [];
    }

    const completedTags = new Set(
      (completedCourse.tags || []).map((tag) => tag.toLowerCase()),
    );
    const maxPoolSize = Math.max(limit * 8, 30);

    const ranked = candidates
      .map((course) => {
        const sameCategory = course.category === completedCourse.category;
        const sharedTags = (course.tags || []).filter((tag) =>
          completedTags.has(tag.toLowerCase()),
        ).length;
        const topicSimilarity = this.calculateTopicSimilarity(
          completedCourse.topic,
          course.topic,
          completedCourse.category,
          course.category,
        );
        const continuityBoost = course.nextCourses?.includes(completedCourse.id)
          ? 0.1
          : 0;
        const prefilterScore =
          (sameCategory ? 0.45 : 0) +
          topicSimilarity * 0.35 +
          Math.min(sharedTags, 3) * 0.05 +
          continuityBoost;

        return { course, prefilterScore };
      })
      .sort((a, b) => b.prefilterScore - a.prefilterScore)
      .slice(0, maxPoolSize)
      .map((entry) => entry.course);

    return ranked.length > 0 ? ranked : candidates.slice(0, maxPoolSize);
  }

  private prefilterLikedBasedCandidates(
    candidates: Course[],
    profile: UserLikeProfile,
    limit: number,
  ): Course[] {
    if (candidates.length === 0) {
      return [];
    }

    const preferredTags = new Set(profile.preferredTags);
    const topCategories = new Set(profile.topCategories);
    const maxPoolSize = Math.max(limit * 10, 40);

    const ranked = candidates
      .map((course) => {
        const inTopCategory = topCategories.has(course.category);
        const levelMatch = course.level === profile.preferredLevel;
        const tagMatches = (course.tags || []).filter((tag) =>
          preferredTags.has(tag.toLowerCase()),
        ).length;
        const topicWords = this.tokenize(course.topic);
        const keywordMatches = topicWords.filter((word) =>
          profile.topicKeywords.has(word),
        ).length;

        const prefilterScore =
          (inTopCategory ? 0.35 : 0) +
          (levelMatch ? 0.2 : 0) +
          Math.min(tagMatches, 3) * 0.1 +
          Math.min(keywordMatches, 4) * 0.05;

        return { course, prefilterScore };
      })
      .sort((a, b) => b.prefilterScore - a.prefilterScore)
      .slice(0, maxPoolSize)
      .map((entry) => entry.course);

    return ranked.length > 0 ? ranked : candidates.slice(0, maxPoolSize);
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

    // Dynamic normalization: use the actual enrollment count with diminishing returns
    const enrollmentScore =
      factors.enrollmentCount > 0
        ? Math.min(Math.log10(factors.enrollmentCount + 1) / 4, 1)
        : 0;
    const likesScore =
      factors.likesCount > 0
        ? Math.min(Math.log10(factors.likesCount + 1) / 3, 1)
        : 0;
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
    if (!completedTopic || !candidateTopic) {
      return completedCategory === candidateCategory ? 0.5 : 0;
    }

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
              courseId: course.id,
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
              courseId: "",
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
