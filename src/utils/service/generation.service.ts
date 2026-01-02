/* eslint-disable @typescript-eslint/no-explicit-any */
import { enforceLimit, GENERATION_LIMITS } from "../../config/generationLimit";
import type { ChapterService } from "../../features/chapter/service";
import type { CourseService } from "../../features/course/service";
import type { GenerateCourseRequest } from "../../features/course/types";
import type { LessonService } from "../../features/lesson/service";
import type { ModuleService } from "../../features/modules/service";
import type { Module } from "../../features/modules/types";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import {
  createGenerationJobId,
  GenerationStep,
  emitGenerationStarted,
  emitCourseGenerationProgress,
  emitGenerationCompleted,
  emitGenerationFailed,
  emitModulesGenerationProgress,
  emitChaptersGenerationProgress,
  emitLessonsGenerationProgress,
  type FullCourseGenerationResult,
} from "../helper/generation.helpers";
import { logger } from "../loggers";

export class FullCourseGenerationService {
  constructor(
    private courseService: CourseService,
    private moduleService: ModuleService,
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

      currentStep = GenerationStep.MODULES;
      const modules = await this.generateModules(
        req,
        jobId,
        userId,
        course,
        request,
        startTime,
      );

      currentStep = GenerationStep.CHAPTERS;
      const chaptersCount = await this.generateChapters(
        req,
        jobId,
        userId,
        course,
        modules,
        request,
        startTime,
      );

      currentStep = GenerationStep.LESSONS;
      const lessonsCount = await this.generateLessons(
        req,
        jobId,
        userId,
        course,
        modules,
        request,
        startTime,
      );

      const result: FullCourseGenerationResult = {
        courseId: course.id,
        modulesCount: modules.length,
        chaptersCount,
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

  private async generateModules(
    req: AuthenticatedRequest,
    jobId: string,
    userId: string,
    course: any,
    courseRequest: GenerateCourseRequest,
    startTime: string,
  ): Promise<Module[]> {
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

      const modulesRequest = {
        courseId: course.id,
        courseName: course.name,
        courseDescription: course.description,
        learningOutcomes: course.learning_outcomes || [],
        level: course.level,
        duration: course.duration,
        noOfModules: course.noOfModules || 5,
        language: course.language,
        prerequisites: course.prerequisites,
        userInstructions: courseRequest.userInstructions,
        promptMode: courseRequest.promptMode,
      };

      await this.moduleService.generateModules(modulesRequest);

      const modules = await this.moduleService.getModules(course.id);

      logger.info("Modules generated successfully", {
        jobId,
        courseId: course.id,
        modulesCount: modules.length,
      });

      emitModulesGenerationProgress(
        req,
        jobId,
        userId,
        1,
        1,
        `Generated ${modules.length} modules successfully!`,
        { modulesCount: modules.length },
        startTime,
      );

      return modules;
    } catch (error: any) {
      logger.error("Module generation failed", {
        jobId,
        courseId: course.id,
        error: error.message,
      });
      throw error;
    }
  }

  private async generateChapters(
    req: AuthenticatedRequest,
    jobId: string,
    userId: string,
    course: any,
    modules: Module[],
    courseRequest: GenerateCourseRequest,
    startTime: string,
  ): Promise<number> {
    let totalChapters = 0;

    try {
      const concurrency = Math.max(
        1,
        GENERATION_LIMITS.CHAPTER_CONCURRENCY || modules.length,
      );

      for (let offset = 0; offset < modules.length; offset += concurrency) {
        const batch = modules.slice(offset, offset + concurrency);

        const batchResults = await Promise.all(
          batch.map(async (module, idx) => {
            const globalIdx = offset + idx;

            emitChaptersGenerationProgress(
              req,
              jobId,
              userId,
              globalIdx,
              modules.length,
              `Generating chapters for module ${globalIdx + 1}/${
                modules.length
              }: "${module.moduleName}"...`,
              { moduleId: module.id, moduleName: module.moduleName },
              startTime,
            );

            const requestedChapters = module.estimatedChapterCount;

            const limitedChapters = enforceLimit(
              requestedChapters!,
              GENERATION_LIMITS.MAX_CHAPTERS_PER_MODULE,
              "chapters",
            );

            const chaptersRequest = {
              moduleId: module.id,
              moduleName: module.moduleName,
              moduleDescription: module.moduleDescription,
              moduleLearningObjectives: module.learningObjectives || [],
              moduleKeySkills: module.keySkills || [],
              estimatedDuration: module.estimatedDuration,
              estimatedChapterCount: limitedChapters || 4,
              courseName: course.name,
              level: course.level,
              language: course.language,
              moduleOrder: module.moduleOrder,
              userInstructions: courseRequest.userInstructions,
              promptMode: courseRequest.promptMode,
            };

            await this.chapterService.generateChapters(chaptersRequest);

            const chapters = await this.chapterService.getChapters(module.id);

            logger.info("Chapters generated for module", {
              jobId,
              moduleId: module.id,
              chaptersCount: chapters.length,
            });

            emitChaptersGenerationProgress(
              req,
              jobId,
              userId,
              globalIdx + 1,
              modules.length,
              `Generated ${chapters.length} chapters for "${module.moduleName}"`,
              {
                moduleId: module.id,
                moduleName: module.moduleName,
                chaptersCount: chapters.length,
              },
              startTime,
            );
            return chapters.length;
          }),
        );

        totalChapters += batchResults.reduce((sum, count) => sum + count, 0);

        await this.applyBatchDelay(offset + concurrency, modules.length);
      }

      logger.info("All chapters generated successfully", {
        jobId,
        totalChapters,
      });

      return totalChapters;
    } catch (error: any) {
      logger.error("Chapter generation failed", {
        jobId,
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
    modules: Module[],
    courseRequest: GenerateCourseRequest,
    startTime: string,
  ): Promise<number> {
    let totalLessons = 0;

    try {
      // Prefetch chapters with limited concurrency to avoid serial waits
      const prefetchConcurrency = Math.max(
        1,
        GENERATION_LIMITS.PREFETCH_CONCURRENCY || modules.length,
      );
      const allChapters: Array<{ chapter: any; module: Module }> = [];

      for (
        let offset = 0;
        offset < modules.length;
        offset += prefetchConcurrency
      ) {
        const batch = modules.slice(offset, offset + prefetchConcurrency);
        const batchChapters = await Promise.all(
          batch.map(async (module) => {
            const chapters = await this.chapterService.getChapters(module.id);
            return chapters.map((chapter) => ({ chapter, module }));
          }),
        );
        allChapters.push(...batchChapters.flat());
      }

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
          batch.map(async ({ chapter, module }, idx) => {
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
              moduleName: module.moduleName,
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
