import type { Request, Response, NextFunction } from 'express';
import type { LessonService } from './service';
import { logger } from '../../utils/loggers';

export class LessonController {
  private service: LessonService;

  constructor(service: LessonService) {
    this.service = service;
  }

  async getLessons(
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { chapterId } = request.params;
      const lessons = await this.service.getLessons(chapterId!);

      response.status(200).json({
        data: lessons,
        message: 'Lessons retrieved successfully',
      });
    } catch (error) {
      logger.error('Error in LessonController.getLessons:', error);
      next(error);
    }
  }

  async generateLessons(
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const lessonRequest = request.body;
      const createdLessons = await this.service.generateLessons(lessonRequest);

      response.status(201).json({
        data: createdLessons,
        message: 'Lessons generated successfully',
      });
    } catch (error) {
      logger.error('Error in LessonController.generateLessons:', error);
      next(error);
    }
  }
}
