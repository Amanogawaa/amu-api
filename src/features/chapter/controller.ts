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
      const { moduleId } = request.params;
      if (!moduleId) {
        response.status(400).json({
          message: 'Module ID is required',
        });
        return;
      }

      const chapters = await this.service.getChapters(moduleId!);

      response.status(200).send(chapters);
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

  async regenerateChapters(
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { moduleId } = request.params;

      if (!moduleId) {
        response.status(400).json({
          message: 'Module ID is required',
        });
        return;
      }

      const regenerationRequest = {
        ...request.body,
        moduleId,
      };

      const result = await this.service.regenerateChapters(regenerationRequest);

      response.status(200).json({
        data: result.chapters,
        message: 'Chapters regenerated successfully',
        updated: result.updated,
        errors: result.errors.length > 0 ? result.errors : undefined,
      });
    } catch (error) {
      logger.error('Error in ChapterController.regenerateChapters:', error);
      next(error);
    }
  }

  async deleteChaptersByModuleId(
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { moduleId } = request.params;
      if (!moduleId) {
        response.status(400).json({
          message: 'Module ID is required',
        });
        return;
      }

      await this.service.deleteChaptersByModuleId(moduleId);

      response.status(200).json({
        message: 'Chapters deleted successfully',
      });
    } catch (error) {
      logger.error(
        'Error in ChapterController.deleteChaptersByModuleId:',
        error
      );
      next(error);
    }
  }
}
