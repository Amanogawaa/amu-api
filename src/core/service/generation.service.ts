/* eslint-disable @typescript-eslint/no-explicit-any */

import { type Chapter, ChapterService } from "../../modules/chapter";
import {
  singleChapterSchema,
  type GenerateSingleChapterRequest,
} from "../../modules/chapter/types";
import type { Course, CourseService } from "../../modules/course";
import type { GenerateCourseRequest } from "../../modules/course/types";
import type { Lesson, LessonService } from "../../modules/lesson";
import { geminiCall } from "../ai/geminiCall";
import { buildSingleChapterPrompt } from "../ai/prompts/chapter-temp";
import {
  createGenerationJobId,
  emitCourseGenerationProgress,
  emitGenerationCompleted,
  emitGenerationFailed,
  emitGenerationStarted,
  emitModuleCompleted,
  emitModuleGenerationProgress,
  emitModuleLessonsProgress,
  GenerationStep,
  type FullCourseGenerationResult,
} from "../helper/generation.helpers";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { AppError } from "../utils/errors";
import { logger } from "../utils/loggers";

export interface StagedCourseData {
  course: Course;
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
      temperature: 0.7,
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

  /**
   * Background task: Generate exercise guidelines asynchronously
   * Runs after course is saved to avoid blocking the main response
   */
  // private async generateExerciseGuidelinesAsync(
  //   exerciseLessons: Lesson[],
  //   jobId: string,
  // ): Promise<void> {
  //   try {
  //     logger.info("Starting background exercise guideline generation", {
  //       jobId,
  //       lessonsCount: exerciseLessons.length,
  //     });

  //     // Generate guidelines in parallel batches
  //     const batchSize = 3; // Process 3 at a time to avoid overwhelming Gemini
  //     for (let i = 0; i < exerciseLessons.length; i += batchSize) {
  //       const batch = exerciseLessons.slice(i, i + batchSize);

  //       await Promise.all(
  //         batch.map((lesson) =>
  //           this.codePlaygroundService!.generateGuideline(lesson.id).catch(
  //             (error) => {
  //               logger.warn(
  //                 "Failed to generate guideline for exercise lesson in background",
  //                 {
  //                   jobId,
  //                   lessonId: lesson.id,
  //                   lessonName: lesson.lessonName,
  //                   error: error.message,
  //                 },
  //               );
  //               // Don't throw - continue with other lessons
  //             },
  //           ),
  //         ),
  //       );

  //       // Small delay between batches to manage API rate limits
  //       if (i + batchSize < exerciseLessons.length) {
  //         await new Promise((resolve) => setTimeout(resolve, 500));
  //       }
  //     }

  //     logger.info("Background exercise guideline generation completed", {
  //       jobId,
  //       lessonsCount: exerciseLessons.length,
  //     });
  //   } catch (error: any) {
  //     logger.error("Unexpected error in background guideline generation", {
  //       jobId,
  //       error: error.message,
  //     });
  //     // Don't throw - this is a background task, should not interrupt main flow
  //   }
  // }
}
