import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { logger } from "../../core/utils/loggers";
import type { CommentsService } from "./service";
import type { CreateCommentRequest, UpdateCommentRequest } from "./types";

export class CommentsController {
  private service: CommentsService;

  constructor(service: CommentsService) {
    this.service = service;
  }

  async createComment(
    request: AuthenticatedRequest,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = request.user?.uid;
      const userName = request.user?.name;
      const userEmail = request.user?.email;

      if (!userId) {
        response.status(401).json({ message: "Unauthorized" });
        return;
      }

      const data: CreateCommentRequest = request.body;
      const comment = await this.service.createComment(
        data,
        userId,
        userName,
        userEmail,
      );

      response.status(201).json({
        data: comment,
        message: "Comment created successfully",
      });
    } catch (error) {
      logger.error("Error in CommentsController.createComment:", error);
      next(error);
    }
  }

  async getCommentsForCourse(
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

      const limit = parseInt(request.query.limit as string) || 20;
      const offset = parseInt(request.query.offset as string) || 0;
      const parentId = request.query.parentId as string | undefined;

      const result = await this.service.getCommentsForCourse(
        courseId,
        limit,
        offset,
        parentId === "null" ? null : parentId,
      );

      response.status(200).json({
        data: result,
        message: "Comments retrieved successfully",
      });
    } catch (error) {
      logger.error("Error in CommentsController.getCommentsForCourse:", error);
      next(error);
    }
  }

  async getCommentById(
    request: AuthenticatedRequest,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { commentId } = request.params;
      if (!commentId) {
        response.status(400).json({ message: "Comment ID is required" });
        return;
      }

      const comment = await this.service.getCommentById(commentId);

      response.status(200).json({
        data: comment,
        message: "Comment retrieved successfully",
      });
    } catch (error) {
      logger.error("Error in CommentsController.getCommentById:", error);
      next(error);
    }
  }

  async updateComment(
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

      const { commentId } = request.params;
      if (!commentId) {
        response.status(400).json({ message: "Comment ID is required" });
        return;
      }

      const data: UpdateCommentRequest = request.body;
      const comment = await this.service.updateComment(commentId, data, userId);

      response.status(200).json({
        data: comment,
        message: "Comment updated successfully",
      });
    } catch (error) {
      logger.error("Error in CommentsController.updateComment:", error);
      next(error);
    }
  }

  async deleteComment(
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

      const { commentId } = request.params;
      if (!commentId) {
        response.status(400).json({ message: "Comment ID is required" });
        return;
      }

      // TODO: Check if user is course owner for moderation
      const isCourseOwner = false;

      await this.service.deleteComment(commentId, userId, isCourseOwner);

      response.status(200).json({
        message: "Comment deleted successfully",
      });
    } catch (error) {
      logger.error("Error in CommentsController.deleteComment:", error);
      next(error);
    }
  }

  async getMyComments(
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

      const comments = await this.service.getCommentsByUser(userId);

      response.status(200).json({
        data: comments,
        message: "User comments retrieved successfully",
        total: comments.length,
      });
    } catch (error) {
      logger.error("Error in CommentsController.getMyComments:", error);
      next(error);
    }
  }

  async getReplies(
    request: AuthenticatedRequest,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { commentId } = request.params;
      if (!commentId) {
        response.status(400).json({ message: "Comment ID is required" });
        return;
      }

      const replies = await this.service.getReplies(commentId);

      response.status(200).json({
        data: replies,
        message: "Replies retrieved successfully",
        total: replies.length,
      });
    } catch (error) {
      logger.error("Error in CommentsController.getReplies:", error);
      next(error);
    }
  }
}
