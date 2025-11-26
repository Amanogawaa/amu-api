import { AppError } from '../../utils/errors';
import { logger } from '../../utils/loggers';
import { CapstoneRepository } from './repository';
import fs from 'fs/promises';
import path from 'path';
import {
  type CapstoneGuideline,
  type CapstoneSubmission,
  type CapstoneReview,
  type CreateCapstoneSubmissionRequest,
  type UpdateCapstoneSubmissionRequest,
  type CreateCapstoneReviewRequest,
  type UpdateCapstoneReviewRequest,
  type CapstoneSubmissionQueryParams,
  type CapstoneReviewQueryParams,
  type GitHubRepoMetadata,
  capstoneSchema,
} from './types';
import { geminiCall } from '../../utils/geminiCall';
import { generateCapstonePrompt } from '../../utils/prompts/capstone-temp';
import type { GitHubService } from '../github/service';
import type { CourseRepository } from '../course/repository';
import type { ModuleRepository } from '../modules/repository';
import type { ChapterRepository } from '../chapter/repository';
import type { LessonRepository } from '../lesson/repository';

export class CapstoneService {
  private repository: CapstoneRepository;
  private githubService: GitHubService;
  private courseRepository: CourseRepository;
  private moduleRepository: ModuleRepository;
  private chapterRepository: ChapterRepository;
  private lessonRepository: LessonRepository;

  constructor(
    repository: CapstoneRepository,
    githubService: GitHubService,
    courseRepository: CourseRepository,
    moduleRepository: ModuleRepository,
    chapterRepository: ChapterRepository,
    lessonRepository: LessonRepository
  ) {
    this.repository = repository;
    this.githubService = githubService;
    this.courseRepository = courseRepository;
    this.moduleRepository = moduleRepository;
    this.chapterRepository = chapterRepository;
    this.lessonRepository = lessonRepository;
  }

  // ==================== CAPSTONE GUIDELINES ====================

  async generateGuideline(courseId: string): Promise<CapstoneGuideline> {
    try {
      const existing = await this.repository.getGuidelineByCourseId(courseId);

      if (existing) {
        logger.info(
          `Capstone guideline already exists for course: ${courseId}`
        );
        return existing;
      }

      logger.info('Fetching course context from database', { courseId });
      const courseContext = await this.gatherCourseContext(courseId);

      const prompt = generateCapstonePrompt(courseContext);

      logger.info('Generating capstone guideline with AI', { courseId });

      const result = await geminiCall(prompt, {
        responseSchema: capstoneSchema,
        temperature: 0.7,
        maxRetries: 3,
      });

      logger.info('Capstone guideline generated successfully');

      const guidelineData = {
        courseId,
        ...result,
      };

      const createdGuideline = await this.repository.createGuideline(
        guidelineData
      );

      return createdGuideline;
    } catch (error) {
      logger.error('Error in CapstoneService.generateGuideline:', error);
      throw error;
    }
  }

  private async gatherCourseContext(courseId: string) {
    try {
      const course = await this.courseRepository.getCourseById(courseId);

      if (!course) {
        throw new AppError('Course not found', 404);
      }

      const modules = await this.moduleRepository.getModules(courseId);

      if (!modules || modules.length === 0) {
        throw new AppError(
          'No modules found for this course. Generate course content first.',
          400
        );
      }

      // Collect module summaries
      const moduleSummaries = modules.map((module) => ({
        title: module.moduleName,
        description: module.moduleDescription,
        learningOutcomes: module.learningObjectives || [],
        duration: module.estimatedDuration,
        order: module.moduleOrder,
      }));

      const allChapters: any[] = [];
      const allLessons: any[] = [];

      for (const module of modules) {
        const chapters = await this.chapterRepository.getChapters(module.id);
        allChapters.push(...chapters);

        for (const chapter of chapters) {
          const lessons = await this.lessonRepository.getLessons(chapter.id);
          allLessons.push(
            ...lessons.map((l) => ({ ...l, moduleId: module.id }))
          );
        }
      }

      const lessonsByModule = modules.map((module) => {
        const moduleLessons = allLessons
          .filter((lesson) => lesson.moduleId === module.id)
          .map((lesson) => ({
            title: lesson.lessonName,
            type: lesson.type,
            duration: lesson.duration,
          }));

        return {
          moduleTitle: module.moduleName,
          lessonCount: moduleLessons.length,
          lessons: moduleLessons.slice(0, 3),
        };
      });

      const skillsGained = course.skillsGained || [];
      const technologiesUsed = this.extractTechnologies(modules, allLessons);

      return {
        courseId: course.id,
        courseName: course.name,
        courseDescription: course.description,
        category: course.category,
        level: course.level,
        duration: course.duration,
        language: course.language,
        learningOutcomes: course.learning_outcomes || [],
        skillsGained,
        prerequisites: course.prerequisites
          ? course.prerequisites.split(',').map((p) => p.trim())
          : [],
        totalModules: modules.length,
        totalLessons: allLessons.length,
        moduleSummaries,
        lessonsByModule,
        technologiesUsed,
      };
    } catch (error) {
      logger.error('Error gathering course context:', error);
      throw error;
    }
  }

