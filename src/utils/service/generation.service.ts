/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Chapter } from "@features/chapter/types";
import { enforceLimit, GENERATION_LIMITS } from "../../config/generationLimit";
import type { ChapterService } from "../../features/chapter/service";
import type { CourseService } from "../../features/course/service";
import type { GenerateCourseRequest } from "../../features/course/types";
import type { LessonService } from "../../features/lesson/service";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import {
  createGenerationJobId,
  emitCourseGenerationProgress,
  emitGenerationCompleted,
  emitGenerationFailed,
  emitGenerationStarted,
  emitLessonsGenerationProgress,
  emitModulesGenerationProgress,
  GenerationStep,
  type FullCourseGenerationResult,
} from "../helper/generation.helpers";
import { logger } from "../loggers";

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
    let currentStep = GenerationStep.COURSE;

    try {
      logger.info("Starting full course generation", {
        jobId,
        userId,
        request,
      });

      emitGenerationStarted(req, jobId, userId, startTime);

      currentStep = GenerationStep.COURSE;
      emitCourseGenerationProgress(
        req,
        jobId,
        userId,
        "Generating course metadata...",
        undefined,
        startTime,
      );

      const course = await this.courseService.generateCourse(request);

      logger.info("Course generated successfully", {
        jobId,
        courseId: course.id,
        courseName: course.name,
      });

      emitCourseGenerationProgress(
        req,
        jobId,
        userId,
        `Course "${course.name}" created successfully!`,
        { courseId: course.id, courseName: course.name },
        startTime,
      );

      // currentStep = GenerationStep.MODULES;
      // const modules = await this.generateModules(
      //   req,
      //   jobId,
      //   userId,
      //   course,
      //   request,
      //   startTime,
      // );

      currentStep = GenerationStep.CHAPTERS;
      const chaptersCount = await this.generateChapters(
        req,
        jobId,
        userId,
        course,
        request,
        startTime,
      );

      currentStep = GenerationStep.LESSONS;
      const lessonsCount = await this.generateLessons(
        req,
        jobId,
        userId,
        course,
        request,
        startTime,
      );

      const result: FullCourseGenerationResult = {
        courseId: course.id,
        chaptersCount: chaptersCount.length,
        lessonsCount,
        totalDuration: course.duration,
      };

      logger.info("Full course generation completed", {
        jobId,
        result,
      });

      emitGenerationCompleted(req, jobId, userId, result);

      return result;
    } catch (error: any) {
      logger.error("Full course generation failed", {
        jobId,
        userId,
        currentStep,
        error: error.message,
        stack: error.stack,
      });

      emitGenerationFailed(req, jobId, userId, error.message, currentStep);
      throw error;
    }
  }

  private async generateChapters(
    req: AuthenticatedRequest,
    jobId: string,
    userId: string,
    course: any,
    courseRequest: GenerateCourseRequest,
    startTime: string,
  ): Promise<Chapter[]> {
    try {
      emitModulesGenerationProgress(
        req,
        jobId,
        userId,
        0,
        1,
        "Generating course modules...",
        undefined,
        startTime,
      );

      const chapterRequest = {
        courseId: course.id,
        courseName: course.name,
        description: course.description,
        learningOutcomes: course.learning_outcomes || [],
        level: course.level,
        duration: course.duration,
        noOfChapters: course.noOfChapters,
        skillsGained: course.skills_gained || [],
        language: course.language,
        prerequisites: course.prerequisites,
        userInstructions: courseRequest.userInstructions,
        promptMode: courseRequest.promptMode,
      };

      await this.chapterService.generateChapters(chapterRequest);

      const chapters = await this.chapterService.getChapters(course.id);

      logger.info("Chapters generated successfully", {
        jobId,
        courseId: course.id,
        chaptersCount: chapters.length,
      });

      emitModulesGenerationProgress(
        req,
        jobId,
        userId,
        1,
        1,
        `Generated ${chapters.length} chapters successfully!`,
        { modulesCount: chapters.length },
        startTime,
      );

      return chapters;
    } catch (error: any) {
      logger.error("Module generation failed", {
        jobId,
        courseId: course.id,
        error: error.message,
      });
      throw error;
    }
  }

  private async generateLessons(
    req: AuthenticatedRequest,
    jobId: string,
    userId: string,
    course: any,
    courseRequest: GenerateCourseRequest,
    startTime: string,
  ): Promise<number> {
    let totalLessons = 0;

    try {
      const allChapters = await this.chapterService
        .getChapters(course.id)
        .then((chapters) => chapters.map((chapter) => ({ chapter })));

      const totalChapters = allChapters.length;
      if (totalChapters === 0) {
        return 0;
      }

      const concurrency = Math.max(
        1,
        GENERATION_LIMITS.LESSON_CONCURRENCY || totalChapters,
      );

      for (
        let batchStart = 0;
        batchStart < allChapters.length;
        batchStart += concurrency
      ) {
        const batch = allChapters.slice(batchStart, batchStart + concurrency);

        const batchResults = await Promise.all(
          batch.map(async ({ chapter }, idx) => {
            const globalIdx = batchStart + idx;

            emitLessonsGenerationProgress(
              req,
              jobId,
              userId,
              globalIdx,
              totalChapters,
              `Generating lessons for chapter ${
                globalIdx + 1
              }/${totalChapters}: "${chapter.chapterName}"...`,
              {
                chapterId: chapter.id,
                chapterTitle: chapter.chapterName,
              },
              startTime,
            );

            const requestedLessons = chapter.estimatedLessonCount || 5;
            const limitedLessons = enforceLimit(
              requestedLessons,
              GENERATION_LIMITS.MAX_LESSONS_PER_CHAPTER,
              "lessons",
            );

            const lessonsRequest = {
              chapterId: chapter.id,
              chapterName: chapter.chapterName,
              chapterDescription: chapter.chapterDescription,
              chapterOrder: chapter.chapterOrder,
              learningObjectives: chapter.learningObjectives || [],
              keyTopics: chapter.keyTopics || [],
              estimatedDuration: chapter.estimatedDuration,
              estimatedLessonCount: limitedLessons,
              courseName: course.name,
              level: course.level,
              language: course.language,
              userInstructions: courseRequest.userInstructions,
              promptMode: courseRequest.promptMode,
            };

            await this.lessonService.generateLessons(lessonsRequest);

            const lessons = await this.lessonService.getLessons(chapter.id);

            emitLessonsGenerationProgress(
              req,
              jobId,
              userId,
              globalIdx + 1,
              totalChapters,
              `Generated ${lessons.length} lessons for "${chapter.chapterName}"`,
              {
                chapterId: chapter.id,
                chapterTitle: chapter.chapterName,
                lessonsCount: lessons.length,
              },
              startTime,
            );

            return lessons.length;
          }),
        );

        totalLessons += batchResults.reduce((sum, count) => sum + count, 0);
        await this.applyBatchDelay(batchStart + concurrency, totalChapters);
      }

      logger.info("All lessons generated successfully", {
        jobId,
        totalLessons,
      });

      return totalLessons;
    } catch (error: any) {
      logger.error("Lesson generation failed", {
        jobId,
        error: error.message,
      });
      throw error;
    }
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
