/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Chapter } from "@features/chapter/types";
import { enforceLimit, GENERATION_LIMITS } from "../../config/generationLimit";
import { AppError } from "../../utils/errors";
import type { ChapterService } from "../../features/chapter/service";
import type { CourseService } from "../../features/course/service";
import type {
  Course,
  GenerateCourseRequest,
} from "../../features/course/types";
import type { Lesson } from "../../features/lesson/types";
import type { LessonService } from "../../features/lesson/service";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import {
  createGenerationJobId,
  emitChaptersGenerationProgress,
  emitCourseGenerationProgress,
  emitGenerationCompleted,
  emitGenerationFailed,
  emitGenerationStarted,
  emitLessonsGenerationProgress,
  GenerationStep,
  type FullCourseGenerationResult,
} from "../helper/generation.helpers";
import { logger } from "../loggers";

export interface StagedCourseData {
  course: Omit<Course, "id">;
  chapters: Array<{
    chapter: Omit<Chapter, "id" | "courseId" | "courseName">;
    lessons: Array<Omit<Lesson, "id" | "chapterId">>;
  }>;
}

interface GenerationContext {
  jobId: string;
  userId: string;
  startTime: string;
  request: GenerateCourseRequest;
  staged: StagedCourseData;
}

export class FullCourseGenerationService {
  constructor(
    private courseService: CourseService,
    private chapterService: ChapterService,
    private lessonService: LessonService,
  ) {}

  async generateFullCourse(
    req: AuthenticatedRequest,
    request: GenerateCourseRequest,
  ): Promise<FullCourseGenerationResult> {
    const jobId = (req as any).generationJobId || createGenerationJobId();
    const startTime =
      (req as any).generationStartTime || new Date().toISOString();
    const userId = req.user!.uid;

    const context: GenerationContext = {
      jobId,
      userId,
      startTime,
      request,
      staged: {
        course: {} as any,
        chapters: [],
      },
    };

    try {
      logger.info("Starting transactional course generation", {
        jobId,
        userId,
        request,
      });

      emitGenerationStarted(req, jobId, userId, startTime);

      emitCourseGenerationProgress(
        req,
        jobId,
        userId,
        "Generating course metadata...",
        undefined,
        startTime,
      );

      context.staged.course =
        await this.courseService.generateCourseData(request);

      logger.info("Course metadata generated (staged)", {
        jobId,
        courseName: context.staged.course.name,
      });

      emitCourseGenerationProgress(
        req,
        jobId,
        userId,
        `Course "${context.staged.course.name}" metadata generated!`,
        { courseName: context.staged.course.name },
        startTime,
      );

      const chapters = await this.generateChaptersStaged(req, context);

      await this.generateLessonsStaged(req, context, chapters);

      this.validateStagedCourse(context.staged);

      emitCourseGenerationProgress(
        req,
        jobId,
        userId,
        "Saving course to database...",
        undefined,
        startTime,
      );

      const savedCourse = await this.courseService.createCourseWithRelations(
        context.staged,
      );

      const result: FullCourseGenerationResult = {
        courseId: savedCourse.id,
        chaptersCount: context.staged.chapters.length,
        lessonsCount: context.staged.chapters.reduce(
          (sum, c) => sum + c.lessons.length,
          0,
        ),
        totalDuration: savedCourse.duration,
      };

      logger.info("Full course generation completed successfully", {
        jobId,
        result,
      });

      emitGenerationCompleted(req, jobId, userId, result);

      return result;
    } catch (error: any) {
      logger.error("Course generation failed", {
        jobId,
        userId,
        error: error.message,
        stack: error.stack,
      });

      emitGenerationFailed(
        req,
        jobId,
        userId,
        error.message,
        GenerationStep.COURSE,
      );

      throw error;
    }
  }

  private async generateChaptersStaged(
    req: AuthenticatedRequest,
    context: GenerationContext,
  ): Promise<Array<Omit<Chapter, "id" | "courseId" | "courseName">>> {
    try {
      emitChaptersGenerationProgress(
        req,
        context.jobId,
        context.userId,
        0,
        1,
        "Generating chapters...",
        undefined,
        context.startTime,
      );

      const chapterRequest = {
        courseId: "",
        courseName: context.staged.course.name,
        description: context.staged.course.description,
        learningOutcomes: context.staged.course.learning_outcomes || [],
        level: context.staged.course.level,
        duration: context.staged.course.duration,
        noOfChapters: context.staged.course.noOfChapters,
        skillsGained: context.staged.course.skillsGained || [],
        language: context.staged.course.language,
        prerequisites: context.staged.course.prerequisites,
        userInstructions: context.request.userInstructions,
        promptMode: context.request.promptMode,
      };

      const chapters =
        await this.chapterService.generateChaptersData(chapterRequest);

      logger.info("Chapters generated (staged)", {
        jobId: context.jobId,
        chaptersCount: chapters.length,
      });

      emitChaptersGenerationProgress(
        req,
        context.jobId,
        context.userId,
        1,
        1,
        `Generated ${chapters.length} chapters successfully!`,
        { chaptersCount: chapters.length },
        context.startTime,
      );

      return chapters;
    } catch (error: any) {
      logger.error("Chapter generation failed", {
        jobId: context.jobId,
        error: error.message,
      });
      throw error;
    }
  }

