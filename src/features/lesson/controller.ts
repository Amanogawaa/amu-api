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

  async getLessonById(
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { lessonId } = request.params;
      const lesson = await this.service.getLessonById(lessonId!);

      response.status(200).json({
        data: lesson,
        message: 'Lesson retrieved successfully',
      });
    } catch (error) {
      logger.error('Error in LessonController.getLessonById:', error);
      next(error);
    }
  }

  async updateLesson(
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { lessonId } = request.params;
      const lessonData = request.body;
      const updatedLesson = await this.service.updateLesson(
        lessonId!,
        lessonData
      );

      response.status(200).json({
        data: updatedLesson,
        message: 'Lesson updated successfully',
      });
    } catch (error) {
      logger.error('Error in LessonController.updateLesson:', error);
      next(error);
    }
  }

  async deleteLesson(
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { lessonId } = request.params;
      await this.service.deleteLesson(lessonId!);

      response.status(200).json({
        message: 'Lesson deleted successfully',
      });
    } catch (error) {
      logger.error('Error in LessonController.deleteLesson:', error);
      next(error);
    }
  }
}
