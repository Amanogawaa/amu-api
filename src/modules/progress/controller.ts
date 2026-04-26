import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { logger } from "../../core/utils/loggers";
import type { ProgressService } from "./service";
import type { ProgressFilters, ProgressUpdateRequest } from "./types";

export class ProgressController {
  private service: ProgressService;

  constructor(service: ProgressService) {
    this.service = service;
  }

  async markLessonProgress(
    request: AuthenticatedRequest,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = request.user?.uid;
      if (!userId) {
        response.status(401).json({ message: "Unauthorized" });
        return;
      }

      const data: ProgressUpdateRequest = request.body;
      const progress = await this.service.markLessonProgress(userId, data);

      response.status(200).json({
        data: progress,
        message: "Progress updated successfully",
      });
    } catch (error) {
      logger.error("Error in ProgressController.markLessonProgress:", error);
      next(error);
    }
  }

  async getProgressForCourse(
    request: AuthenticatedRequest,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = request.user?.uid;
      if (!userId) {
        response.status(401).json({ message: "Unauthorized" });
        return;
      }

      const { courseId } = request.params;
      if (!courseId) {
        response.status(400).json({ message: "Course ID is required" });
        return;
      }
      const progress = await this.service.getProgressForCourse(
        courseId,
        userId,
      );

      if (!progress) {
        response.status(404).json({
          message: "No progress found for this course",
        });
        return;
      }

      response.status(200).json({
        data: progress,
        message: "Progress retrieved successfully",
      });
    } catch (error) {
      logger.error("Error in ProgressController.getProgressForCourse:", error);
      next(error);
    }
  }

  async getProgressForUser(
    request: AuthenticatedRequest,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = request.user?.uid;
      if (!userId) {
        response.status(401).json({ message: "Unauthorized" });
        return;
      }

      const progress = await this.service.getProgressForUser(userId);

      response.status(200).json({
        data: progress,
        message: "All progress retrieved successfully",
        total: progress.length,
      });
    } catch (error) {
      logger.error("Error in ProgressController.getProgressForUser:", error);
      next(error);
    }
  }

  async getProgressSummary(
    request: AuthenticatedRequest,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = request.user?.uid;

      if (!userId) {
        response.status(401).json({ message: "Unauthorized" });
        return;
      }

      const queryParams: ProgressFilters = {
        isPublished:
          request.query.isPublished === "true"
            ? true
            : request.query.isPublished === "false"
              ? false
              : undefined,
        status:
          typeof request.query.status === "string"
            ? request.query.status
            : undefined,
        minProgress: request.query.minProgress
          ? Number(request.query.minProgress)
          : undefined,
      };

      const summary = await this.service.getProgressSummary(
        userId,
        queryParams,
      );

      response.status(200).json({
        data: summary,
        message: "Progress summary retrieved successfully",
      });
    } catch (error) {
      logger.error("Error in ProgressController.getProgressSummary:", error);
      next(error);
    }
  }

  async getCourseStatistics(
    request: AuthenticatedRequest,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { courseId } = request.params;
      if (!courseId) {
        response.status(400).json({ message: "Course ID is required" });
        return;
      }
      const stats = await this.service.getCourseStatistics(courseId);

      response.status(200).json({
        data: stats,
        message: "Course statistics retrieved successfully",
      });
    } catch (error) {
      logger.error("Error in ProgressController.getCourseStatistics:", error);
      next(error);
    }
  }

  async deleteProgress(
    request: AuthenticatedRequest,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = request.user?.uid;
      if (!userId) {
        response.status(401).json({ message: "Unauthorized" });
        return;
      }

      const { courseId } = request.params;
      if (!courseId) {
        response.status(400).json({ message: "Course ID is required" });
        return;
      }
      await this.service.deleteProgress(courseId, userId);

      response.status(200).json({
        message: "Progress deleted successfully",
      });
    } catch (error) {
      logger.error("Error in ProgressController.deleteProgress:", error);
      next(error);
    }
  }
}
