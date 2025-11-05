import type { Request, Response } from 'express';
import type { SocketHandlers } from './socket.handlers';

/**
 * Example helper to get Socket.IO handlers from request
 */
export function getSocketHandlers(req: Request): SocketHandlers | null {
  return req.app.locals.socketHandlers || null;
}

/**
 * Example: Emit event when module is created
 */
export function notifyModuleCreated(
  req: Request,
  courseId: string,
  moduleData: any
): void {
  const socketHandlers = getSocketHandlers(req);
  if (socketHandlers) {
    socketHandlers.emitToCourse(courseId, 'module:created', {
      module: moduleData,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Example: Emit event when module is updated
 */
export function notifyModuleUpdated(
  req: Request,
  courseId: string,
  moduleData: any
): void {
  const socketHandlers = getSocketHandlers(req);
  if (socketHandlers) {
    socketHandlers.emitToCourse(courseId, 'module:updated', {
      module: moduleData,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Example: Emit event when progress is updated
 */
export function notifyProgressUpdated(
  req: Request,
  userId: string,
  progressData: any
): void {
  const socketHandlers = getSocketHandlers(req);
  if (socketHandlers) {
    socketHandlers.emitToUser(userId, 'progress:updated', {
      progress: progressData,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Example: Emit event when comment is created
 */
export function notifyCommentCreated(
  req: Request,
  resourceId: string,
  resourceType: string,
  commentData: any
): void {
  const socketHandlers = getSocketHandlers(req);
  if (socketHandlers) {
    socketHandlers.io
      .to(`${resourceType}:${resourceId}`)
      .emit('comment:created', {
        comment: commentData,
        timestamp: new Date().toISOString(),
      });
  }
}
