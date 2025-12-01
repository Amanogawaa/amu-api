import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { logger } from "../../utils/loggers";
import type { LikesService } from "./service";

export class LikesController {
  private service: LikesService;

  constructor(service: LikesService) {
    this.service = service;
  }

  async toggleLike(
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

      const result = await this.service.toggleLike(courseId, userId);

      response.status(200).json({
        data: result,
        message: result.liked ? "Course liked" : "Course unliked",
      });
    } catch (error) {
      logger.error("Error in LikesController.toggleLike:", error);
      next(error);
    }
  }

  async getLikeStatus(
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

      const status = await this.service.getLikeStatus(courseId, userId);

      response.status(200).json({
        data: status,
        message: "Like status retrieved successfully",
      });
    } catch (error) {
      logger.error("Error in LikesController.getLikeStatus:", error);
      next(error);
    }
  }

  async getLikesForCourse(
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

      const limit = parseInt(request.query.limit as string) || 50;
      const offset = parseInt(request.query.offset as string) || 0;

      const result = await this.service.getLikesForCourse(
        courseId,
        limit,
        offset,
      );

      response.status(200).json({
        data: result,
        message: "Likes retrieved successfully",
      });
    } catch (error) {
      logger.error("Error in LikesController.getLikesForCourse:", error);
      next(error);
    }
  }

  async getMyLikes(
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

      const likes = await this.service.getLikesByUser(userId);

      response.status(200).json({
        data: likes,
        message: "User likes retrieved successfully",
        total: likes.length,
      });
    } catch (error) {
      logger.error("Error in LikesController.getMyLikes:", error);
      next(error);
    }
  }
}
