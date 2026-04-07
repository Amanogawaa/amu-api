import type { Response, NextFunction } from "express";
import { ChapterService } from "./service";
import type { CreateChapterDTO, UpdateChapterDTO } from "./types";
import { sendResponse } from "../../core/utils/response";
import type { AuthenticatedRequest } from "../../core/middlewares/auth.middleware";

export class ChapterController {
  private chapterService: ChapterService;

  constructor(chapterService: ChapterService) {
    this.chapterService = chapterService;
  }

  /**
   * Get a single chapter by ID
   */
  async getChapterById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const chapterId = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

      if (!chapterId) {
        return sendResponse(res, null, 400, "Chapter ID is required");
      }

      const chapter = await this.chapterService.getChapterById(chapterId);

      return sendResponse(res, chapter, 200, "Chapter retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all chapters for a course
   */
  async getChaptersByCourse(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const courseId = Array.isArray(req.params.courseId)
        ? req.params.courseId[0]
        : req.params.courseId;

      if (!courseId) {
        return sendResponse(res, null, 400, "Course ID is required");
      }

      const chapters = await this.chapterService.getChaptersByCourse(courseId);

      return sendResponse(
        res,
        chapters,
        200,
        "Chapters retrieved successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get chapter with lesson details
   */
  async getChapterWithLessons(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const chapterId = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

      if (!chapterId) {
        return sendResponse(res, null, 400, "Chapter ID is required");
      }

      const chapter =
        await this.chapterService.getChapterWithLessons(chapterId);

      return sendResponse(
        res,
        chapter,
        200,
        "Chapter with lessons retrieved successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new chapter
   */
  async createChapter(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const chapterData = req.body as CreateChapterDTO;
      const chapter = await this.chapterService.createChapter(chapterData);

      return sendResponse(res, chapter, 201, "Chapter created successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update an existing chapter
   */
  async updateChapter(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const chapterId = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

      if (!chapterId) {
        return sendResponse(res, null, 400, "Chapter ID is required");
      }

      const updates = req.body as UpdateChapterDTO;
      const chapter = await this.chapterService.updateChapter(
        chapterId,
        updates,
      );

      return sendResponse(res, chapter, 200, "Chapter updated successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a chapter
   */
  async deleteChapter(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const chapterId = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

      if (!chapterId) {
        return sendResponse(res, null, 400, "Chapter ID is required");
      }

      await this.chapterService.deleteChapter(chapterId);

      return sendResponse(res, null, 200, "Chapter deleted successfully");
    } catch (error) {
      next(error);
    }
  }
}
