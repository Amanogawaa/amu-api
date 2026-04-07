import type { Response, NextFunction } from "express";
import { LessonService } from "./service";
import type { CreateLessonDTO, UpdateLessonDTO } from "./types";
import { sendResponse } from "../../core/utils/response";
import type { AuthenticatedRequest } from "../../core/middlewares/auth.middleware";

export class LessonController {
  private lessonService: LessonService;

  constructor(lessonService: LessonService) {
    this.lessonService = lessonService;
  }

  /**
   * Get a single lesson by ID
   */
  async getLessonById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const lessonId = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

      if (!lessonId) {
        return sendResponse(res, null, 400, "Lesson ID is required");
      }

      const lesson = await this.lessonService.getLessonById(lessonId);

      return sendResponse(res, lesson, 200, "Lesson retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all lessons for a chapter
   */
  async getLessonsByChapter(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const chapterId = Array.isArray(req.params.chapterId)
        ? req.params.chapterId[0]
        : req.params.chapterId;

      if (!chapterId) {
        return sendResponse(res, null, 400, "Chapter ID is required");
      }

      const lessons = await this.lessonService.getLessonsByChapter(chapterId);

      return sendResponse(res, lessons, 200, "Lessons retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all lessons for a course
   */
  async getLessonsByCourse(
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

      const lessons = await this.lessonService.getLessonsByCourse(courseId);

      return sendResponse(
        res,
        lessons,
        200,
        "Course lessons retrieved successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new lesson
   */
  async createLesson(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const lessonData = req.body as CreateLessonDTO;
      const lesson = await this.lessonService.createLesson(lessonData);

      return sendResponse(res, lesson, 201, "Lesson created successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update an existing lesson
   */
  async updateLesson(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const lessonId = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

      if (!lessonId) {
        return sendResponse(res, null, 400, "Lesson ID is required");
      }

      const updates = req.body as UpdateLessonDTO;
      const lesson = await this.lessonService.updateLesson(lessonId, updates);

      return sendResponse(res, lesson, 200, "Lesson updated successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a lesson
   */
  async deleteLesson(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const lessonId = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

      if (!lessonId) {
        return sendResponse(res, null, 400, "Lesson ID is required");
      }

      await this.lessonService.deleteLesson(lessonId);

      return sendResponse(res, null, 200, "Lesson deleted successfully");
    } catch (error) {
      next(error);
    }
  }
}