  private extractTechnologies(modules: any[], lessons: any[]): string[] {
    const technologies = new Set<string>();

    modules.forEach((module) => {
      const text = `${module.title} ${module.description}`.toLowerCase();
      this.findTechnologiesInText(text, technologies);
    });

    lessons.forEach((lesson) => {
      const text = `${lesson.title} ${lesson.description || ''}`.toLowerCase();
      this.findTechnologiesInText(text, technologies);
    });

    return Array.from(technologies);
  }

  private findTechnologiesInText(text: string, technologies: Set<string>) {
    const techPatterns = [
      'react',
      'vue',
      'angular',
      'next.js',
      'express',
      'django',
      'flask',
      'javascript',
      'typescript',
      'python',
      'java',
      'c#',
      'ruby',
      'go',
      'rust',
      'mongodb',
      'postgresql',
      'mysql',
      'redis',
      'firebase',
      'docker',
      'kubernetes',
      'git',
      'aws',
      'azure',
      'gcp',
      'tailwind',
      'bootstrap',
      'jquery',
      'axios',
      'pandas',
      'numpy',
    ];

    techPatterns.forEach((tech) => {
      if (text.includes(tech)) {
        technologies.add(tech);
      }
    });
  }

  async getGuidelineByCourseId(courseId: string): Promise<CapstoneGuideline> {
    try {
      const guideline = await this.repository.getGuidelineByCourseId(courseId);

      if (!guideline) {
        throw new AppError('Capstone guideline not found for this course', 404);
      }

      return guideline;
    } catch (error) {
      logger.error('Error in CapstoneService.getGuidelineByCourseId:', error);
      throw error;
    }
  }

  async getGuidelineById(id: string): Promise<CapstoneGuideline> {
    try {
      return await this.repository.getGuidelineById(id);
    } catch (error) {
      logger.error('Error in CapstoneService.getGuidelineById:', error);
      throw error;
    }
  }

  // ==================== CAPSTONE SUBMISSIONS ====================

  async createSubmission(
    userId: string,
    request: CreateCapstoneSubmissionRequest
  ): Promise<CapstoneSubmission> {
    try {
      await this.repository.getGuidelineById(request.guidelineId);

      const exists = await this.repository.submissionExistsByRepo(
        userId,
        request.githubRepoUrl
      );

      if (exists) {
        throw new AppError('You have already submitted this repository', 400);
      }

      const { owner, repo } = this.parseGitHubUrl(request.githubRepoUrl);

      const repoMetadata = await this.githubService.getRepoMetadata(
        owner,
        repo
      );


      const submissionData = {
        userId,
        courseId: request.courseId,
        guidelineId: request.guidelineId,
        githubRepoUrl: request.githubRepoUrl,
        githubRepoName: repo,
        githubRepoOwner: owner,
        title: request.title,
        description: request.description,
        repoMetadata: {
          language: repoMetadata.language || 'Unknown',
          stars: repoMetadata.stargazers_count,
          forks: repoMetadata.forks_count,
          lastUpdated: new Date(repoMetadata.updated_at),
          isPrivate: repoMetadata.private,
        },
        screenshots: [],
      };

      const submission = await this.repository.createSubmission(submissionData);

      return submission;
    } catch (error) {
      logger.error('Error in CapstoneService.createSubmission:', error);
      throw error;
    }
  }

