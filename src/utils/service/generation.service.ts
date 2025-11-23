import { enforceLimit, GENERATION_LIMITS } from '../../config/generationLimit';
import type { ChapterService } from '../../features/chapter/service';
import type { CourseService } from '../../features/course/service';
import type { GenerateCourseRequest } from '../../features/course/types';
import type { LessonService } from '../../features/lesson/service';
import type { ModuleService } from '../../features/modules/service';
import type { Module } from '../../features/modules/types';
import type { AuthenticatedRequest } from '../../middlewares/auth.middleware';
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
} from '../helper/generation.helpers';
import { logger } from '../loggers';

export class FullCourseGenerationService {
  constructor(
    private courseService: CourseService,
    private moduleService: ModuleService,
    private chapterService: ChapterService,
    private lessonService: LessonService
  ) {}

  async generateFullCourse(
    req: AuthenticatedRequest,
    request: GenerateCourseRequest
  ): Promise<FullCourseGenerationResult> {
    const jobId = createGenerationJobId();
    const userId = req.user!.uid;
    let currentStep = GenerationStep.COURSE;

    try {
      logger.info('Starting full course generation', {
        jobId,
        userId,
        request,
      });

      emitGenerationStarted(req, jobId, userId);

      currentStep = GenerationStep.COURSE;
      emitCourseGenerationProgress(
        req,
        jobId,
        userId,
        'Generating course metadata...'
      );

      const course = await this.courseService.generateCourse(request);

      logger.info('Course generated successfully', {
        jobId,
        courseId: course.id,
        courseName: course.name,
      });

      emitCourseGenerationProgress(
        req,
        jobId,
        userId,
        `Course "${course.name}" created successfully!`,
        { courseId: course.id, courseName: course.name }
      );

      currentStep = GenerationStep.MODULES;
      const modules = await this.generateModules(req, jobId, userId, course);

      currentStep = GenerationStep.CHAPTERS;
      const chaptersCount = await this.generateChapters(
        req,
        jobId,
        userId,
        course,
        modules
      );

      currentStep = GenerationStep.LESSONS;
      const lessonsCount = await this.generateLessons(
        req,
        jobId,
        userId,
        course,
        modules
      );

      // NOTE: Capstone generation is now separated and should be triggered
      // manually by the course creator after reviewing the generated content.
      // This prevents token overload and allows for better context from actual DB data.

      const result: FullCourseGenerationResult = {
        courseId: course.id,
        modulesCount: modules.length,
        chaptersCount,
        lessonsCount,
        totalDuration: course.duration,
      };

      logger.info('Full course generation completed', {
        jobId,
        result,
      });

      emitGenerationCompleted(req, jobId, userId, result);

      return result;
    } catch (error: any) {
      logger.error('Full course generation failed', {
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
    course: any
  ): Promise<Module[]> {
    try {
      emitModulesGenerationProgress(
        req,
        jobId,
        userId,
        0,
        1,
        'Generating course modules...'
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
      };

      await this.moduleService.generateModules(modulesRequest);

      const modules = await this.moduleService.getModules(course.id);

      logger.info('Modules generated successfully', {
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
        { modulesCount: modules.length }
      );

      return modules;
    } catch (error: any) {
      logger.error('Module generation failed', {
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
    modules: Module[]
  ): Promise<number> {
    let totalChapters = 0;

    try {
      const batchSize = GENERATION_LIMITS.BATCH_SIZE;

      for (let i = 0; i < modules.length; i += batchSize) {
        const module = modules[i];
        const batch = modules.slice(i, i + batchSize);

        if (!module) {
          continue;
        }

        const batchPromises = batch.map(async (module, idx) => {
          const globalIdx = i + idx;

          emitChaptersGenerationProgress(
            req,
            jobId,
            userId,
            i,
            modules.length,
            `Generating chapters for module ${i + 1}/${modules.length}: "${
              module.moduleName
            }"...`,
            { moduleId: module.id, moduleName: module.moduleName }
          );

          const requestedChapters = module.estimatedChapterCount;

          const limitedChapters = enforceLimit(
            requestedChapters!,
            GENERATION_LIMITS.MAX_CHAPTERS_PER_MODULE,
            'chapters'
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
          };

          await this.chapterService.generateChapters(chaptersRequest);

          const chapters = await this.chapterService.getChapters(module.id);
          totalChapters += chapters.length;

          logger.info('Chapters generated for module', {
            jobId,
            moduleId: module.id,
            chaptersCount: chapters.length,
          });

          emitChaptersGenerationProgress(
            req,
            jobId,
            userId,
            i + 1,
            modules.length,
            `Generated ${chapters.length} chapters for "${module.moduleName}"`,
            {
              moduleId: module.id,
              moduleName: module.moduleName,
              chaptersCount: chapters.length,
            }
          );
          return chapters.length;
        });

        const batchResults = await Promise.all(batchPromises);
        totalChapters += batchResults.reduce((sum, count) => sum + count, 0);

        if (i + batchSize < modules.length) {
          logger.info('Batch completed, waiting before next batch', {
            jobId,
            i,
            delay: GENERATION_LIMITS.BATCH_DELAY,
          });
          await new Promise((resolve) =>
            setTimeout(resolve, GENERATION_LIMITS.BATCH_DELAY)
          );
        }
      }

      logger.info('All chapters generated successfully', {
        jobId,
        totalChapters,
      });

      return totalChapters;
    } catch (error: any) {
      logger.error('Chapter generation failed', {
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
    modules: Module[]
  ): Promise<number> {
    let totalLessons = 0;
    let processedChapters = 0;

    try {
      // Collect all chapters first
      const allChapters = [];
      for (const module of modules) {
        const chapters = await this.chapterService.getChapters(module.id);
        for (const chapter of chapters) {
          allChapters.push({ chapter, module });
        }
      }

      const totalChapters = allChapters.length;
      const batchSize = GENERATION_LIMITS.BATCH_SIZE;

      // Process chapters in batches
      for (
        let batchStart = 0;
        batchStart < allChapters.length;
        batchStart += batchSize
      ) {
        const batch = allChapters.slice(batchStart, batchStart + batchSize);

        const batchPromises = batch.map(async ({ chapter, module }) => {
          const globalIdx = processedChapters++;

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
              moduleId: module.id,
              moduleName: module.moduleName,
            }
          );

          // Enforce lesson limit
          const requestedLessons = chapter.estimatedLessonCount || 5;
          const limitedLessons = enforceLimit(
            requestedLessons,
            GENERATION_LIMITS.MAX_LESSONS_PER_CHAPTER,
            'lessons'
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
            }
          );

          return lessons.length;
        });

        const batchResults = await Promise.all(batchPromises);
        totalLessons += batchResults.reduce((sum, count) => sum + count, 0);

        if (batchStart + batchSize < allChapters.length) {
          await new Promise((resolve) =>
            setTimeout(resolve, GENERATION_LIMITS.BATCH_DELAY)
          );
        }
      }

      logger.info('All lessons generated successfully', {
        jobId,
        totalLessons,
      });

      return totalLessons;
    } catch (error: any) {
      logger.error('Lesson generation failed', {
        jobId,
        error: error.message,
      });
      throw error;
    }
  }

  // NOTE: Removed generateCapstoneGuideline method - capstone generation
  // is now handled separately via the capstone service's dedicated endpoint
}
