import type { NextFunction, Request, Response } from "express";
import { logger } from "../../utils/loggers";
import { notifyChapterCreated } from "../../utils/socket/socket.helpers";
import type { ChapterService } from "./service";

export class ChapterController {
  private service: ChapterService;

  constructor(service: ChapterService) {
    this.service = service;
  }

  async getChapters(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { courseId } = request.params;
      if (!courseId) {
        response.status(400).json({
          message: "Course ID is required",
        });
        return;
      }

      const chapters = await this.service.getChapters(courseId!);

      response.status(200).send(chapters);
    } catch (error) {
      logger.error("Error in ChapterController.getChapters:", error);
      next(error);
    }
  }

  async getChapter(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { chapterId } = request.params;
      if (!chapterId) {
        response.status(400).json({
          message: "Chapter ID is required",
        });
        return;
      }

      const chapter = await this.service.getChapter(chapterId);
      response.status(200).json(chapter);
    } catch (error) {
      logger.error("Error in ChapterController.getChapter:", error);
      next(error);
    }
  }

  async generateChapter(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const chapterRequest = request.body;
      const createdChapter =
        await this.service.generateChapters(chapterRequest);

      notifyChapterCreated(request, chapterRequest.courseId, createdChapter);

      response.status(201).json({
        data: createdChapter,
        message: "Chapter generated successfully",
      });
    } catch (error) {
      logger.error("Error in ChapterController.generateChapter:", error);
      next(error);
    }
  }

  async deleteChaptersByCourseId(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { courseId } = request.params;
      if (!courseId) {
        response.status(400).json({
          message: "Course ID is required",
        });
        return;
      }

      await this.service.deleteChaptersByCourseId(courseId);

      response.status(200).json({
        message: "Chapters deleted successfully",
      });
    } catch (error) {
      logger.error(
        "Error in ChapterController.deleteChapterByCourseId:",
        error,
      );
      next(error);
    }
  }
}
