import type { Server as SocketIOServer } from 'socket.io';
import { logger } from '../loggers';
import type { AuthenticatedSocket } from '../../middlewares/socket.middleware';

export class SocketHandlers {
  public io: SocketIOServer;

  constructor(io: SocketIOServer) {
    this.io = io;
  }

  public registerHandlers(): void {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      logger.info(`User ${socket.userId} connected with socket ${socket.id}`);

      if (socket.userId) {
        socket.join(`user:${socket.userId}`);
        logger.info(`User ${socket.userId} joined personal room`);
      }

      this.handleCourseEvents(socket);

      this.handleModuleEvents(socket);

      this.handleProgressEvents(socket);

      this.handleCommentEvents(socket);

      this.handleChapterEvents(socket);

      socket.on('disconnect', (reason) => {
        logger.info(`User ${socket.userId} disconnected: ${reason}`);
      });
    });
  }

  private handleCourseEvents(socket: AuthenticatedSocket): void {
    socket.on('course:join', (courseId: string) => {
      socket.join(`course:${courseId}`);
      logger.info(`User ${socket.userId} joined course ${courseId}`);
      socket.emit('course:joined', { courseId });
    });

    socket.on('course:leave', (courseId: string) => {
      socket.leave(`course:${courseId}`);
      logger.info(`User ${socket.userId} left course ${courseId}`);
      socket.emit('course:left', { courseId });
    });
  }

  private handleModuleEvents(socket: AuthenticatedSocket): void {
    socket.on('module:join', (moduleId: string) => {
      socket.join(`module:${moduleId}`);
      logger.info(`User ${socket.userId} joined module ${moduleId}`);
      socket.emit('module:joined', { moduleId });
    });

    socket.on('module:leave', (moduleId: string) => {
      socket.leave(`module:${moduleId}`);
      logger.info(`User ${socket.userId} left module ${moduleId}`);
      socket.emit('module:left', { moduleId });
    });
  }

  private handleChapterEvents(socket: AuthenticatedSocket): void {
    socket.on('chapter:join', (chapterId: string) => {
      socket.join(`chapter:${chapterId}`);
      logger.info(`User ${socket.userId} joined chapter ${chapterId}`);
      socket.emit('chapter:joined', { chapterId });
    });

    socket.on('chapter:leave', (chapterId: string) => {
      socket.leave(`chapter:${chapterId}`);
      logger.info(`User ${socket.userId} left chapter ${chapterId}`);
      socket.emit('chapter:left', { chapterId });
    });
  }

  private handleProgressEvents(socket: AuthenticatedSocket): void {
    socket.on(
      'progress:lesson',
      (data: { lessonId: string; progress: number }) => {
        logger.info(
          `User ${socket.userId} progress on lesson ${data.lessonId}: ${data.progress}%`
        );
        this.io.to(`user:${socket.userId}`).emit('progress:updated', {
          lessonId: data.lessonId,
          progress: data.progress,
        });
      }
    );
  }

  private handleCommentEvents(socket: AuthenticatedSocket): void {
    socket.on(
      'comment:new',
      (data: { resourceId: string; resourceType: string; comment: any }) => {
        logger.info(
          `New comment by ${socket.userId} on ${data.resourceType}:${data.resourceId}`
        );
        socket
          .to(`${data.resourceType}:${data.resourceId}`)
          .emit('comment:created', {
            comment: data.comment,
            userId: socket.userId,
          });
      }
    );
  }

  public emitToUser(userId: string, event: string, data: any): void {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  public emitToCourse(courseId: string, event: string, data: any): void {
    this.io.to(`course:${courseId}`).emit(event, data);
  }

  public emitToModule(moduleId: string, event: string, data: any): void {
    this.io.to(`module:${moduleId}`).emit(event, data);
  }

  public emitToChapter(chapterId: string, event: string, data: any): void {
    this.io.to(`chapter:${chapterId}`).emit(event, data);
  }

  public broadcast(event: string, data: any): void {
    this.io.emit(event, data);
  }
}
