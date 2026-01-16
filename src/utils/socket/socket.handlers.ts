/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Server as SocketIOServer } from "socket.io";
import { logger } from "../loggers";
import type { AuthenticatedSocket } from "../../middlewares/socket.middleware";

export class SocketHandlers {
  public io: SocketIOServer;

  constructor(io: SocketIOServer) {
    this.io = io;
  }

  public registerHandlers(): void {
    this.io.on("connection", (socket: AuthenticatedSocket) => {
      logger.info(`User ${socket.userId} connected with socket ${socket.id}`);

      if (socket.userId) {
        socket.join(`user:${socket.userId}`);
        logger.info(`User ${socket.userId} joined personal room`);
      }

      this.handleCourseEvents(socket);

      this.handleProgressEvents(socket);

      this.handleCommentEvents(socket);

      this.handleChapterEvents(socket);

      this.handleAssistantEvents(socket);

      socket.on("disconnect", (reason) => {
        logger.info(`User ${socket.userId} disconnected: ${reason}`);
      });
    });
  }

  private handleCourseEvents(socket: AuthenticatedSocket): void {
    socket.on("course:join", (courseId: string) => {
      socket.join(`course:${courseId}`);
      logger.info(`User ${socket.userId} joined course ${courseId}`);
      socket.emit("course:joined", { courseId });
    });

    socket.on("course:leave", (courseId: string) => {
      socket.leave(`course:${courseId}`);
      logger.info(`User ${socket.userId} left course ${courseId}`);
      socket.emit("course:left", { courseId });
    });
  }

  private handleChapterEvents(socket: AuthenticatedSocket): void {
    socket.on("chapter:join", (chapterId: string) => {
      socket.join(`chapter:${chapterId}`);
      logger.info(`User ${socket.userId} joined chapter ${chapterId}`);
      socket.emit("chapter:joined", { chapterId });
    });

    socket.on("chapter:leave", (chapterId: string) => {
      socket.leave(`chapter:${chapterId}`);
      logger.info(`User ${socket.userId} left chapter ${chapterId}`);
      socket.emit("chapter:left", { chapterId });
    });
  }

  private handleProgressEvents(socket: AuthenticatedSocket): void {
    socket.on(
      "progress:lesson",
      (data: { lessonId: string; progress: number }) => {
        logger.info(
          `User ${socket.userId} progress on lesson ${data.lessonId}: ${data.progress}%`,
        );
        this.io.to(`user:${socket.userId}`).emit("progress:updated", {
          lessonId: data.lessonId,
          progress: data.progress,
        });
      },
    );
  }

  private handleCommentEvents(socket: AuthenticatedSocket): void {
    socket.on(
      "comment:new",
      (data: { resourceId: string; resourceType: string; comment: any }) => {
        logger.info(
          `New comment by ${socket.userId} on ${data.resourceType}:${data.resourceId}`,
        );
        socket
          .to(`${data.resourceType}:${data.resourceId}`)
          .emit("comment:created", {
            comment: data.comment,
            userId: socket.userId,
          });
      },
    );
  }

  private handleAssistantEvents(socket: AuthenticatedSocket): void {
    const {
      lessonAssistantContainer,
    } = require("../../features/lesson-assistant/container");

    socket.on("chat:join", (data: { lessonId: string }) => {
      socket.join(`lesson-chat:${data.lessonId}`);
      logger.info(`User ${socket.userId} joined lesson chat ${data.lessonId}`);
    });

    socket.on("chat:leave", (data: { lessonId: string }) => {
      socket.leave(`lesson-chat:${data.lessonId}`);
      logger.info(`User ${socket.userId} left lesson chat ${data.lessonId}`);
    });

    socket.on(
      "chat:ask",
      async (data: { lessonId: string; question: string; chatId?: string }) => {
        try {
          if (!socket.userId) {
            socket.emit("chat:error", { message: "Unauthorized" });
            return;
          }

          const { lessonId, question, chatId } = data;

          logger.info("Chat question received", {
            userId: socket.userId,
            lessonId,
            questionLength: question.length,
          });

          // Create or get chat session
          let sessionChatId = chatId;
          if (!sessionChatId) {
            const chat =
              await lessonAssistantContainer.service.createOrGetChatSession(
                lessonId,
                socket.userId,
              );
            sessionChatId = chat.id;
          }

          // Stream the response
          const assistantMessage =
            await lessonAssistantContainer.service.streamResponse(
              sessionChatId,
              question,
              socket.userId,
              (chunk: string) => {
                socket.emit("chat:chunk", { chunk });
              },
            );

          // Send completion signal
          socket.emit("chat:complete", {
            message: assistantMessage,
            chatId: sessionChatId,
          });

          logger.info("Chat response completed", {
            userId: socket.userId,
            chatId: sessionChatId,
            responseLength: assistantMessage.content.length,
          });
        } catch (error: any) {
          logger.error("Error in chat:ask handler:", error);
          socket.emit("chat:error", {
            message: error.message || "Failed to process question",
          });
        }
      },
    );
  }

  public emitToUser(userId: string, event: string, data: any): void {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  public emitToCourse(courseId: string, event: string, data: any): void {
    this.io.to(`course:${courseId}`).emit(event, data);
  }

  public emitToChapter(chapterId: string, event: string, data: any): void {
    this.io.to(`chapter:${chapterId}`).emit(event, data);
  }

  public broadcast(event: string, data: any): void {
    this.io.emit(event, data);
  }
}