  async getSubmissions(
    params?: CapstoneSubmissionQueryParams
  ): Promise<{ submissions: CapstoneSubmission[]; total: number }> {
    try {
      const submissions = await this.repository.getSubmissions(params);
      return {
        submissions,
        total: submissions.length,
      };
    } catch (error) {
      logger.error('Error in CapstoneService.getSubmissions:', error);
      throw error;
    }
  }

  async getSubmissionById(
    id: string,
    incrementView: boolean = false
  ): Promise<CapstoneSubmission> {
    try {
      const submission = await this.repository.getSubmissionById(id);

      if (incrementView) {
        await this.repository.incrementViewCount(id);
      }

      return submission;
    } catch (error) {
      logger.error('Error in CapstoneService.getSubmissionById:', error);
      throw error;
    }
  }

  async updateSubmission(
    id: string,
    userId: string,
    request: UpdateCapstoneSubmissionRequest
  ): Promise<CapstoneSubmission> {
    try {
      const submission = await this.repository.getSubmissionById(id);

      if (submission.userId !== userId) {
        throw new AppError('You can only update your own submissions', 403);
      }

      const updates: Partial<CapstoneSubmission> = {};

      if (request.title) {
        updates.title = request.title;
      }

      if (request.description) {
        updates.description = request.description;
      }

      if (request.githubRepoUrl) {
        const { owner, repo } = this.parseGitHubUrl(request.githubRepoUrl);
        const repoMetadata = await this.githubService.getRepoMetadata(
          owner,
          repo
        );

        updates.githubRepoUrl = request.githubRepoUrl;
        updates.githubRepoName = repo;
        updates.githubRepoOwner = owner;
        updates.repoMetadata = {
          language: repoMetadata.language || 'Unknown',
          stars: repoMetadata.stargazers_count,
          forks: repoMetadata.forks_count,
          lastUpdated: new Date(repoMetadata.updated_at),
          isPrivate: repoMetadata.private,
        };
      }

      const updated = await this.repository.updateSubmission(id, updates);

      return updated;
    } catch (error) {
      logger.error('Error in CapstoneService.updateSubmission:', error);
      throw error;
    }
  }

  async deleteSubmission(id: string, userId: string): Promise<void> {
    try {
      const submission = await this.repository.getSubmissionById(id);

      if (submission.userId !== userId) {
        throw new AppError('You can only delete your own submissions', 403);
      }

      await this.repository.deleteSubmission(id);
    } catch (error) {
      logger.error('Error in CapstoneService.deleteSubmission:', error);
      throw error;
    }
  }

  // ==================== CAPSTONE REVIEWS ====================

  async createReview(
    userId: string,
    userEmail: string,
    userName: string,
    request: CreateCapstoneReviewRequest
  ): Promise<CapstoneReview> {
    try {
      const submission = await this.repository.getSubmissionById(
        request.capstoneSubmissionId
      );

      if (request.parentReviewId) {
        const parentReview = await this.repository.getReviewById(
          request.parentReviewId
        );
        if (parentReview.capstoneSubmissionId !== request.capstoneSubmissionId) {
          throw new AppError(
            'Parent review does not belong to this submission',
            400
          );
        }
      } else {
        if (submission.userId === userId) {
          throw new AppError('You cannot create a top-level review for your own submission', 400);
        }
      }


      const reviewData = {
        capstoneSubmissionId: request.capstoneSubmissionId,
        reviewerId: userId,
        reviewerName: userName,
        reviewerEmail: userEmail,
        parentReviewId: request.parentReviewId,
        rating: request.rating, 
        feedback: request.feedback,
        highlights: request.highlights || [],
        suggestions: request.suggestions || [],
        criteriaScores: request.criteriaScores,
        images: [],
      };


      if (request.parentReviewId) {
        await this.repository.incrementReplyCount(request.parentReviewId);
      }

      const review = await this.repository.createReview(reviewData);

      return review;
    } catch (error) {
      logger.error('Error in CapstoneService.createReview:', error);
      throw error;
    }
  }

  async getReviews(params?: CapstoneReviewQueryParams): Promise<{
    reviews: CapstoneReview[];
    total: number;
    averageRating?: number;
  }> {
    try {
      const reviews = await this.repository.getReviews(params);

      let averageRating: number | undefined;

      if (reviews.length > 0) {
        const totalRating = reviews.reduce((sum, r) => sum + (r?.rating || 0), 0);
        averageRating = Math.round((totalRating / reviews.length) * 10) / 10;
      }

      return {
        reviews,
        total: reviews.length,
        averageRating,
      };
    } catch (error) {
      logger.error('Error in CapstoneService.getReviews:', error);
      throw error;
    }
  }

