import { AppError } from '../../utils/errors';
import { logger } from '../../utils/loggers';
import { CapstoneRepository } from './repository';
import type {
  CapstoneGuideline,
  CapstoneSubmission,
  CapstoneReview,
  CreateCapstoneSubmissionRequest,
  UpdateCapstoneSubmissionRequest,
  CreateCapstoneReviewRequest,
  UpdateCapstoneReviewRequest,
  CapstoneSubmissionQueryParams,
  CapstoneReviewQueryParams,
  GenerateCapstoneGuidelineRequest,
  GitHubRepoMetadata,
} from './types';
import { geminiCall } from '../../utils/geminiCall';
import { generateCapstonePrompt } from '../../utils/prompts/capstone-temp';
import type { GitHubService } from '../github/service';

export class CapstoneService {
  private repository: CapstoneRepository;
  private githubService: GitHubService;

  constructor(repository: CapstoneRepository, githubService: GitHubService) {
    this.repository = repository;
    this.githubService = githubService;
  }

  // ==================== CAPSTONE GUIDELINES ====================

  async generateGuideline(
    request: GenerateCapstoneGuidelineRequest
  ): Promise<CapstoneGuideline> {
    try {
      // Check if guideline already exists for this course
      const existing = await this.repository.getGuidelineByCourseId(
        request.courseId
      );

      if (existing) {
        logger.info(
          `Capstone guideline already exists for course: ${request.courseId}`
        );
        return existing;
      }

      const prompt = generateCapstonePrompt(request);

      // For capstone generation, we don't use a strict schema
      // as the response structure is flexible
      const result = await geminiCall(prompt, {
        responseSchema: {}, // Empty schema for flexible response
        temperature: 0.7,
        maxRetries: 3,
      });

      logger.info('Capstone guideline generated successfully');

      const guidelineData = {
        courseId: request.courseId,
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
      // Validate guideline exists
      await this.repository.getGuidelineById(request.guidelineId);

      // Check if user already submitted this repo
      const exists = await this.repository.submissionExistsByRepo(
        userId,
        request.githubRepoUrl
      );

      if (exists) {
        throw new AppError('You have already submitted this repository', 400);
      }

      // Extract owner and repo name from URL
      const { owner, repo } = this.parseGitHubUrl(request.githubRepoUrl);

      // Fetch repo metadata from GitHub
      const repoMetadata = await this.githubService.getRepoMetadata(
        owner,
        repo
      );

      // Verify repo owner matches the submitting user's GitHub account
      // This is optional - you can skip this check if you don't want to enforce it
      // const githubConnection = await this.githubService.getConnection(userId);
      // if (githubConnection && githubConnection.githubUsername !== owner) {
      //   throw new AppError('You can only submit your own repositories', 403);
      // }

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

      // Check ownership
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

      // Check ownership
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
      // Validate submission exists
      const submission = await this.repository.getSubmissionById(
        request.capstoneSubmissionId
      );

      // Prevent reviewing own submission
      if (submission.userId === userId) {
        throw new AppError('You cannot review your own submission', 400);
      }

      // Check if user already reviewed this submission
      const alreadyReviewed = await this.repository.reviewExists(
        userId,
        request.capstoneSubmissionId
      );

      if (alreadyReviewed) {
        throw new AppError('You have already reviewed this submission', 400);
      }

      const reviewData = {
        capstoneSubmissionId: request.capstoneSubmissionId,
        reviewerId: userId,
        reviewerName: userName,
        reviewerEmail: userEmail,
        rating: request.rating,
        feedback: request.feedback,
        highlights: request.highlights,
        suggestions: request.suggestions,
        criteriaScores: request.criteriaScores,
      };

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
        const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
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

      // Check ownership
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

      // Check ownership
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
      // Validate submission exists
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

  // ==================== HELPER METHODS ====================

  private parseGitHubUrl(url: string): { owner: string; repo: string } {
    try {
      // Remove trailing slash if present
      const cleanUrl = url.replace(/\/$/, '');

      // Extract owner and repo from URL
      // Format: https://github.com/owner/repo
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
