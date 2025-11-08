import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware';
import type { SocketHandlers } from './socket.handlers';

export function getSocketHandlers(req: Request): SocketHandlers | null {
  return req.app.locals.socketHandlers || null;
}

export function notifyCourseCreated(req: Request, courseData: any): void {
  const socketHandlers = getSocketHandlers(req);

  if (socketHandlers) {
    socketHandlers.broadcast('course:created', {
      course: courseData,
      timestamp: new Date().toISOString(),
    });
  }
}

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

export function notifyChapterCreated(
  req: Request,
  moduleId: string,
  chapterData: any
): void {
  const socketHandlers = getSocketHandlers(req);

  if (socketHandlers) {
    socketHandlers.emitToModule(moduleId, 'chapter:created', {
      chapter: chapterData,
      timestamp: new Date().toISOString(),
    });
  }
}

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

export function notifyLessonCreated(
  req: AuthenticatedRequest,
  chapterId: string,
  lessonData: any
): void {
  const socketHandlers = getSocketHandlers(req);
  if (socketHandlers) {
    socketHandlers.emitToChapter(chapterId, 'lesson:created', {
      lesson: lessonData,
      timestamp: new Date().toISOString(),
    });
  }
}

export function notifyLessonUpdated(
  req: AuthenticatedRequest,
  chapterId: string,
  lessonData: any
): void {
  const socketHandlers = getSocketHandlers(req);
  if (socketHandlers) {
    socketHandlers.emitToChapter(chapterId, 'lesson:updated', {
      lesson: lessonData,
      timestamp: new Date().toISOString(),
    });
  }
}

export function notifyLessonDeleted(
  req: AuthenticatedRequest,
  chapterId: string,
  lessonId: string
): void {
  const socketHandlers = getSocketHandlers(req);
  if (socketHandlers) {
    socketHandlers.emitToChapter(chapterId, 'lesson:deleted', {
      lessonId,
      timestamp: new Date().toISOString(),
    });
  }
}
