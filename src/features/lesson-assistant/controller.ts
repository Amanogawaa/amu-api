import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { logger } from "../../utils/loggers";
import type { LessonAssistantService } from "./service";
import type { AskQuestionRequest } from "./types";

export class LessonAssistantController {
  private service: LessonAssistantService;

  constructor(service: LessonAssistantService) {
    this.service = service;
  }

  async createOrGetChat(
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

      const { lessonId } = request.params;

      if (!lessonId) {
        response.status(400).json({ message: "Lesson ID is required" });
        return;
      }

      const chat = await this.service.createOrGetChatSession(lessonId, userId);

      response.status(200).json({
        data: { chat },
        message: "Chat session ready",
      });
    } catch (error) {
      logger.error("Error in LessonAssistantController.createOrGetChat:");
      next(error);
    }
  }

  async getChatHistory(
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

      const { chatId } = request.params;
      const limit = Number.parseInt(request.query.limit as string) || 50;

      if (!chatId) {
        response.status(400).json({ message: "Chat ID is required" });
        return;
      }

      const { chat, messages } = await this.service.getChatHistory(
        chatId,
        userId,
        limit,
      );

      response.status(200).json({
        data: {
          chat,
          messages,
          total: messages.length,
        },
        message: "Chat history retrieved successfully",
      });
    } catch (error) {
      logger.error("Error in LessonAssistantController.getChatHistory:", error);
      next(error);
    }
  }

  async askQuestion(
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

      const { chatId } = request.params;
      const data: AskQuestionRequest = request.body;

      if (!chatId) {
        response.status(400).json({ message: "Chat ID is required" });
        return;
      }

      const message = await this.service.askQuestion(
        chatId,
        data.question,
        userId,
      );

      response.status(200).json({
        data: { message },
        message: "Question answered successfully",
      });
    } catch (error) {
      logger.error("Error in LessonAssistantController.askQuestion:", error);
      next(error);
    }
  }

  async deleteChat(
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

      const { chatId } = request.params;

      if (!chatId) {
        response.status(400).json({ message: "Chat ID is required" });
        return;
      }

      await this.service.deleteChat(chatId, userId);

      response.status(200).json({
        message: "Chat deleted successfully",
      });
    } catch (error) {
      logger.error("Error in LessonAssistantController.deleteChat:", error);
      next(error);
    }
  }
}
