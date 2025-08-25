import { AppError } from '../../core/utils/errors';
import { logger } from '../../core/utils/loggers';
import { ChapterService } from './service';
import { GenerateChaptersRequest } from './types';
import { type Request, type Response } from 'express';

export class ChapterController {
  private service: ChapterService;

  constructor(service: ChapterService) {
    this.service = service;
  }

  async generateChapters(req: Request, res: Response) {
    try {
      const {
        courseId,
        title,
        description,
        learningOutcomes,
        duration,
        noOfChapters,
        level,
        language,
      } = req.body as GenerateChaptersRequest;

      if (!courseId || !title || !description) {
        throw new AppError(
          'Missing required fields: courseId, title, description',
          400
        );
      }

      if (!Array.isArray(learningOutcomes) || learningOutcomes.length === 0) {
        throw new AppError('learningOutcomes must be a non-empty array', 400);
      }

      if (!Number.isInteger(noOfChapters) || noOfChapters <= 0) {
        throw new AppError('noOfChapters must be a positive integer', 400);
      }

      if (!courseId.trim() || !title.trim() || !description.trim()) {
        throw new AppError(
          'courseId, title, and description must be non-empty strings',
          400
        );
      }

      if (!duration || !level || !language) {
        throw new AppError(
          'Missing required fields: duration, level, language',
          400
        );
      }

      // Call service
      const result = await this.service.generateAndCreateChapters({
        courseId: courseId.trim(),
        title: title.trim(),
        description: description.trim(),
        learningOutcomes,
        duration: duration.trim(),
        noOfChapters,
        level: level.trim(),
        language: language.trim(),
      });

      res.status(201).json({ data: result, status: 'success' });
    } catch (error) {
      logger.error('Error in ChapterController generateChapters:', error);
      const status = error instanceof AppError ? error.statusCode : 500;
      res
        .status(status)
        .json({ error: (error as Error).message, status: 'error' });
    }
  }

  async getChaptersByCourse(req: Request, res: Response) {
    try {
      const { courseId } = req.params;

      if (!courseId || courseId.trim() === '') {
        throw new AppError('Course ID is required', 400);
      }

      const chapters = await this.service.getChaptersByCourse(courseId.trim());

      res.json({ data: chapters, status: 'success' });
    } catch (error) {
      logger.error('Error in ChapterController getChaptersByCourse:', error);
      const status = error instanceof AppError ? error.statusCode : 500;
      res
        .status(status)
        .json({ error: (error as Error).message, status: 'error' });
    }
  }
}
