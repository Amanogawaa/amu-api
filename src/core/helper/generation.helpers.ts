/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Request } from "express";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import type { SocketHandlers } from "../socket/socket.handlers";
import { logger } from "../utils/loggers";

export enum GenerationStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  FAILED = "failed",
}

export enum GenerationStep {
  VALIDATING = "validating",
  COURSE = "course",
  CHAPTERS = "chapters",
  LESSONS = "lessons",
  // NEW: For sequential generation
  MODULE = "module",
  MODULE_LESSONS = "module_lessons",
  FINALIZING = "finalizing",
}

export interface GenerationProgress {
  jobId: string;
  userId: string;
  status: GenerationStatus;
  currentStep: GenerationStep;
  progress: number;
  message: string;
  data?: any;
  error?: string;
  timestamp: string;
  startTime?: string;
  estimatedTimeRemaining?: string;
}

export interface FullCourseGenerationResult {
  courseId: string;
  chaptersCount: number;
  lessonsCount: number;
  totalDuration: string;
}

export function getSocketHandlers(req: Request): SocketHandlers | null {
  return req.app.locals.socketHandlers || null;
}

export function emitGenerationProgress(
  req: AuthenticatedRequest,
  progress: GenerationProgress,
): void {
  const socketHandlers = getSocketHandlers(req);
  if (socketHandlers) {
    socketHandlers.emitToUser(
      req.user?.uid || progress.userId,
      "generation:progress",
      progress,
    );
    logger.info("Generation progress emitted", {
      jobId: progress.jobId,
      step: progress.currentStep,
      progress: progress.progress,
      status: progress.status,
    });
  }
}

function calculateEstimatedTime(progress: number, startTime: string): string {
  if (progress === 0 || progress >= 100) return "Calculating...";

  const now = Date.now();
  const start = new Date(startTime).getTime();
  const elapsed = now - start;
  const estimatedTotal = (elapsed / progress) * 100;
  const remaining = estimatedTotal - elapsed;

  if (remaining <= 0) return "Almost done...";

  const minutes = Math.ceil(remaining / 60000);
  if (minutes < 1) return "Less than a minute";
  if (minutes === 1) return "About 1 minute";
  if (minutes < 60) return `About ${minutes} minutes`;

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `About ${hours} hour${hours > 1 ? "s" : ""}`;
  return `About ${hours}h ${mins}m`;
}

export function emitValidationProgress(
  req: AuthenticatedRequest,
  jobId: string,
  userId: string,
): void {
  const startTime = new Date().toISOString();
  const progress: GenerationProgress = {
    jobId,
    userId,
    status: GenerationStatus.IN_PROGRESS,
    currentStep: GenerationStep.VALIDATING,
    progress: 0,
    message: "Validating request...",
    timestamp: startTime,
    startTime,
    estimatedTimeRemaining: "Calculating...",
  };
  emitGenerationProgress(req, progress);
}

export function emitGenerationStarted(
  req: AuthenticatedRequest,
  jobId: string,
  userId: string,
  startTime: string,
): void {
  const progress: GenerationProgress = {
    jobId,
    userId,
    status: GenerationStatus.IN_PROGRESS,
    currentStep: GenerationStep.COURSE,
    progress: 0,
    message: "Starting course generation...",
    timestamp: new Date().toISOString(),
    startTime,
    estimatedTimeRemaining: "Calculating...",
  };
  emitGenerationProgress(req, progress);
}

export function emitCourseGenerationProgress(
  req: AuthenticatedRequest,
  jobId: string,
  userId: string,
  message: string,
  data?: any,
  startTime?: string,
): void {
  const progress: GenerationProgress = {
    jobId,
    userId,
    status: GenerationStatus.IN_PROGRESS,
    currentStep: GenerationStep.COURSE,
    progress: 10,
    message,
    data,
    timestamp: new Date().toISOString(),
    startTime,
    estimatedTimeRemaining: startTime
      ? calculateEstimatedTime(10, startTime)
      : "Calculating...",
  };
  emitGenerationProgress(req, progress);
}

export function emitChaptersGenerationProgress(
  req: AuthenticatedRequest,
  jobId: string,
  userId: string,
  completed: number,
  total: number,
  message: string,
  data?: any,
  startTime?: string,
): void {
  const stepProgress = 40 + Math.floor((completed / total) * 30);
  const progress: GenerationProgress = {
    jobId,
    userId,
    status: GenerationStatus.IN_PROGRESS,
    currentStep: GenerationStep.CHAPTERS,
    progress: stepProgress,
    message,
    data,
    timestamp: new Date().toISOString(),
    startTime,
    estimatedTimeRemaining: startTime
      ? calculateEstimatedTime(stepProgress, startTime)
      : "Calculating...",
  };
  emitGenerationProgress(req, progress);
}

