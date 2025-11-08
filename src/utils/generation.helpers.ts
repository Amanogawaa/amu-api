import type { Request } from 'express';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware';
import type { SocketHandlers } from './socket.handlers';
import { logger } from './loggers';

/**
 * Generation status types
 */
export enum GenerationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Generation step types
 */
export enum GenerationStep {
  COURSE = 'course',
  MODULES = 'modules',
  CHAPTERS = 'chapters',
  LESSONS = 'lessons',
}

/**
 * Progress data for generation
 */
export interface GenerationProgress {
  jobId: string;
  userId: string;
  status: GenerationStatus;
  currentStep: GenerationStep;
  progress: number; // 0-100
  message: string;
  data?: any;
  error?: string;
  timestamp: string;
}

/**
 * Full course generation result
 */
export interface FullCourseGenerationResult {
  courseId: string;
  modulesCount: number;
  chaptersCount: number;
  lessonsCount: number;
  totalDuration: string;
}

/**
 * Get socket handlers from request
 */
export function getSocketHandlers(req: Request): SocketHandlers | null {
  return req.app.locals.socketHandlers || null;
}

/**
 * Emit generation progress to specific user
 */
export function emitGenerationProgress(
  req: AuthenticatedRequest,
  progress: GenerationProgress
): void {
  const socketHandlers = getSocketHandlers(req);
  if (socketHandlers) {
    socketHandlers.emitToUser(
      req.user?.uid || progress.userId,
      'generation:progress',
      progress
    );
    logger.info('Generation progress emitted', {
      jobId: progress.jobId,
      step: progress.currentStep,
      progress: progress.progress,
      status: progress.status,
    });
  }
}

/**
 * Emit generation started event
 */
export function emitGenerationStarted(
  req: AuthenticatedRequest,
  jobId: string,
  userId: string
): void {
  const progress: GenerationProgress = {
    jobId,
    userId,
    status: GenerationStatus.IN_PROGRESS,
    currentStep: GenerationStep.COURSE,
    progress: 0,
    message: 'Starting course generation...',
    timestamp: new Date().toISOString(),
  };
  emitGenerationProgress(req, progress);
}

/**
 * Emit course generation step
 */
export function emitCourseGenerationProgress(
  req: AuthenticatedRequest,
  jobId: string,
  userId: string,
  message: string,
  data?: any
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
  };
  emitGenerationProgress(req, progress);
}

/**
 * Emit modules generation progress
 */
export function emitModulesGenerationProgress(
  req: AuthenticatedRequest,
  jobId: string,
  userId: string,
  completed: number,
  total: number,
  message: string,
  data?: any
): void {
  const stepProgress = 10 + Math.floor((completed / total) * 30);
  const progress: GenerationProgress = {
    jobId,
    userId,
    status: GenerationStatus.IN_PROGRESS,
    currentStep: GenerationStep.MODULES,
    progress: stepProgress,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
  emitGenerationProgress(req, progress);
}

/**
 * Emit chapters generation progress
 */
export function emitChaptersGenerationProgress(
  req: AuthenticatedRequest,
  jobId: string,
  userId: string,
  completed: number,
  total: number,
  message: string,
  data?: any
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
  };
  emitGenerationProgress(req, progress);
}

/**
 * Emit lessons generation progress
 */
export function emitLessonsGenerationProgress(
  req: AuthenticatedRequest,
  jobId: string,
  userId: string,
  completed: number,
  total: number,
  message: string,
  data?: any
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
  };
  emitGenerationProgress(req, progress);
}

/**
 * Emit generation completed
 */
export function emitGenerationCompleted(
  req: AuthenticatedRequest,
  jobId: string,
  userId: string,
  result: FullCourseGenerationResult
): void {
  const progress: GenerationProgress = {
    jobId,
    userId,
    status: GenerationStatus.COMPLETED,
    currentStep: GenerationStep.LESSONS,
    progress: 100,
    message: 'Course generation completed successfully!',
    data: result,
    timestamp: new Date().toISOString(),
  };
  emitGenerationProgress(req, progress);
}

/**
 * Emit generation failed
 */
export function emitGenerationFailed(
  req: AuthenticatedRequest,
  jobId: string,
  userId: string,
  error: string,
  currentStep: GenerationStep
): void {
  const progress: GenerationProgress = {
    jobId,
    userId,
    status: GenerationStatus.FAILED,
    currentStep,
    progress: 0,
    message: 'Generation failed',
    error,
    timestamp: new Date().toISOString(),
  };
  emitGenerationProgress(req, progress);

  logger.error('Generation failed', {
    jobId,
    userId,
    step: currentStep,
    error,
  });
}

/**
 * Create a unique job ID for generation tracking
 */
export function createGenerationJobId(): string {
  return `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
