/* eslint-disable @typescript-eslint/no-explicit-any */
import { enforceLimit, GENERATION_LIMITS } from "../../config/generationLimit";
import { AppError } from "../../utils/errors";
import type { ChapterService } from "../../features/chapter/service";
import type { CourseService } from "../../features/course/service";
import type {
  Course,
  GenerateCourseRequest,
} from "../../features/course/types";
import type {
  GenerateSingleChapterRequest,
  Chapter,
} from "../../features/chapter/types";
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
  emitModuleGenerationProgress,
  emitModuleLessonsProgress,
  emitModuleCompleted,
  GenerationStep,
  type FullCourseGenerationResult,
} from "../helper/generation.helpers";
import { logger } from "../loggers";
import { geminiCall } from "../geminiCall";
import { buildSingleChapterPrompt } from "../prompts/chapter-temp";
import { singleChapterSchema } from "../../features/chapter/types";

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

      const creationResult = await this.courseService.createCourseWithRelations(
        context.staged,
      );
      const savedCourse = creationResult.course;

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

            logger.info("Lessons generated (staged)", {
              jobId: context.jobId,
              chapterName: chapter.chapterName,
              lessonsCount: lessons.length,
              lessonContentPreview: lessons,
            });

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

  // ============================================
  // NEW: Sequential Module-by-Module Generation (Legacy generateFullCourse unchanged)
  // ============================================

  /**
   * Generates a full course SEQUENTIALLY: module by module with real-time progress
   * Flow: Course → Module 1 → Module 1 Lessons → Module 2 → Module 2 Lessons → ...
   *
   * Benefits:
   * - Users see completed modules earlier
   * - Better streaming/real-time updates
   * - Incremental preview capability
   * - Better error recovery (partial success)
   */
  async generateFullCourseSequential(
    req: AuthenticatedRequest,
    request: GenerateCourseRequest,
  ): Promise<FullCourseGenerationResult> {
    const jobId = (req as any).generationJobId || createGenerationJobId();
    const startTime =
      (req as any).generationStartTime || new Date().toISOString();
    const userId = req.user!.uid;

    const completedModules: Chapter[] = [];
    let totalLessonsGenerated = 0;

    try {
      logger.info("Starting SEQUENTIAL course generation", {
        jobId,
        userId,
        request,
        mode: "sequential",
      });

      emitGenerationStarted(req, jobId, userId, startTime);

      // STEP 1: Generate Course Metadata (10%)
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
        totalModules: course.noOfChapters,
      });

      emitCourseGenerationProgress(
        req,
        jobId,
        userId,
        `Course "${course.name}" created successfully!`,
        { courseId: course.id, courseName: course.name },
        startTime,
      );

      // STEP 2: Generate Modules Sequentially (module → lessons → repeat)
      const totalModules = course.noOfChapters || 5;

      for (let moduleIndex = 0; moduleIndex < totalModules; moduleIndex++) {
        const moduleNumber = moduleIndex + 1;

        // 2a. Generate Single Module
        emitModuleGenerationProgress(
          req,
          jobId,
          userId,
          moduleNumber,
          totalModules,
          `Generating Module ${moduleNumber}/${totalModules}...`,
          undefined,
          startTime,
        );

        const module = await this.generateSingleModule(
          course,
          moduleIndex,
          totalModules,
          completedModules,
          request,
        );

        logger.info(`Module ${moduleNumber} generated`, {
          jobId,
          moduleId: module.id,
          moduleName: module.chapterName,
        });

        // 2b. Generate Lessons for This Module
        emitModuleLessonsProgress(
          req,
          jobId,
          userId,
          moduleNumber,
          totalModules,
          `Generating lessons for Module ${moduleNumber}: "${module.chapterName}"...`,
          {
            moduleId: module.id,
            moduleName: module.chapterName,
          },
          startTime,
        );

        const lessons = await this.generateModuleLessons(
          req,
          module,
          course,
          request,
        );

        totalLessonsGenerated += lessons.length;

        logger.info(`Lessons generated for Module ${moduleNumber}`, {
          jobId,
          moduleId: module.id,
          lessonsCount: lessons.length,
        });

        // 2c. Emit Module Completed (KEY EVENT for incremental preview!)
        emitModuleCompleted(
          req,
          jobId,
          userId,
          module,
          lessons,
          moduleNumber,
          totalModules,
          startTime,
        );

        completedModules.push(module);
      }

      // STEP 3: Finalization
      const result: FullCourseGenerationResult = {
        courseId: course.id,
        chaptersCount: completedModules.length,
        lessonsCount: totalLessonsGenerated,
        totalDuration: course.duration,
      };

      logger.info("Sequential course generation completed", {
        jobId,
        result,
        mode: "sequential",
      });

      emitGenerationCompleted(req, jobId, userId, result);

      return result;
    } catch (error: any) {
      logger.error("Sequential course generation failed", {
        jobId,
        userId,
        completedModules: completedModules.length,
        error: error.message,
        mode: "sequential",
      });

      emitGenerationFailed(
        req,
        jobId,
        userId,
        error.message,
        GenerationStep.MODULE,
      );
      throw error;
    }
  }

  /**
   * Helper: Generate a single module with context from previous modules
   */
  private async generateSingleModule(
    course: any,
    moduleIndex: number,
    totalModules: number,
    previousModules: Chapter[],
    courseRequest: GenerateCourseRequest,
  ): Promise<Chapter> {
    const previousContext = previousModules.map((mod) => ({
      chapterName: mod.chapterName,
      description: mod.chapterDescription,
      learningObjectives: mod.learningObjectives || [],
      keyTopics: mod.keyTopics || [],
    }));

    const moduleRequest: GenerateSingleChapterRequest = {
      courseId: course.id,
      courseName: course.name,
      courseDescription: course.description,
      moduleIndex,
      totalModules,
      level: course.level,
      language: course.language,
      duration: course.duration,
      previousModules: previousContext,
      learningOutcomes: course.learning_outcomes || [],
      skillsGained: course.skills_gained || [],
      prerequisites: course.prerequisites,
      userInstructions: courseRequest.userInstructions,
      promptMode: courseRequest.promptMode,
    };

    return await this.chapterService.generateSingleChapter(moduleRequest);
  }

  /**
   * Helper: Generate lessons for a single module
   */
  private async generateModuleLessons(
    req: AuthenticatedRequest,
    module: Chapter,
    course: any,
    courseRequest: GenerateCourseRequest,
  ): Promise<any[]> {
    const requestedLessons = module.estimatedLessonCount || 5;
    const limitedLessons = enforceLimit(
      requestedLessons,
      GENERATION_LIMITS.MAX_LESSONS_PER_CHAPTER,
      "lessons",
    );

    const lessonsRequest = {
      chapterId: module.id,
      chapterName: module.chapterName,
      chapterDescription: module.chapterDescription,
      chapterOrder: module.chapterOrder,
      learningObjectives: module.learningObjectives || [],
      keyTopics: module.keyTopics || [],
      estimatedDuration: module.estimatedDuration || "1 hour",
      courseName: course.name,
      level: course.level,
      language: course.language,
      userInstructions: courseRequest.userInstructions,
      promptMode: courseRequest.promptMode,
    };

    return await this.lessonService.generateLessons(lessonsRequest);
  }

  // ============================================
  // NEW: Sequential + Transactional Generation (Best of Both Worlds!)
  // ============================================

  /**
   * Generates a full course SEQUENTIALLY with TRANSACTIONAL saves
   *
   * Benefits:
   * - ✅ Sequential: Module-by-module with real-time progress
   * - ✅ Transactional: All-or-nothing atomic saves
   * - ✅ Incremental Preview: Users see staged modules as they complete
   * - ✅ Data Consistency: No partial courses in database on failure
   *
   * Flow:
   * 1. Generate course metadata (staged)
   * 2. For each module:
   *    a. Generate module (staged)
   *    b. Generate lessons (staged)
   *    c. Emit module:completed with staged data (preview)
   * 3. Validate all staged data
   * 4. Atomic batch save to database
   */
  async generateFullCourseSequentialTransactional(
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
      logger.info("Starting SEQUENTIAL TRANSACTIONAL course generation", {
        jobId,
        userId,
        request,
        mode: "sequential-transactional",
      });

      emitGenerationStarted(req, jobId, userId, startTime);

      // STEP 1: Generate Course Metadata (staged)
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
        mode: "sequential-transactional",
      });

      emitCourseGenerationProgress(
        req,
        jobId,
        userId,
        `Course "${context.staged.course.name}" created successfully!`,
        { courseName: context.staged.course.name },
        startTime,
      );

      // STEP 2: Generate Modules Sequentially (all staged)
      const totalModules = context.staged.course.noOfChapters || 5;

      for (let moduleIndex = 0; moduleIndex < totalModules; moduleIndex++) {
        const moduleNumber = moduleIndex + 1;

        // 2a. Generate Single Module (staged)
        emitModuleGenerationProgress(
          req,
          jobId,
          userId,
          moduleNumber,
          totalModules,
          `Generating Module ${moduleNumber}/${totalModules}...`,
          undefined,
          startTime,
        );

        const moduleData = await this.generateSingleModuleDataStaged(
          context.staged.course,
          moduleIndex,
          totalModules,
          context.staged.chapters.map((c) => c.chapter),
          request,
        );

        logger.info(`Module ${moduleNumber} generated (staged)`, {
          jobId,
          moduleName: moduleData.chapterName,
          mode: "sequential-transactional",
        });

        // 2b. Generate Lessons for This Module (staged)
        emitModuleLessonsProgress(
          req,
          jobId,
          userId,
          moduleNumber,
          totalModules,
          `Generating lessons for Module ${moduleNumber}: "${moduleData.chapterName}"...`,
          {
            moduleName: moduleData.chapterName,
          },
          startTime,
        );

        const lessonsData = await this.generateModuleLessonsDataStaged(
          moduleData,
          context.staged.course,
          request,
        );

        logger.info(`Lessons generated for Module ${moduleNumber} (staged)`, {
          jobId,
          moduleName: moduleData.chapterName,
          lessonsCount: lessonsData.length,
          mode: "sequential-transactional",
        });

        // Store in staged data
        context.staged.chapters.push({
          chapter: moduleData,
          lessons: lessonsData,
        });

        // 2c. Emit Module Completed (with staged data for preview)
        emitModuleCompleted(
          req,
          jobId,
          userId,
          {
            id: `staged-${moduleIndex}`,
            chapterName: moduleData.chapterName,
            ...moduleData,
          } as any,
          lessonsData.map((l, idx) => ({
            id: `staged-${moduleIndex}-${idx}`,
            ...l,
          })) as any,
          moduleNumber,
          totalModules,
          startTime,
        );
      }

      // STEP 3: Validate Staged Data
      logger.info("Validating staged course data", {
        jobId,
        chaptersCount: context.staged.chapters.length,
        lessonsCount: context.staged.chapters.reduce(
          (sum, c) => sum + c.lessons.length,
          0,
        ),
        mode: "sequential-transactional",
      });

      this.validateStagedCourse(context.staged);

      // STEP 4: Atomic Batch Save to Database
      emitCourseGenerationProgress(
        req,
        jobId,
        userId,
        "Saving complete course to database...",
        undefined,
        startTime,
      );

      const creationResult = await this.courseService.createCourseWithRelations(
        context.staged,
      );
      const savedCourse = creationResult.course;

      // Auto-generate quizzes in the background
      for (const { chapterId, lessons } of creationResult.chaptersWithLessons) {
        const quizLessons = lessons.filter((lesson) => lesson.type === "quiz");
        if (quizLessons.length > 0) {
          this.lessonService
            .autoGenerateQuizzes(lessons, chapterId)
            .catch((error) => {
              logger.error("Error generating quizzes in background", {
                jobId,
                chapterId: chapterId,
                error,
              });
            });
        }
      }

      // STEP 5: Success!
      const result: FullCourseGenerationResult = {
        courseId: savedCourse.id,
        chaptersCount: context.staged.chapters.length,
        lessonsCount: context.staged.chapters.reduce(
          (sum, c) => sum + c.lessons.length,
          0,
        ),
        totalDuration: savedCourse.duration,
      };

      logger.info("Sequential transactional course generation completed", {
        jobId,
        result,
        mode: "sequential-transactional",
      });

      emitGenerationCompleted(req, jobId, userId, result);

      return result;
    } catch (error: any) {
      logger.error("Sequential transactional course generation failed", {
        jobId,
        userId,
        completedModules: context.staged.chapters.length,
        error: error.message,
        mode: "sequential-transactional",
      });

      // No database cleanup needed - nothing was saved!
      emitGenerationFailed(
        req,
        jobId,
        userId,
        error.message,
        GenerationStep.MODULE,
      );
      throw error;
    }
  }

  /**
   * Helper: Generate a single module data (staged, not saved)
   */
  private async generateSingleModuleDataStaged(
    courseData: any,
    moduleIndex: number,
    totalModules: number,
    previousModules: Array<any>,
    courseRequest: GenerateCourseRequest,
  ): Promise<any> {
    const previousContext = previousModules.map((mod) => ({
      chapterName: mod.chapterName,
      description: mod.chapterDescription,
      learningObjectives: mod.learningObjectives || [],
      keyTopics: mod.keyTopics || [],
    }));

    const moduleRequest: GenerateSingleChapterRequest = {
      courseId: "staged", // Not saved yet
      courseName: courseData.name,
      courseDescription: courseData.description,
      moduleIndex,
      totalModules,
      level: courseData.level,
      language: courseData.language,
      duration: courseData.duration,
      previousModules: previousContext,
      learningOutcomes: courseData.learning_outcomes || [],
      skillsGained: courseData.skills_gained || [],
      prerequisites: courseData.prerequisites,
      userInstructions: courseRequest.userInstructions,
      promptMode: courseRequest.promptMode,
    };

    // Generate using the prompt, but return data only (not saved)
    const promptMode = moduleRequest.promptMode ?? "system";
    const { userPrompt, systemPrompt } = buildSingleChapterPrompt(
      {
        courseName: moduleRequest.courseName,
        courseDescription: moduleRequest.courseDescription,
        moduleIndex: moduleRequest.moduleIndex,
        totalModules: moduleRequest.totalModules,
        previousModules: moduleRequest.previousModules || [],
        level: moduleRequest.level,
        language: moduleRequest.language,
        duration: moduleRequest.duration,
        learningOutcomes: moduleRequest.learningOutcomes,
        skillsGained: moduleRequest.skillsGained,
        prerequisites: moduleRequest.prerequisites,
        userInstructions: moduleRequest.userInstructions,
      },
      { mode: promptMode, intent: "generate" },
    );

    const result = await geminiCall(userPrompt, {
      responseSchema: singleChapterSchema,
      temperature: 0.4,
      maxRetries: 3,
      systemPrompt,
      benchmarkTag: `chapter-single-staged:${promptMode}`,
      metadata: {
        moduleIndex: moduleRequest.moduleIndex,
        totalModules: moduleRequest.totalModules,
      },
    });

    if (!result) {
      throw new Error("Invalid response from Gemini: missing chapter data");
    }

    return {
      chapterOrder: moduleRequest.moduleIndex,
      chapterName: result.chapterName,
      chapterDescription: result.chapterDescription,
      estimatedDuration: result.estimatedDuration,
      learningObjectives: result.learningObjectives,
      keyTopics: result.keyTopics,
      prerequisites: result.prerequisites || [],
      practicalApplication: result.practicalApplication,
      estimatedLessonCount: result.estimatedLessonCount,
    };
  }

  /**
   * Helper: Generate lessons data for a module (staged, not saved)
   */
  private async generateModuleLessonsDataStaged(
    moduleData: any,
    courseData: any,
    courseRequest: GenerateCourseRequest,
  ): Promise<any[]> {
    const lessonsRequest = {
      chapterId: moduleData.id,
      chapterName: moduleData.chapterName,
      chapterDescription: moduleData.chapterDescription,
      chapterOrder: moduleData.chapterOrder,
      learningObjectives: moduleData.learningObjectives || [],
      keyTopics: moduleData.keyTopics || [],
      estimatedDuration: moduleData.estimatedDuration || "1 hour",
      courseName: courseData.name,
      level: courseData.level,
      language: courseData.language,
      userInstructions: courseRequest.userInstructions,
      promptMode: courseRequest.promptMode,
    };

    return await this.lessonService.generateLessonsData(lessonsRequest);
  }

  /**
   * Generates a full course SEQUENTIALLY with TRANSACTIONAL saves AND real-time AI streaming.
  
   * @param req - Authenticated Express request (for Socket.IO access)
   * @param request - Course generation parameters
   * @param emitChunk - Callback for streaming chunks: (step, chunk) => void
   */
  async generateFullCourseSequentialTransactionalStreaming(
    req: AuthenticatedRequest,
    request: GenerateCourseRequest,
    emitChunk: (step: string, chunk: string) => void,
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
      logger.info(
        "Starting SEQUENTIAL TRANSACTIONAL STREAMING course generation",
        {
          jobId,
          userId,
          request,
          mode: "sequential-transactional-streaming",
        },
      );

      emitGenerationStarted(req, jobId, userId, startTime);

      // STEP 1: Stream Course Metadata (staged)
      emitCourseGenerationProgress(
        req,
        jobId,
        userId,
        "Generating course metadata...",
        undefined,
        startTime,
      );

      context.staged.course =
        await this.courseService.generateCourseDataStreaming(request, (chunk) =>
          emitChunk("course", chunk),
        );

      logger.info("Course metadata generated via streaming (staged)", {
        jobId,
        courseName: context.staged.course.name,
        mode: "sequential-transactional-streaming",
      });

      emitCourseGenerationProgress(
        req,
        jobId,
        userId,
        `Course "${context.staged.course.name}" metadata generated!`,
        { courseName: context.staged.course.name },
        startTime,
      );

      // STEP 2: Generate Modules Sequentially with Streaming (all staged)
      const totalModules = context.staged.course.noOfChapters || 5;

      for (let moduleIndex = 0; moduleIndex < totalModules; moduleIndex++) {
        const moduleNumber = moduleIndex + 1;

        // 2a. Stream + Stage Module
        emitModuleGenerationProgress(
          req,
          jobId,
          userId,
          moduleNumber,
          totalModules,
          `Generating Module ${moduleNumber}/${totalModules}...`,
          undefined,
          startTime,
        );

        const moduleData = await this.generateSingleModuleDataStagedStreaming(
          context.staged.course,
          moduleIndex,
          totalModules,
          context.staged.chapters.map((c) => c.chapter),
          request,
          (chunk) => emitChunk(`module-${moduleNumber}`, chunk),
        );

        logger.info(`Module ${moduleNumber} generated via streaming (staged)`, {
          jobId,
          moduleName: moduleData.chapterName,
          mode: "sequential-transactional-streaming",
        });

        // 2b. Stream + Stage Lessons
        emitModuleLessonsProgress(
          req,
          jobId,
          userId,
          moduleNumber,
          totalModules,
          `Generating lessons for Module ${moduleNumber}: "${moduleData.chapterName}"...`,
          { moduleName: moduleData.chapterName },
          startTime,
        );

        const lessonsData = await this.generateModuleLessonsDataStagedStreaming(
          moduleData,
          context.staged.course,
          request,
          (chunk) => emitChunk(`lessons-${moduleNumber}`, chunk),
        );

        logger.info(
          `Lessons generated for Module ${moduleNumber} via streaming (staged)`,
          {
            jobId,
            moduleName: moduleData.chapterName,
            lessonsCount: lessonsData.length,
            mode: "sequential-transactional-streaming",
          },
        );

        // Store in staged data
        context.staged.chapters.push({
          chapter: moduleData,
          lessons: lessonsData,
        });

        // 2c. Emit Module Completed (with staged data for preview)
        emitModuleCompleted(
          req,
          jobId,
          userId,
          {
            id: `staged-${moduleIndex}`,
            chapterName: moduleData.chapterName,
            ...moduleData,
          } as any,
          lessonsData.map((l, idx) => ({
            id: `staged-${moduleIndex}-${idx}`,
            ...l,
          })) as any,
          moduleNumber,
          totalModules,
          startTime,
        );
      }

      // STEP 3: Validate Staged Data
      logger.info("Validating staged course data", {
        jobId,
        chaptersCount: context.staged.chapters.length,
        lessonsCount: context.staged.chapters.reduce(
          (sum, c) => sum + c.lessons.length,
          0,
        ),
        mode: "sequential-transactional-streaming",
      });

      this.validateStagedCourse(context.staged);

      // STEP 4: Atomic Batch Save to Database
      emitCourseGenerationProgress(
        req,
        jobId,
        userId,
        "Saving complete course to database...",
        undefined,
        startTime,
      );

      const creationResult = await this.courseService.createCourseWithRelations(
        context.staged,
      );
      const savedCourse = creationResult.course;

      // Auto-generate quizzes in the background
      for (const { chapterId, lessons } of creationResult.chaptersWithLessons) {
        const quizLessons = lessons.filter((lesson) => lesson.type === "quiz");
        if (quizLessons.length > 0) {
          this.lessonService
            .autoGenerateQuizzes(lessons, chapterId)
            .catch((error) => {
              logger.error("Error generating quizzes in background", {
                jobId,
                chapterId: chapterId,
                error,
              });
            });
        }
      }

      // STEP 5: Success!
      const result: FullCourseGenerationResult = {
        courseId: savedCourse.id,
        chaptersCount: context.staged.chapters.length,
        lessonsCount: context.staged.chapters.reduce(
          (sum, c) => sum + c.lessons.length,
          0,
        ),
        totalDuration: savedCourse.duration,
      };

      logger.info(
        "Sequential transactional streaming course generation completed",
        {
          jobId,
          result,
          mode: "sequential-transactional-streaming",
        },
      );

      emitGenerationCompleted(req, jobId, userId, result);

      return result;
    } catch (error: any) {
      logger.error(
        "Sequential transactional streaming course generation failed",
        {
          jobId,
          userId,
          completedModules: context.staged.chapters.length,
          error: error.message,
          mode: "sequential-transactional-streaming",
        },
      );

      // No database cleanup needed — nothing was saved!
      emitGenerationFailed(
        req,
        jobId,
        userId,
        error.message,
        GenerationStep.MODULE,
      );
      throw error;
    }
  }

  /**
   * Helper: Generate a single module data with streaming (staged, not saved)
   */
  private async generateSingleModuleDataStagedStreaming(
    courseData: any,
    moduleIndex: number,
    totalModules: number,
    previousModules: Array<any>,
    courseRequest: GenerateCourseRequest,
    onChunk: (chunk: string) => void,
  ): Promise<any> {
    const previousContext = previousModules.map((mod) => ({
      chapterName: mod.chapterName,
      description: mod.chapterDescription,
      learningObjectives: mod.learningObjectives || [],
      keyTopics: mod.keyTopics || [],
    }));

    const moduleRequest: GenerateSingleChapterRequest = {
      courseId: "staged",
      courseName: courseData.name,
      courseDescription: courseData.description,
      moduleIndex,
      totalModules,
      level: courseData.level,
      language: courseData.language,
      duration: courseData.duration,
      previousModules: previousContext,
      learningOutcomes: courseData.learning_outcomes || [],
      skillsGained: courseData.skills_gained || [],
      prerequisites: courseData.prerequisites,
      userInstructions: courseRequest.userInstructions,
      promptMode: courseRequest.promptMode,
    };

    const promptMode = moduleRequest.promptMode ?? "system";
    const { userPrompt, systemPrompt } = buildSingleChapterPrompt(
      {
        courseName: moduleRequest.courseName,
        courseDescription: moduleRequest.courseDescription,
        moduleIndex: moduleRequest.moduleIndex,
        totalModules: moduleRequest.totalModules,
        previousModules: moduleRequest.previousModules || [],
        level: moduleRequest.level,
        language: moduleRequest.language,
        duration: moduleRequest.duration,
        learningOutcomes: moduleRequest.learningOutcomes,
        skillsGained: moduleRequest.skillsGained,
        prerequisites: moduleRequest.prerequisites,
        userInstructions: moduleRequest.userInstructions,
      },
      { mode: promptMode, intent: "generate" },
    );

    let fullResponse = "";
    await geminiCall(userPrompt, {
      responseSchema: singleChapterSchema,
      temperature: 0.4,
      maxRetries: 3,
      systemPrompt,
      stream: true,
      onChunk: (chunk: string) => {
        fullResponse += chunk;
        onChunk(chunk);
      },
      benchmarkTag: `chapter-single-staged-stream:${promptMode}`,
      metadata: {
        moduleIndex: moduleRequest.moduleIndex,
        totalModules: moduleRequest.totalModules,
      },
    });

    let result: any;
    try {
      let cleaned = fullResponse.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "");
        cleaned = cleaned.replace(/\n?```\s*$/, "");
      }
      result = JSON.parse(cleaned);
    } catch (parseError) {
      logger.error("Failed to parse streamed module response", { parseError });
      throw new Error("Failed to parse module data from streamed response");
    }

    if (!result) {
      throw new Error("Invalid response from Gemini: missing chapter data");
    }

    return {
      chapterOrder: moduleRequest.moduleIndex,
      chapterName: result.chapterName,
      chapterDescription: result.chapterDescription,
      estimatedDuration: result.estimatedDuration,
      learningObjectives: result.learningObjectives,
      keyTopics: result.keyTopics,
      prerequisites: result.prerequisites || [],
      practicalApplication: result.practicalApplication,
      estimatedLessonCount: result.estimatedLessonCount,
    };
  }

  /**
   * Helper: Generate lessons data for a module with streaming (staged, not saved)
   */
  private async generateModuleLessonsDataStagedStreaming(
    moduleData: any,
    courseData: any,
    courseRequest: GenerateCourseRequest,
    onChunk: (chunk: string) => void,
  ): Promise<any[]> {
    const lessonsRequest = {
      chapterId: moduleData.id,
      chapterName: moduleData.chapterName,
      chapterDescription: moduleData.chapterDescription,
      chapterOrder: moduleData.chapterOrder,
      learningObjectives: moduleData.learningObjectives || [],
      keyTopics: moduleData.keyTopics || [],
      estimatedDuration: moduleData.estimatedDuration || "1 hour",
      courseName: courseData.name,
      level: courseData.level,
      language: courseData.language,
      userInstructions: courseRequest.userInstructions,
      promptMode: courseRequest.promptMode,
    };

    return await this.lessonService.generateLessonsDataStreaming(
      lessonsRequest,
      onChunk,
    );
  }
}
