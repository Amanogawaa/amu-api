import { AppError } from '../../core/utils/errors';
import { logger } from '../../core/utils/loggers';
import { AuthenticatedRequest } from '../../core/middlewares/auth';
import { UserCourseService } from './service';
import { type Request, type Response } from 'express';

export class UserCourseController {
  private service: UserCourseService;

  constructor(service: UserCourseService) {
    this.service = service;
  }

  async enroll(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { courseId } = req.body;

      if (!courseId || typeof courseId !== 'string' || courseId.trim() === '') {
        throw new AppError('Valid courseId is required', 400);
      }

      const result = await this.service.enroll(userId, courseId.trim());

      res.status(201).json({
        data: result,
        status: 'success',
      });
    } catch (error) {
      logger.error('Error in UserCourseController enroll:', error);
      const status = error instanceof AppError ? error.statusCode : 500;
      res.status(status).json({
        error: (error as Error).message,
        status: 'error',
      });
    }
  }

  async markLessonCompleted(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { lessonId, score } = req.body;

      if (!lessonId || typeof lessonId !== 'string' || lessonId.trim() === '') {
        throw new AppError('Valid lessonId is required', 400);
      }

      if (
        score !== undefined &&
        (!Number.isInteger(score) || score < 0 || score > 100)
      ) {
        throw new AppError('Score must be an integer between 0 and 100', 400);
      }

      await this.service.markLessonCompleted(userId, lessonId.trim(), score);

      res.json({
        data: { message: 'Lesson marked as completed' },
        status: 'success',
      });
    } catch (error) {
      logger.error('Error in UserCourseController markLessonCompleted:', error);
      const status = error instanceof AppError ? error.statusCode : 500;
      res.status(status).json({
        error: (error as Error).message,
        status: 'error',
      });
    }
  }

  async getProgress(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { courseId } = req.params;

      if (!courseId || courseId.trim() === '') {
        throw new AppError('Valid courseId is required', 400);
      }

      const progress = await this.service.getProgress(userId, courseId.trim());

      res.json({
        data: progress,
        status: 'success',
      });
    } catch (error) {
      logger.error('Error in UserCourseController getProgress:', error);
      const status = error instanceof AppError ? error.statusCode : 500;
      res.status(status).json({
        error: (error as Error).message,
        status: 'error',
      });
    }
  }
}