  async getReviewById(id: string): Promise<CapstoneReview> {
    try {
      return await this.repository.getReviewById(id);
    } catch (error) {
      logger.error('Error in CapstoneService.getReviewById:', error);
      throw error;
    }
  }

  async updateReview(
    id: string,
    userId: string,
    request: UpdateCapstoneReviewRequest
  ): Promise<CapstoneReview> {
    try {
      const review = await this.repository.getReviewById(id);

      if (review.reviewerId !== userId) {
        throw new AppError('You can only update your own reviews', 403);
      }

      const updated = await this.repository.updateReview(id, request);

      return updated;
    } catch (error) {
      logger.error('Error in CapstoneService.updateReview:', error);
      throw error;
    }
  }

  async deleteReview(id: string, userId: string): Promise<void> {
    try {
      const review = await this.repository.getReviewById(id);

      if (review.reviewerId !== userId) {
        throw new AppError('You can only delete your own reviews', 403);
      }

      await this.repository.deleteReview(id);
    } catch (error) {
      logger.error('Error in CapstoneService.deleteReview:', error);
      throw error;
    }
  }

  // ==================== CAPSTONE LIKES ====================

  async toggleLike(
    userId: string,
    capstoneSubmissionId: string
  ): Promise<{ liked: boolean; likeCount: number }> {
    try {
      await this.repository.getSubmissionById(capstoneSubmissionId);

      const liked = await this.repository.toggleLike(
        userId,
        capstoneSubmissionId
      );
      const likeCount = await this.repository.getLikeCount(
        capstoneSubmissionId
      );

      return { liked, likeCount };
    } catch (error) {
      logger.error('Error in CapstoneService.toggleLike:', error);
      throw error;
    }
  }

  async getLikeStatus(
    userId: string,
    capstoneSubmissionId: string
  ): Promise<{ liked: boolean; likeCount: number }> {
    try {
      const liked = await this.repository.isLikedByUser(
        userId,
        capstoneSubmissionId
      );
      const likeCount = await this.repository.getLikeCount(
        capstoneSubmissionId
      );

      return { liked, likeCount };
    } catch (error) {
      logger.error('Error in CapstoneService.getLikeStatus:', error);
      throw error;
    }
  }

  // ==================== CAPSTONE SCREENSHOTS ====================

  async uploadScreenshot(
    submissionId: string,
    userId: string,
    file: any
  ): Promise<string> {
    try {
      const submission = await this.repository.getSubmissionById(submissionId);

      if (submission.userId !== userId) {
        throw new AppError(
          'You can only upload screenshots to your own submissions',
          403
        );
      }

      const fileExtension = path.extname(file.originalname);
      const filename = `${submissionId}_${Date.now()}_${Math.random()
        .toString(36)
        .substring(7)}${fileExtension}`;
      const uploadDir = path.join(
        process.cwd(),
        'uploads',
        'capstone-submissions'
      );
      const filePath = path.join(uploadDir, filename);
      await fs.mkdir(uploadDir, { recursive: true });

      await fs.writeFile(filePath, file.buffer);

      const screenshotUrl = `/uploads/capstone-submissions/${filename}`;

      const currentScreenshots = submission.screenshots || [];
      const updatedScreenshots = [...currentScreenshots, screenshotUrl];

      await this.repository.updateSubmission(submissionId, {
        screenshots: updatedScreenshots,
      });

      logger.info(
        `Screenshot uploaded for submission: ${submissionId}, filename: ${filename}`
      );
      return screenshotUrl;
    } catch (error) {
      logger.error('Error in CapstoneService.uploadScreenshot:', error);
      throw error;
    }
  }

