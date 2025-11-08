/**
 * Socket.IO Event Types
 * Define all socket events and their payloads here for type safety
 */

// ============= Server to Client Events =============

export interface ServerToClientEvents {
  // Course events
  'course:joined': (data: { courseId: string }) => void;
  'course:left': (data: { courseId: string }) => void;
  'course:created': (data: { course: any; timestamp: string }) => void;
  'course:updated': (data: { course: any; timestamp: string }) => void;
  'course:deleted': (data: { courseId: string; timestamp: string }) => void;

  // Module events
  'module:joined': (data: { moduleId: string }) => void;
  'module:left': (data: { moduleId: string }) => void;
  'module:created': (data: { module: any; timestamp: string }) => void;
  'module:updated': (data: { module: any; timestamp: string }) => void;
  'module:deleted': (data: { moduleId: string; timestamp: string }) => void;

  // Lesson events
  'lesson:created': (data: { lesson: any; timestamp: string }) => void;
  'lesson:updated': (data: { lesson: any; timestamp: string }) => void;
  'lesson:deleted': (data: { lessonId: string; timestamp: string }) => void;

  // Progress events
  'progress:updated': (data: {
    lessonId: string;
    progress: number;
    timestamp: string;
  }) => void;

  // Comment events
  'comment:created': (data: {
    comment: any;
    userId: string;
    timestamp: string;
  }) => void;
  'comment:updated': (data: { comment: any; timestamp: string }) => void;
  'comment:deleted': (data: { commentId: string; timestamp: string }) => void;

  // Like events
  'like:added': (data: {
    resourceId: string;
    userId: string;
    timestamp: string;
  }) => void;
  'like:removed': (data: {
    resourceId: string;
    userId: string;
    timestamp: string;
  }) => void;

  // General notifications
  notification: (data: {
    type: string;
    message: string;
    data?: any;
    timestamp: string;
  }) => void;

  // Course generation progress events
  'generation:progress': (data: {
    jobId: string;
    userId: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    currentStep: 'course' | 'modules' | 'chapters' | 'lessons';
    progress: number;
    message: string;
    data?: any;
    error?: string;
    timestamp: string;
  }) => void;

  'generation:completed': (data: {
    jobId: string;
    courseId: string;
    modulesCount: number;
    chaptersCount: number;
    lessonsCount: number;
    totalDuration: string;
    timestamp: string;
  }) => void;

  'generation:failed': (data: {
    jobId: string;
    error: string;
    currentStep: string;
    timestamp: string;
  }) => void;
}

// ============= Client to Server Events =============

export interface ClientToServerEvents {
  // Course room management
  'course:join': (courseId: string) => void;
  'course:leave': (courseId: string) => void;

  // Module room management
  'module:join': (moduleId: string) => void;
  'module:leave': (moduleId: string) => void;

  // Lesson room management
  'lesson:join': (lessonId: string) => void;
  'lesson:leave': (lessonId: string) => void;

  // Progress tracking
  'progress:lesson': (data: { lessonId: string; progress: number }) => void;

  // Comment creation
  'comment:new': (data: {
    resourceId: string;
    resourceType: string;
    comment: any;
  }) => void;

  // Typing indicators
  'typing:start': (data: { resourceId: string; resourceType: string }) => void;
  'typing:stop': (data: { resourceId: string; resourceType: string }) => void;

  // Presence
  'presence:active': () => void;
  'presence:away': () => void;

  // Course generation control
  'generation:start': (data: {
    category: string;
    topic: string;
    level: string;
    duration: string;
    noOfModules: number;
    language: string;
  }) => void;

  'generation:cancel': (data: { jobId: string }) => void;
}

// ============= Socket Data =============

export interface SocketData {
  userId?: string;
  user?: {
    uid: string;
    email?: string;
  };
}

// ============= Room Types =============

export type RoomType = 'user' | 'course' | 'module' | 'lesson' | 'chapter';

export interface RoomName {
  type: RoomType;
  id: string;
}

export const formatRoomName = (type: RoomType, id: string): string => {
  return `${type}:${id}`;
};

// ============= Event Payloads =============

export interface ModuleCreatedPayload {
  module: {
    id: string;
    moduleName: string;
    moduleDescription: string;
    moduleOrder: number;
    estimatedDuration: string;
    courseId: string;
  };
  timestamp: string;
}

export interface ProgressUpdatedPayload {
  lessonId: string;
  progress: number;
  timestamp: string;
}

export interface CommentCreatedPayload {
  comment: {
    id: string;
    content: string;
    userId: string;
    resourceId: string;
    resourceType: string;
    createdAt: string;
  };
  userId: string;
  timestamp: string;
}

export interface NotificationPayload {
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  data?: any;
  timestamp: string;
}