export function emitLessonsGenerationProgress(
  req: AuthenticatedRequest,
  jobId: string,
  userId: string,
  completed: number,
  total: number,
  message: string,
  data?: any,
  startTime?: string,
): void {
  const stepProgress = 70 + Math.floor((completed / total) * 25);
  const progress: GenerationProgress = {
    jobId,
    userId,
    status: GenerationStatus.IN_PROGRESS,
    currentStep: GenerationStep.LESSONS,
    progress: stepProgress,
    message,
    data,
    timestamp: new Date().toISOString(),
    startTime,
    estimatedTimeRemaining: startTime
      ? calculateEstimatedTime(stepProgress, startTime)
      : "Calculating...",
  };
  emitGenerationProgress(req, progress);
}

export function emitGenerationCompleted(
  req: AuthenticatedRequest,
  jobId: string,
  userId: string,
  result: FullCourseGenerationResult,
): void {
  const progress: GenerationProgress = {
    jobId,
    userId,
    status: GenerationStatus.COMPLETED,
    currentStep: GenerationStep.LESSONS,
    progress: 100,
    message: "Course generation completed successfully!",
    data: result,
    timestamp: new Date().toISOString(),
  };
  emitGenerationProgress(req, progress);
}

export function emitGenerationFailed(
  req: AuthenticatedRequest,
  jobId: string,
  userId: string,
  error: string,
  currentStep: GenerationStep,
): void {
  const progress: GenerationProgress = {
    jobId,
    userId,
    status: GenerationStatus.FAILED,
    currentStep,
    progress: 0,
    message: "Generation failed",
    error,
    timestamp: new Date().toISOString(),
  };
  emitGenerationProgress(req, progress);

  logger.error("Generation failed", {
    jobId,
    userId,
    step: currentStep,
    error,
  });
}

export function createGenerationJobId(): string {
  return `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================
// NEW: Sequential Module Generation Progress Helpers (Legacy functions unchanged)
// ============================================

/**
 * Emits progress for a single module generation
 */
export function emitModuleGenerationProgress(
  req: AuthenticatedRequest,
  jobId: string,
  userId: string,
  moduleNumber: number,
  totalModules: number,
  message: string,
  data?: any,
  startTime?: string,
): void {
  const progress = 10 + ((moduleNumber - 1) / totalModules) * 90;

  const progressData: GenerationProgress = {
    jobId,
    userId,
    status: GenerationStatus.IN_PROGRESS,
    currentStep: GenerationStep.MODULE,
    progress: Math.floor(progress),
    message,
    data: {
      ...data,
      moduleNumber,
      totalModules,
    },
    timestamp: new Date().toISOString(),
    startTime,
    estimatedTimeRemaining: startTime
      ? calculateEstimatedTime(progress, startTime)
      : "Calculating...",
  };

  emitGenerationProgress(req, progressData);
}

/**
 * Emits progress for module lessons generation
 */
export function emitModuleLessonsProgress(
  req: AuthenticatedRequest,
  jobId: string,
  userId: string,
  moduleNumber: number,
  totalModules: number,
  message: string,
  data?: any,
  startTime?: string,
): void {
  const baseProgress = 10 + ((moduleNumber - 1) / totalModules) * 90;
  const progress = baseProgress + (90 / totalModules) * 0.5; // Halfway through module

  const progressData: GenerationProgress = {
    jobId,
    userId,
    status: GenerationStatus.IN_PROGRESS,
    currentStep: GenerationStep.MODULE_LESSONS,
    progress: Math.floor(progress),
    message,
    data: {
      ...data,
      moduleNumber,
      totalModules,
    },
    timestamp: new Date().toISOString(),
    startTime,
    estimatedTimeRemaining: startTime
      ? calculateEstimatedTime(progress, startTime)
      : "Calculating...",
  };

  emitGenerationProgress(req, progressData);
}

/**
 * Emits a module:completed event when a single module and its lessons are done
 * This allows frontend to show incremental progress
 */
export function emitModuleCompleted(
  req: AuthenticatedRequest,
  jobId: string,
  userId: string,
  module: any,
  lessons: any[],
  moduleNumber: number,
  totalModules: number,
  startTime?: string,
): void {
  const socketHandlers = getSocketHandlers(req);
  if (socketHandlers) {
    socketHandlers.emitToUser(userId, "module:completed", {
      jobId,
      moduleId: module.id,
      moduleName: module.chapterName,
      moduleNumber,
      totalModules,
      lessonsCount: lessons.length,
      lessonIds: lessons.map((l) => l.id),
      timestamp: new Date().toISOString(),
    });

    logger.info("Module completed event emitted", {
      jobId,
      moduleNumber,
      moduleId: module.id,
      moduleName: module.chapterName,
      lessonsCount: lessons.length,
    });
  }
}
