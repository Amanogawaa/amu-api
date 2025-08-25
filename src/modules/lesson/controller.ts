import z from 'zod';
import { AppError } from '../../core/utils/errors';
import { logger } from '../../core/utils/loggers';
import { LessonService } from './service';
import { GenerateLessonsRequest } from './types';
import { type Request, type Response } from 'express';

export class LessonController {
  private service: LessonService;

  constructor(service: LessonService) {
    this.service = service;
  }

  async generateLessons(req: Request, res: Response) {
    try {
      const {
        chapterId,
        chapterTitle,
        chapterDescription,
        chapterOrder,
        estimatedDuration,
        courseName,
        level,
        language,
      } = req.body as GenerateLessonsRequest;

      if (!chapterId || !chapterTitle || !courseName) {
        throw new AppError(
          'Missing required fields: chapterId, chapterTitle, courseName',
          400
        );
      }

      // Validate string fields are not empty
      if (!chapterId.trim() || !chapterTitle.trim() || !courseName.trim()) {
        throw new AppError(
          'chapterId, chapterTitle, and courseName must be non-empty strings',
          400
        );
      }

      const result = await this.service.generateAndCreateLessons({
        chapterId: chapterId.trim(),
        chapterTitle: chapterTitle.trim(),
        chapterDescription: chapterDescription?.trim() || '',
        chapterOrder: chapterOrder || 1,
        estimatedDuration: estimatedDuration?.trim() || '1h',
        courseName: courseName.trim(),
        level: level?.trim() || 'beginner',
        language: language?.trim() || 'en',
      });

      res.status(201).json({ data: result, status: 'success' });
    } catch (error) {
      logger.error('Error in LessonController generateLessons:', error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid lesson data structure',
          details: error.issues,
          status: 'error',
        });
      }

      const status = error instanceof AppError ? error.statusCode : 500;
      res
        .status(status)
        .json({ error: (error as Error).message, status: 'error' });
    }
  }

  async getLessonsByChapter(req: Request, res: Response) {
    try {
      const { chapterId } = req.params;

      if (!chapterId || chapterId.trim() === '') {
        throw new AppError('Chapter ID is required', 400);
      }

      const lessons = await this.service.getLessonsByChapter(chapterId.trim());

      res.json({ data: lessons, status: 'success' });
    } catch (error) {
      logger.error('Error in LessonController getLessonsByChapter:', error);
      const status = error instanceof AppError ? error.statusCode : 500;
      res
        .status(status)
        .json({ error: (error as Error).message, status: 'error' });
    }
  }

  async getLessonById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id || id.trim() === '') {
        throw new AppError('Lesson ID is required', 400);
      }

      const lesson = await this.service.getLessonById(id.trim());

      res.json({ data: lesson, status: 'success' });
    } catch (error) {
      logger.error('Error in LessonController getLessonById:', error);
      const status = error instanceof AppError ? error.statusCode : 500;
      res
        .status(status)
        .json({ error: (error as Error).message, status: 'error' });
    }
  }

  async getLessonResources(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id || id.trim() === '') {
        throw new AppError('Lesson ID is required', 400);
      }

      const resources = await this.service.getLessonResources(id.trim());

      res.json({ data: resources, status: 'success' });
    } catch (error) {
      logger.error('Error in LessonController getLessonResources:', error);
      const status = error instanceof AppError ? error.statusCode : 500;
      res
        .status(status)
        .json({ error: (error as Error).message, status: 'error' });
    }
  }
}
