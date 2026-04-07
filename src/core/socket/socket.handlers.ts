/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Server as SocketIOServer } from "socket.io";
import type { AuthenticatedSocket } from "../middlewares/socket.middleware";
import { logger } from "../utils/loggers";

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
    socket.on("chat:join", (data: { lessonId: string }) => {
      socket.join(`lesson-chat:${data.lessonId}`);
      logger.info(`User ${socket.userId} joined lesson chat ${data.lessonId}`);
    });

    socket.on("chat:leave", (data: { lessonId: string }) => {
      socket.leave(`lesson-chat:${data.lessonId}`);
      logger.info(`User ${socket.userId} left lesson chat ${data.lessonId}`);
    });
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
