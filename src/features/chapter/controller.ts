import { logger } from '../../utils/loggers';
import type { ChapterService } from './service';
import type { NextFunction, Request, Response } from 'express';

export class ChapterController {
  private service: ChapterService;

  constructor(service: ChapterService) {
    this.service = service;
  }

  async getChapters(
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { courseId } = request.params;
      const chapters = await this.service.getChapters(courseId!);

      response.status(200).json({
        data: chapters,
        message: 'Chapters retrieved successfully',
      });
    } catch (error) {
      logger.error('Error in ChapterController.getChapters:', error);
      next(error);
    }
  }

  async generateChapter(
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const chapterRequest = request.body;
      const createdChapter = await this.service.generateChapters(
        chapterRequest
      );

      response.status(201).json({
        data: createdChapter,
        message: 'Chapter generated successfully',
      });
    } catch (error) {
      logger.error('Error in ChapterController.generateChapter:', error);
      next(error);
    }
  }
}
