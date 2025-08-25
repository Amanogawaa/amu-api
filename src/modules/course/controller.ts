import { CourseService } from './service';
import { type Request, type Response } from 'express';
import { logger } from '../../core/utils/loggers';
import { AppError } from '../../core/utils/errors';
import { GenerateCourseRequest } from './type';

export class CourseController {
  private service: CourseService;

  constructor(service: CourseService) {
    this.service = service;
  }

  async generateCourse(req: Request, res: Response) {
    try {
      const { category, topic, level, duration, noOfChapters, language } =
        req.body as GenerateCourseRequest;

      if (!category || !topic || !level || !duration || !language) {
        throw new AppError(
          'Missing required fields: category, topic, level, duration, language',
          400
        );
      }

      if (!Number.isInteger(noOfChapters) || noOfChapters <= 0) {
        throw new AppError('noOfChapters must be a positive integer', 400);
      }

      const result = await this.service.generateCourse({
        category,
        topic,
        level,
        duration,
        noOfChapters,
        language,
      });

      res.status(201).json({ data: result, status: 'success' });
    } catch (error) {
      logger.error('Error in CourseController generateCourse:', error);
      const status = error instanceof AppError ? error.statusCode : 500;
      res
        .status(status)
        .json({ error: (error as Error).message, status: 'error' });
    }
  }

  async getCourses(req: Request, res: Response) {
    try {
      const id = req.query.id as string | undefined;
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const offset = req.query.offset ? Number(req.query.offset) : 0;

      if (id && (typeof id !== 'string' || id.trim() === '')) {
        throw new AppError('Invalid course ID', 400);
      }
      if (!Number.isInteger(limit) || limit <= 0) {
        throw new AppError('Invalid limit', 400);
      }
      if (!Number.isInteger(offset) || offset < 0) {
        throw new AppError('Invalid offset', 400);
      }

      const courses = await this.service.getCourse(id, limit, offset);

      res.json({ data: courses, status: 'success' });
    } catch (error) {
      logger.error('Error in CourseController:', error);
      const status = error instanceof AppError ? error.statusCode : 500;
      res
        .status(status)
        .json({ error: (error as Error).message, status: 'error' });
    }
  }
}