  private async generateLessonsStaged(
    req: AuthenticatedRequest,
    context: GenerationContext,
    chapters: Array<Omit<Chapter, "id" | "courseId" | "courseName">>,
  ): Promise<void> {
    const totalChapters = chapters.length;
    const concurrency = Math.max(
      1,
      GENERATION_LIMITS.LESSON_CONCURRENCY || totalChapters,
    );

    try {
      for (
        let batchStart = 0;
        batchStart < chapters.length;
        batchStart += concurrency
      ) {
        const batch = chapters.slice(batchStart, batchStart + concurrency);

        const batchResults = await Promise.all(
          batch.map(async (chapter, idx) => {
            const globalIdx = batchStart + idx;

            emitLessonsGenerationProgress(
              req,
              context.jobId,
              context.userId,
              globalIdx,
              totalChapters,
              `Generating lessons for chapter ${
                globalIdx + 1
              }/${totalChapters}: "${chapter.chapterName}"...`,
              {
                chapterTitle: chapter.chapterName,
              },
              context.startTime,
            );

            const requestedLessons = chapter.estimatedLessonCount || 5;
            const limitedLessons = enforceLimit(
              requestedLessons,
              GENERATION_LIMITS.MAX_LESSONS_PER_CHAPTER,
              "lessons",
            );

            const lessonsRequest = {
              chapterId: "",
              chapterName: chapter.chapterName,
              chapterDescription: chapter.chapterDescription,
              chapterOrder: chapter.chapterOrder,
              learningObjectives: chapter.learningObjectives || [],
              keyTopics: chapter.keyTopics || [],
              estimatedDuration: chapter.estimatedDuration,
              estimatedLessonCount: limitedLessons,
              courseName: context.staged.course.name,
              level: context.staged.course.level,
              language: context.staged.course.language,
              userInstructions: context.request.userInstructions,
              promptMode: context.request.promptMode,
            };

            const lessons =
              await this.lessonService.generateLessonsData(lessonsRequest);

            emitLessonsGenerationProgress(
              req,
              context.jobId,
              context.userId,
              globalIdx + 1,
              totalChapters,
              `Generated ${lessons.length} lessons for "${chapter.chapterName}"`,
              {
                chapterTitle: chapter.chapterName,
                lessonsCount: lessons.length,
              },
              context.startTime,
            );

            return { chapter, lessons };
          }),
        );

        context.staged.chapters.push(...batchResults);
        await this.applyBatchDelay(batchStart + concurrency, totalChapters);
      }

      logger.info("All lessons generated (staged)", {
        jobId: context.jobId,
        totalLessons: context.staged.chapters.reduce(
          (sum, c) => sum + c.lessons.length,
          0,
        ),
      });
    } catch (error: any) {
      logger.error("Lesson generation failed", {
        jobId: context.jobId,
        error: error.message,
      });
      throw error;
    }
  }

  private validateStagedCourse(staged: StagedCourseData): void {
    if (!staged.course.name) {
      throw new AppError("Course name is missing", 500);
    }

    if (!staged.chapters || staged.chapters.length === 0) {
      throw new AppError("No chapters generated", 500);
    }

    for (let i = 0; i < staged.chapters.length; i++) {
      const chapterData = staged.chapters[i];
      if (!chapterData) continue;

      const { chapter, lessons } = chapterData;

      if (!chapter.chapterName) {
        throw new AppError(`Chapter ${i + 1} is missing a name`, 500);
      }

      if (!lessons || lessons.length === 0) {
        throw new AppError(
          `No lessons generated for chapter "${chapter.chapterName}"`,
          500,
        );
      }

      for (const lesson of lessons) {
        if (!lesson.lessonName) {
          throw new AppError(
            `Lesson in chapter "${chapter.chapterName}" is missing a name`,
            500,
          );
        }
      }
    }

    logger.info("Staged course validation passed", {
      courseName: staged.course.name,
      chaptersCount: staged.chapters.length,
      lessonsCount: staged.chapters.reduce(
        (sum, c) => sum + c.lessons.length,
        0,
      ),
    });
  }

  private async applyBatchDelay(
    completed: number,
    total: number,
  ): Promise<void> {
    const delayMs = GENERATION_LIMITS.BATCH_DELAY_MS || 0;
    if (delayMs > 0 && completed < total) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}
