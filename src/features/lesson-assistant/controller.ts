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

  /**
   * SSE (Server-Sent Events) Streaming Endpoint
   *
   * HOW SSE WORKS:
   * 1. Client opens a persistent HTTP connection
   * 2. Server keeps connection open and sends data as "events"
   * 3. Each event is formatted as: "data: <content>\n\n"
   * 4. Client receives chunks in real-time as they're sent
   * 5. Connection stays open until complete or error occurs
   */
  async askQuestionStream(
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

      // SSE Headers: Tell client this is a stream, not a regular response
      response.setHeader("Content-Type", "text/event-stream");
      response.setHeader("Cache-Control", "no-cache");
      response.setHeader("Connection", "keep-alive");
      // Allow compression to work with streaming
      response.setHeader("X-Accel-Buffering", "no");

      let fullContent = "";

      // Callback function that sends each chunk to the client
      const onChunk = (chunk: string) => {
        fullContent += chunk;
        // SSE format: "data: " prefix, followed by content, then double newline
        response.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      };

      // Call streaming service method
      const message = await this.service.streamResponse(
        chatId,
        data.question,
        userId,
        onChunk,
      );

      // Send final event with complete message metadata
      response.write(`data: ${JSON.stringify({ done: true, message })}\n\n`);

      // Close the connection
      response.end();

      logger.info("Streaming completed", {
        chatId,
        contentLength: fullContent.length,
      });
    } catch (error) {
      logger.error(
        "Error in LessonAssistantController.askQuestionStream:",
        error,
      );

      // Send error event before closing
      response.write(
        `data: ${JSON.stringify({ error: "Failed to stream response" })}\n\n`,
      );
      response.end();
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
