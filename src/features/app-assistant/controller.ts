import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { logger } from "../../utils/loggers";
import type { AppAssistantService } from "./service";
import type { AskAppQuestionRequest } from "./types";

export class AppAssistantController {
  private service: AppAssistantService;

  constructor(service: AppAssistantService) {
    this.service = service;
  }

  async createOrGetChat(
    request: AuthenticatedRequest,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = request.user?.uid || "anonymous";
      const chat = await this.service.createOrGetChatSession(userId);

      response.status(200).json({
        data: { chat },
        message: "App chat session ready",
      });
    } catch (error) {
      logger.error("Error in AppAssistantController.createOrGetChat:", error);
      next(error);
    }
  }

  async getChatHistory(
    request: AuthenticatedRequest,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = request.user?.uid || "anonymous";
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
        message: "App chat history retrieved successfully",
      });
    } catch (error) {
      logger.error("Error in AppAssistantController.getChatHistory:", error);
      next(error);
    }
  }

  async askQuestion(
    request: AuthenticatedRequest,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = request.user?.uid || "anonymous";
      const { chatId } = request.params;
      const data: AskAppQuestionRequest = request.body;

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
        message: "Answer generated successfully",
      });
    } catch (error) {
      logger.error(
        "Error in AppAssistantController.askQuestion:",
        error,
      );
      next(error);
    }
  }

  async deleteChat(
    request: AuthenticatedRequest,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = request.user?.uid || "anonymous";
      const { chatId } = request.params;

      if (!chatId) {
        response.status(400).json({ message: "Chat ID is required" });
        return;
      }

      await this.service.deleteChat(chatId, userId);

      response.status(200).json({
        message: "App chat deleted successfully",
      });
    } catch (error) {
      logger.error("Error in AppAssistantController.deleteChat:", error);
      next(error);
    }
  }
}
