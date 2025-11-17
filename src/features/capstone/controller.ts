import { type Request, type Response, type NextFunction } from 'express';
import { logger } from '../../utils/loggers';
import type { CapstoneService } from './service';
import type { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import {
  validateCreateCapstoneSubmission,
  validateUpdateCapstoneSubmission,
  validateCreateCapstoneReview,
  validateUpdateCapstoneReview,
  capstoneSubmissionQuerySchema,
  capstoneReviewQuerySchema,
} from './validation';
import type {
  CreateCapstoneSubmissionRequest,
  UpdateCapstoneSubmissionRequest,
  CreateCapstoneReviewRequest,
  UpdateCapstoneReviewRequest,
  CapstoneSubmissionQueryParams,
  CapstoneReviewQueryParams,
} from './types';

export class CapstoneController {
  private service: CapstoneService;

  constructor(service: CapstoneService) {
    this.service = service;
  }

  // ==================== CAPSTONE GUIDELINES ====================

  getGuidelineByCourseId = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { courseId } = request.params;

      if (!courseId) {
        response.status(400).json({
          message: 'Course ID is required',
        });
        return;
      }

      const guideline = await this.service.getGuidelineByCourseId(courseId);

      response.status(200).json({
        data: guideline,
        message: 'Capstone guideline retrieved successfully',
      });
    } catch (error) {
      logger.error(
        'Error in CapstoneController.getGuidelineByCourseId:',
        error
      );
      next(error);
    }
  };

  getGuidelineById = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = request.params;

      if (!id) {
        response.status(400).json({
          message: 'Guideline ID is required',
        });
        return;
      }

      const guideline = await this.service.getGuidelineById(id);

      response.status(200).json({
        data: guideline,
        message: 'Capstone guideline retrieved successfully',
      });
    } catch (error) {
      logger.error('Error in CapstoneController.getGuidelineById:', error);
      next(error);
    }
  };

  // ==================== CAPSTONE SUBMISSIONS ====================

  createSubmission = async (
    request: AuthenticatedRequest,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = request.user?.uid;

      if (!userId) {
        response.status(401).json({
          message: 'User not authenticated',
        });
        return;
      }

      const validatedData = validateCreateCapstoneSubmission(
        request.body
      ) as CreateCapstoneSubmissionRequest;

      const submission = await this.service.createSubmission(
        userId,
        validatedData
      );

      response.status(201).json({
        data: submission,
        message: 'Capstone submission created successfully',
      });
    } catch (error) {
      logger.error('Error in CapstoneController.createSubmission:', error);
      next(error);
    }
  };

  getSubmissions = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const validatedQuery = capstoneSubmissionQuerySchema.parse(request.query);

      const queryParams: CapstoneSubmissionQueryParams = {
        courseId: validatedQuery.courseId,
        userId: validatedQuery.userId,
        sortBy: validatedQuery.sortBy,
        limit: validatedQuery.limit,
        offset: validatedQuery.offset,
      };

      const result = await this.service.getSubmissions(queryParams);

      response.status(200).json({
        data: result,
        message: 'Capstone submissions retrieved successfully',
      });
    } catch (error) {
      logger.error('Error in CapstoneController.getSubmissions:', error);
      next(error);
    }
  };

  getSubmissionById = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = request.params;

      if (!id) {
        response.status(400).json({
          message: 'Submission ID is required',
        });
        return;
      }

      // Increment view count (unless it's the owner viewing)
      const incrementView = true; // You can modify this logic if needed

      const submission = await this.service.getSubmissionById(
        id,
        incrementView
      );

      response.status(200).json({
        data: submission,
        message: 'Capstone submission retrieved successfully',
      });
    } catch (error) {
      logger.error('Error in CapstoneController.getSubmissionById:', error);
      next(error);
    }
  };

  updateSubmission = async (
    request: AuthenticatedRequest,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = request.params;
      const userId = request.user?.uid;

      if (!id) {
        response.status(400).json({
          message: 'Submission ID is required',
        });
        return;
      }

      if (!userId) {
        response.status(401).json({
          message: 'User not authenticated',
        });
        return;
      }

      const validatedData = validateUpdateCapstoneSubmission(
        request.body
      ) as UpdateCapstoneSubmissionRequest;

      const submission = await this.service.updateSubmission(
        id,
        userId,
        validatedData
      );

      response.status(200).json({
        data: submission,
        message: 'Capstone submission updated successfully',
      });
    } catch (error) {
      logger.error('Error in CapstoneController.updateSubmission:', error);
      next(error);
    }
  };

  deleteSubmission = async (
    request: AuthenticatedRequest,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = request.params;
      const userId = request.user?.uid;

      if (!id) {
        response.status(400).json({
          message: 'Submission ID is required',
        });
        return;
      }

      if (!userId) {
        response.status(401).json({
          message: 'User not authenticated',
        });
        return;
      }

      await this.service.deleteSubmission(id, userId);

      response.status(200).json({
        message: 'Capstone submission deleted successfully',
      });
    } catch (error) {
      logger.error('Error in CapstoneController.deleteSubmission:', error);
      next(error);
    }
  };

  // ==================== CAPSTONE REVIEWS ====================

  createReview = async (
    request: AuthenticatedRequest,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = request.user?.uid;
      const userEmail = request.user?.email;
      const userName = request.user?.name || request.user?.email || 'Anonymous';

      if (!userId || !userEmail) {
        response.status(401).json({
          message: 'User not authenticated',
        });
        return;
      }

      const validatedData = validateCreateCapstoneReview(
        request.body
      ) as CreateCapstoneReviewRequest;

      const review = await this.service.createReview(
        userId,
        userEmail,
        userName,
        validatedData
      );

      response.status(201).json({
        data: review,
        message: 'Review created successfully',
      });
    } catch (error) {
      logger.error('Error in CapstoneController.createReview:', error);
      next(error);
    }
  };

  getReviews = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const validatedQuery = capstoneReviewQuerySchema.parse(request.query);

      const queryParams: CapstoneReviewQueryParams = {
        capstoneSubmissionId: validatedQuery.capstoneSubmissionId,
        reviewerId: validatedQuery.reviewerId,
        limit: validatedQuery.limit,
        offset: validatedQuery.offset,
      };

      const result = await this.service.getReviews(queryParams);

      response.status(200).json({
        data: result,
        message: 'Reviews retrieved successfully',
      });
    } catch (error) {
      logger.error('Error in CapstoneController.getReviews:', error);
      next(error);
    }
  };

  getReviewById = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = request.params;

      if (!id) {
        response.status(400).json({
          message: 'Review ID is required',
        });
        return;
      }

      const review = await this.service.getReviewById(id);

      response.status(200).json({
        data: review,
        message: 'Review retrieved successfully',
      });
    } catch (error) {
      logger.error('Error in CapstoneController.getReviewById:', error);
      next(error);
    }
  };

  updateReview = async (
    request: AuthenticatedRequest,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = request.params;
      const userId = request.user?.uid;

      if (!id) {
        response.status(400).json({
          message: 'Review ID is required',
        });
        return;
      }

      if (!userId) {
        response.status(401).json({
          message: 'User not authenticated',
        });
        return;
      }

      const validatedData = validateUpdateCapstoneReview(
        request.body
      ) as UpdateCapstoneReviewRequest;

      const review = await this.service.updateReview(id, userId, validatedData);

      response.status(200).json({
        data: review,
        message: 'Review updated successfully',
      });
    } catch (error) {
      logger.error('Error in CapstoneController.updateReview:', error);
      next(error);
    }
  };

  deleteReview = async (
    request: AuthenticatedRequest,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = request.params;
      const userId = request.user?.uid;

      if (!id) {
        response.status(400).json({
          message: 'Review ID is required',
        });
        return;
      }

      if (!userId) {
        response.status(401).json({
          message: 'User not authenticated',
        });
        return;
      }

      await this.service.deleteReview(id, userId);

      response.status(200).json({
        message: 'Review deleted successfully',
      });
    } catch (error) {
      logger.error('Error in CapstoneController.deleteReview:', error);
      next(error);
    }
  };

  // ==================== CAPSTONE LIKES ====================

  toggleLike = async (
    request: AuthenticatedRequest,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = request.params;
      const userId = request.user?.uid;

      if (!id) {
        response.status(400).json({
          message: 'Submission ID is required',
        });
        return;
      }

      if (!userId) {
        response.status(401).json({
          message: 'User not authenticated',
        });
        return;
      }

      const result = await this.service.toggleLike(userId, id);

      response.status(200).json({
        data: result,
        message: result.liked ? 'Submission liked' : 'Submission unliked',
      });
    } catch (error) {
      logger.error('Error in CapstoneController.toggleLike:', error);
      next(error);
    }
  };

  getLikeStatus = async (
    request: AuthenticatedRequest,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = request.params;
      const userId = request.user?.uid;

      if (!id) {
        response.status(400).json({
          message: 'Submission ID is required',
        });
        return;
      }

      if (!userId) {
        response.status(401).json({
          message: 'User not authenticated',
        });
        return;
      }

      const result = await this.service.getLikeStatus(userId, id);

      response.status(200).json({
        data: result,
        message: 'Like status retrieved successfully',
      });
    } catch (error) {
      logger.error('Error in CapstoneController.getLikeStatus:', error);
      next(error);
    }
  };
}
