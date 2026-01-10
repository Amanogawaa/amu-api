/* eslint-disable @typescript-eslint/no-explicit-any */
export interface ServerToClientEvents {
  "course:joined": (data: { courseId: string }) => void;
  "course:left": (data: { courseId: string }) => void;
  "course:created": (data: { course: any; timestamp: string }) => void;
  "course:updated": (data: { course: any; timestamp: string }) => void;
  "course:deleted": (data: { courseId: string; timestamp: string }) => void;

  "lesson:created": (data: { lesson: any; timestamp: string }) => void;
  "lesson:updated": (data: { lesson: any; timestamp: string }) => void;
  "lesson:deleted": (data: { lessonId: string; timestamp: string }) => void;

  "progress:updated": (data: {
    lessonId: string;
    progress: number;
    timestamp: string;
  }) => void;

  "comment:created": (data: {
    comment: any;
    userId: string;
    timestamp: string;
  }) => void;
  "comment:updated": (data: { comment: any; timestamp: string }) => void;
  "comment:deleted": (data: { commentId: string; timestamp: string }) => void;

  "like:added": (data: {
    resourceId: string;
    userId: string;
    timestamp: string;
  }) => void;
  "like:removed": (data: {
    resourceId: string;
    userId: string;
    timestamp: string;
  }) => void;

  notification: (data: {
    type: string;
    message: string;
    data?: any;
    timestamp: string;
  }) => void;

  "generation:progress": (data: {
    jobId: string;
    userId: string;
    status: "pending" | "in_progress" | "completed" | "failed";
    currentStep: "course" | "chapters" | "lessons";
    progress: number;
    message: string;
    data?: any;
    error?: string;
    timestamp: string;
  }) => void;

  "generation:completed": (data: {
    jobId: string;
    courseId: string;
    chaptersCount: number;
    lessonsCount: number;
    totalDuration: string;
    timestamp: string;
  }) => void;

  "generation:failed": (data: {
    jobId: string;
    error: string;
    currentStep: string;
    timestamp: string;
  }) => void;
}

export interface ClientToServerEvents {
  "course:join": (courseId: string) => void;
  "course:leave": (courseId: string) => void;

  "lesson:join": (lessonId: string) => void;
  "lesson:leave": (lessonId: string) => void;

  "progress:lesson": (data: { lessonId: string; progress: number }) => void;

  "comment:new": (data: {
    resourceId: string;
    resourceType: string;
    comment: any;
  }) => void;

  "typing:start": (data: { resourceId: string; resourceType: string }) => void;
  "typing:stop": (data: { resourceId: string; resourceType: string }) => void;

  "presence:active": () => void;
  "presence:away": () => void;

  "generation:start": (data: {
    category: string;
    topic: string;
    level: string;
    duration: string;
    noOfChapters: number;
    language: string;
  }) => void;

  "generation:cancel": (data: { jobId: string }) => void;
}

export interface SocketData {
  userId?: string;
  user?: {
    uid: string;
    email?: string;
  };
}

export type RoomType = "user" | "course" | "lesson" | "chapter";

export interface RoomName {
  type: RoomType;
  id: string;
}

export const formatRoomName = (type: RoomType, id: string): string => {
  return `${type}:${id}`;
};

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
  type: "info" | "success" | "warning" | "error";
  message: string;
  data?: any;
  timestamp: string;
}
