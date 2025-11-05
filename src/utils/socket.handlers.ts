import type { Server as SocketIOServer } from 'socket.io';
import { logger } from '../utils/loggers';
import type { AuthenticatedSocket } from '../middlewares/socket.middleware';

export class SocketHandlers {
  public io: SocketIOServer;

  constructor(io: SocketIOServer) {
    this.io = io;
  }

  /**
   * Register all socket event handlers
   */
  public registerHandlers(): void {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      logger.info(`User ${socket.userId} connected with socket ${socket.id}`);

      // Join user to their personal room
      if (socket.userId) {
        socket.join(`user:${socket.userId}`);
        logger.info(`User ${socket.userId} joined personal room`);
      }

      // Course-related events
      this.handleCourseEvents(socket);

      // Module-related events
      this.handleModuleEvents(socket);

      // Progress-related events
      this.handleProgressEvents(socket);

      // Comment-related events
      this.handleCommentEvents(socket);

      // Disconnect handler
      socket.on('disconnect', (reason) => {
        logger.info(`User ${socket.userId} disconnected: ${reason}`);
      });
    });
  }

  /**
   * Handle course-related socket events
   */
  private handleCourseEvents(socket: AuthenticatedSocket): void {
    // Join a course room
    socket.on('course:join', (courseId: string) => {
      socket.join(`course:${courseId}`);
      logger.info(`User ${socket.userId} joined course ${courseId}`);
      socket.emit('course:joined', { courseId });
    });

    // Leave a course room
    socket.on('course:leave', (courseId: string) => {
      socket.leave(`course:${courseId}`);
      logger.info(`User ${socket.userId} left course ${courseId}`);
      socket.emit('course:left', { courseId });
    });
  }

  /**
   * Handle module-related socket events
   */
  private handleModuleEvents(socket: AuthenticatedSocket): void {
    // Join a module room
    socket.on('module:join', (moduleId: string) => {
      socket.join(`module:${moduleId}`);
      logger.info(`User ${socket.userId} joined module ${moduleId}`);
      socket.emit('module:joined', { moduleId });
    });

    // Leave a module room
    socket.on('module:leave', (moduleId: string) => {
      socket.leave(`module:${moduleId}`);
      logger.info(`User ${socket.userId} left module ${moduleId}`);
      socket.emit('module:left', { moduleId });
    });
  }

  /**
   * Handle progress-related socket events
   */
  private handleProgressEvents(socket: AuthenticatedSocket): void {
    // Track lesson progress
    socket.on(
      'progress:lesson',
      (data: { lessonId: string; progress: number }) => {
        logger.info(
          `User ${socket.userId} progress on lesson ${data.lessonId}: ${data.progress}%`
        );
        // Emit to user's personal room
        this.io.to(`user:${socket.userId}`).emit('progress:updated', {
          lessonId: data.lessonId,
          progress: data.progress,
        });
      }
    );
  }

  /**
   * Handle comment-related socket events
   */
  private handleCommentEvents(socket: AuthenticatedSocket): void {
    // New comment notification
    socket.on(
      'comment:new',
      (data: { resourceId: string; resourceType: string; comment: any }) => {
        logger.info(
          `New comment by ${socket.userId} on ${data.resourceType}:${data.resourceId}`
        );
        // Broadcast to all users in that resource room
        socket
          .to(`${data.resourceType}:${data.resourceId}`)
          .emit('comment:created', {
            comment: data.comment,
            userId: socket.userId,
          });
      }
    );
  }

  /**
   * Emit event to specific user
   */
  public emitToUser(userId: string, event: string, data: any): void {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  /**
   * Emit event to course room
   */
  public emitToCourse(courseId: string, event: string, data: any): void {
    this.io.to(`course:${courseId}`).emit(event, data);
  }

  /**
   * Emit event to module room
   */
  public emitToModule(moduleId: string, event: string, data: any): void {
    this.io.to(`module:${moduleId}`).emit(event, data);
  }

  /**
   * Broadcast to all connected clients
   */
  public broadcast(event: string, data: any): void {
    this.io.emit(event, data);
  }
}