  async deleteScreenshot(
    submissionId: string,
    userId: string,
    screenshotUrl: string
  ): Promise<void> {
    try {
      const submission = await this.repository.getSubmissionById(submissionId);

      if (submission.userId !== userId) {
        throw new AppError(
          'You can only delete screenshots from your own submissions',
          403
        );
      }

      const currentScreenshots = submission.screenshots || [];
      const updatedScreenshots = currentScreenshots.filter(
        (url) => url !== screenshotUrl
      );

      await this.repository.updateSubmission(submissionId, {
        screenshots: updatedScreenshots,
      });

      if (screenshotUrl.includes('/uploads/capstone-submissions/')) {
        const filename = screenshotUrl.split('/').pop();
        if (filename) {
          const filePath = path.join(
            process.cwd(),
            'uploads',
            'capstone-submissions',
            filename
          );
          try {
            await fs.unlink(filePath);
            logger.info(`Screenshot file deleted: ${filename}`);
          } catch (error) {
            logger.warn(`Failed to delete screenshot file: ${filePath}`, error);
          }
        }
      }

      logger.info(
        `Screenshot deleted from submission: ${submissionId}, URL: ${screenshotUrl}`
      );
    } catch (error) {
      logger.error('Error in CapstoneService.deleteScreenshot:', error);
      throw error;
    }
  }

  // ==================== CAPSTONE REVIEW IMAGES ====================

  async uploadReviewImage(
    reviewId: string,
    userId: string,
    file: any
  ): Promise<string> {
    try {
      const review = await this.repository.getReviewById(reviewId);

      if (review.reviewerId !== userId) {
        throw new AppError(
          'You can only upload images to your own reviews',
          403
        );
      }

      const fileExtension = path.extname(file.originalname);
      const filename = `${reviewId}_${Date.now()}_${Math.random()
        .toString(36)
        .substring(7)}${fileExtension}`;
      const uploadDir = path.join(
        process.cwd(),
        'uploads',
        'capstone-reviews'
      );
      const filePath = path.join(uploadDir, filename);

      await fs.mkdir(uploadDir, { recursive: true });

      await fs.writeFile(filePath, file.buffer);

      const imageUrl = `/uploads/capstone-reviews/${filename}`;
      const currentImages = review.images || [];
      const updatedImages = [...currentImages, imageUrl];

      await this.repository.updateReview(reviewId, {
        images: updatedImages,
      });

      logger.info(
        `Review image uploaded for review: ${reviewId}, filename: ${filename}`
      );
      return imageUrl;
    } catch (error) {
      logger.error('Error in CapstoneService.uploadReviewImage:', error);
      throw error;
    }
  }

  async deleteReviewImage(
    reviewId: string,
    userId: string,
    imageUrl: string
  ): Promise<void> {
    try {
      const review = await this.repository.getReviewById(reviewId);

      if (review.reviewerId !== userId) {
        throw new AppError(
          'You can only delete images from your own reviews',
          403
        );
      }
      // Remove image from array
      const currentImages = review.images || [];
      const updatedImages = currentImages.filter((url) => url !== imageUrl);

      await this.repository.updateReview(reviewId, {
        images: updatedImages,
      });

      if (imageUrl.includes('/uploads/capstone-reviews/')) {
        const filename = imageUrl.split('/').pop();
        if (filename) {
          const filePath = path.join(
            process.cwd(),
            'uploads',
            'capstone-reviews',
            filename
          );
          try {
            await fs.unlink(filePath);
            logger.info(`Review image file deleted: ${filename}`);
          } catch (error) {
            logger.warn(`Failed to delete review image file: ${filePath}`, error);
          }
        }
      }

      logger.info(
        `Review image deleted from review: ${reviewId}, URL: ${imageUrl}`
      );
    } catch (error) {
      logger.error('Error in CapstoneService.deleteReviewImage:', error);
      throw error;
    }
  }

  // ==================== HELPER METHODS ====================

  private parseGitHubUrl(url: string): { owner: string; repo: string } {
    try {
      // Remove trailing slash if present
      const cleanUrl = url.replace(/\/$/, '');

   
      const match = cleanUrl.match(
        /^https:\/\/github\.com\/([\w-]+)\/([\w.-]+)$/
      );

      if (!match) {
        throw new AppError('Invalid GitHub repository URL format', 400);
      }
      const [, owner, repo] = match;

      if (!owner || !repo) {
        throw new AppError('Invalid GitHub repository URL format', 400);
      }

      return { owner, repo };
    } catch (error) {
      logger.error('Error parsing GitHub URL:', error);
      throw new AppError('Invalid GitHub repository URL', 400);
    }
  }
}
