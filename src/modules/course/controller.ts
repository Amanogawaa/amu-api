/* eslint-disable @typescript-eslint/no-explicit-any */
import { type Request, type Response, type NextFunction } from "express";
import { logger } from "../../core/utils/loggers";
import type { CourseService } from "./service";
import type { CourseQueryParams } from "./types";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import {
  notifyCourseCreated,
  getSocketHandlers,
} from "../../core/socket/socket.helpers";
import type { FullCourseGenerationService } from "../../core/service/generation.service";
import type { GenerateFromCourseRequest } from "./types";

export class CourseController {
  private service: CourseService;
  private fullGenerationService?: FullCourseGenerationService;

  constructor(
    service: CourseService,
    fullGenerationService?: FullCourseGenerationService,
  ) {
    this.service = service;
    this.fullGenerationService = fullGenerationService;
  }

  async getCourses(
    request: AuthenticatedRequest,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const queryParams: CourseQueryParams = {
        level: request.query.level as any,
        uid: request.user?.uid as string,
        draft:
          request.query.draft === "true"
            ? true
            : request.query.draft === "false"
              ? false
              : undefined,
        publish:
          request.query.publish === "true"
            ? true
            : request.query.publish === "false"
              ? false
              : undefined,

        category: request.query.category as string,
        language: request.query.language as string,
        limit: request.query.limit
          ? parseInt(request.query.limit as string)
          : undefined,
        offset: request.query.offset
          ? parseInt(request.query.offset as string)
          : undefined,
      };

      const courses = await this.service.getCourses(queryParams);

      const total = courses.length;
      const limit = queryParams.limit || 10;
      const offset = queryParams.offset || 0;

      response.status(200).send({
        results: courses,
        count: total,
        next: offset + limit < total ? offset + limit : null,
        previous: offset > 0 ? Math.max(0, offset - limit) : null,
      });
    } catch (error) {
      logger.error("Error in CourseController.getCourses:", error);
      next(error);
    }
  }

  async getCourseById(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params;

      if (!id) {
        response.status(400).json({
          message: "Course ID is required",
        });
        return;
      }

      const course = await this.service.getCourseById(id!);

      response.status(200).send(course);
    } catch (error) {
      logger.error("Error in CourseController.getCourseById:", error);
      next(error);
    }
  }

  async generateCourse(
    request: AuthenticatedRequest,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const courseRequest = {
        ...request.body,
        uid: request.user?.uid,
      };

      const course = await this.service.generateCourse(courseRequest);

      notifyCourseCreated(request, course);

      response.status(201).json({
        data: course,
        message: "Course generated successfully",
      });
    } catch (error) {
      logger.error("Error in CoursesController.generateCourse:", error);
      next(error);
    }
  }

  async getPostCompletionActions(
    request: AuthenticatedRequest,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = request.user?.uid;
      const { id } = request.params;

      if (!userId) {
        response.status(401).json({ message: "Authentication required" });
        return;
      }

      if (!id) {
        response.status(400).json({ message: "Course ID is required" });
        return;
      }

      const actions = await this.service.getPostCompletionActions(userId, id);
      response.status(200).json({
        data: actions,
        message: "Post-completion actions retrieved successfully",
      });
    } catch (error) {
      logger.error("Error in CourseController.getPostCompletionActions:", error);
      next(error);
    }
  }

  async generateFromCourse(
    request: AuthenticatedRequest,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!this.fullGenerationService) {
        response.status(503).json({
          message: "Full course generation service not available",
        });
        return;
      }

      const userId = request.user?.uid;
      const { id } = request.params;

      if (!userId) {
        response.status(401).json({ message: "Authentication required" });
        return;
      }

      if (!id) {
        response.status(400).json({ message: "Source course ID is required" });
        return;
      }

      const derivedRequest = await this.service.buildGenerateFromCourseRequest(
        userId,
        id,
        request.body as GenerateFromCourseRequest,
      );

      response.status(202).json({
        message: "Derived course generation started",
        note: "Listen to Socket.IO generation events for progress updates",
        sourceCourseId: id,
        mode: request.body.mode,
      });

      setImmediate(async () => {
        try {
          await this.fullGenerationService!.generateFullCourseSequentialTransactional(
            request,
            derivedRequest,
          );
        } catch (error: any) {
          logger.error("Background derived course generation failed:", error);
        }
      });
    } catch (error) {
      logger.error("Error in CourseController.generateFromCourse:", error);
      next(error);
    }
  }

  // TODO: need to refactor this to use the new sequential generation flow instead of generating all chapters at once and then saving. This will require changes to the service layer as well to support generating and saving one chapter at a time with context from previous chapters.
  async generateCourseStream(
    request: AuthenticatedRequest,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const courseRequest = {
        ...request.body,
        uid: request.user?.uid,
      };

      const userId = request.user?.uid;
      if (!userId) {
        response.status(401).json({
          message: "Authentication required",
        });
        return;
      }

      const socketHandlers = getSocketHandlers(request);

      if (!socketHandlers) {
        response.status(503).json({
          message: "Socket service unavailable",
        });
        return;
      }

      const emitChunk = (chunk: string) => {
        socketHandlers.emitToUser(userId, "course:stream", { chunk });
      };

      socketHandlers.emitToUser(userId, "course:stream:start", {
        message: "Starting course generation...",
      });

      const course = await this.service.generateCourseStream(
        courseRequest,
        userId,
        emitChunk,
      );

      socketHandlers.emitToUser(userId, "course:stream:complete", {
        courseId: course.id,
        courseName: course.name,
      });

      notifyCourseCreated(request, course);

      response.status(201).json({
        data: course,
        message: "Course generated successfully with streaming",
      });
    } catch (error) {
      logger.error("Error in CoursesController.generateCourseStream:", error);

      const userId = request.user?.uid;
      if (userId) {
        const { getSocketHandlers } =
          await import("../../core/socket/socket.helpers");
        const socketHandlers = getSocketHandlers(request);
        if (socketHandlers) {
          socketHandlers.emitToUser(userId, "course:stream:error", {
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      next(error);
    }
  }

  async deleteCourse(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params;

      if (!id) {
        response.status(400).json({
          message: "Course ID is required",
        });
        return;
      }

      await this.service.deleteCourse(id!);

      response.status(204).send();
    } catch (error) {
      logger.error("Error in CoursesController.deleteCourse:", error);
      next(error);
    }
  }

  async validateCourseCompleteness(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params;

      if (!id) {
        response.status(400).json({
          message: "Course ID is required",
        });
        return;
      }

      const validation = await this.service.validateCourseCompleteness(id);

      response.status(200).json({
        data: validation,
        message: validation.isComplete
          ? "Course is complete and ready to publish"
          : "Course is incomplete",
      });
    } catch (error) {
      logger.error(
        "Error in CourseController.validateCourseCompleteness:",
        error,
      );
      next(error);
    }
  }

  async publishCourse(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params;

      if (!id) {
        response.status(400).json({
          message: "Course ID is required",
        });
        return;
      }

      const course = await this.service.publishCourse(id);

      response.status(200).json({
        data: course,
        message: "Course published successfully",
      });
    } catch (error) {
      logger.error("Error in CourseController.publishCourse:", error);
      next(error);
    }
  }

  async unpublishCourse(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params;

      if (!id) {
        response.status(400).json({
          message: "Course ID is required",
        });
        return;
      }

      const course = await this.service.unpublishCourse(id);

      response.status(200).json({
        data: course,
        message: "Course unpublished successfully",
      });
    } catch (error) {
      logger.error("Error in CourseController.unpublishCourse:", error);
      next(error);
    }
  }

  async draftCourse(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params;

      if (!id) {
        response.status(400).json({
          message: "Course ID is required",
        });
        return;
      }

      const course = await this.service.draftCourse(id);

      response.status(200).json({
        data: course,
        message: "Course moved to draft successfully",
      });
    } catch (error) {
      logger.error("Error in CourseController.draftCourse:", error);
      next(error);
    }
  }

  async undraftCourse(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params;

      if (!id) {
        response.status(400).json({
          message: "Course ID is required",
        });
        return;
      }

      const course = await this.service.undraftCourse(id);

      response.status(200).json({
        data: course,
        message: "Course restored from draft successfully",
      });
    } catch (error) {
      logger.error("Error in CourseController.undraftCourse:", error);
      next(error);
    }
  }

  /**
   * Generate a complete course with chapters, and lessons
   * Uses Socket.IO for real-time progress updates
   */
  async generateFullCourse(
    request: AuthenticatedRequest,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!this.fullGenerationService) {
        response.status(503).json({
          message: "Full course generation service not available",
        });
        return;
      }

      const courseRequest = {
        ...request.body,
        uid: request.user?.uid,
      };

      // Validate required fields
      const requiredFields = [
        "category",
        "topic",
        "level",
        "duration",
        "noOfChapters",
        "language",
      ];
      const missingFields = requiredFields.filter(
        (field) => !courseRequest[field],
      );

      if (missingFields.length > 0) {
        response.status(400).json({
          message: "Missing required fields",
          missingFields,
        });
        return;
      }

      logger.info("Starting full course generation", {
        userId: request.user?.uid,
        request: courseRequest,
      });

      // Return immediately with job ID, generation continues in background
      response.status(202).json({
        message:
          "Course generation started. Listen to Socket.IO events for progress updates.",
        note: "Connect to Socket.IO and listen for 'generation:progress' events",
      });

      // Run generation in background
      setImmediate(async () => {
        try {
          await this.fullGenerationService!.generateFullCourse(
            request,
            courseRequest,
          );
        } catch (error: any) {
          logger.error("Background course generation failed:", error);
        }
      });
    } catch (error) {
      logger.error("Error in CourseController.generateFullCourse:", error);
      next(error);
    }
  }

  // ============================================
  // NEW: Sequential Course Generation (Legacy generateFullCourse unchanged)
  // ============================================

  /**
   * Generates a course SEQUENTIALLY: module by module with real-time progress
   * Provides better UX with incremental updates and early module preview
   */
  async generateFullCourseSequential(
    request: AuthenticatedRequest,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!this.fullGenerationService) {
        response.status(501).json({
          error: "Full course generation service not available",
        });
        return;
      }

      const courseRequest = {
        ...request.body,
        uid: request.user!.uid,
      };

      logger.info("Starting SEQUENTIAL full course generation", {
        userId: request.user?.uid,
        request: courseRequest,
        mode: "sequential",
      });

      // Return immediately with job ID, generation continues in background
      response.status(202).json({
        message:
          "Sequential course generation started. Listen to Socket.IO events for progress updates.",
        note: "Connect to Socket.IO and listen for 'generation:progress' and 'module:completed' events",
        mode: "sequential",
      });

      // Run sequential generation in background
      setImmediate(async () => {
        try {
          await this.fullGenerationService!.generateFullCourseSequential(
            request,
            courseRequest,
          );
        } catch (error: any) {
          logger.error(
            "Background sequential course generation failed:",
            error,
          );
        }
      });
    } catch (error) {
      logger.error(
        "Error in CourseController.generateFullCourseSequential:",
        error,
      );
      next(error);
    }
  }

  // ============================================
  // NEW: Sequential + Transactional Generation
  // ============================================

  /**
   * Generates a course SEQUENTIALLY with TRANSACTIONAL saves
   * Best of both worlds: incremental updates + data consistency
   */
  async generateFullCourseSequentialTransactional(
    request: AuthenticatedRequest,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!this.fullGenerationService) {
        response.status(501).json({
          error: "Full course generation service not available",
        });
        return;
      }

      const courseRequest = {
        ...request.body,
        uid: request.user!.uid,
      };

      logger.info("Starting SEQUENTIAL TRANSACTIONAL full course generation", {
        userId: request.user?.uid,
        request: courseRequest,
        mode: "sequential-transactional",
      });

      // Return immediately with job ID, generation continues in background
      response.status(202).json({
        message:
          "Sequential transactional course generation started. Listen to Socket.IO events for progress updates.",
        note: "Connect to Socket.IO and listen for 'generation:progress' and 'module:completed' events. Course will only be saved after all modules complete.",
        mode: "sequential-transactional",
        benefits: [
          "Real-time module-by-module progress",
          "Preview staged modules as they generate",
          "Atomic all-or-nothing database save",
          "No partial courses on failure",
        ],
      });

      // Run sequential transactional generation in background
      setImmediate(async () => {
        try {
          await this.fullGenerationService!.generateFullCourseSequentialTransactional(
            request,
            courseRequest,
          );
        } catch (error: any) {
          logger.error(
            "Background sequential transactional course generation failed:",
            error,
          );
        }
      });
    } catch (error) {
      logger.error(
        "Error in CourseController.generateFullCourseSequentialTransactional:",
        error,
      );
      next(error);
    }
  }

  /**
   * Generates a course SEQUENTIALLY with TRANSACTIONAL saves AND real-time AI streaming.
   * Each Gemini call streams raw tokens to the client via the `generation:stream` Socket.IO event.
   */
  async generateFullCourseSequentialTransactionalStreaming(
    request: AuthenticatedRequest,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!this.fullGenerationService) {
        response.status(501).json({
          error: "Full course generation service not available",
        });
        return;
      }

      const courseRequest = {
        ...request.body,
        uid: request.user!.uid,
      };

      const userId = request.user!.uid;
      const socketHandlers = getSocketHandlers(request);

      if (!socketHandlers) {
        response.status(503).json({
          message: "Socket service unavailable",
        });
        return;
      }

      logger.info(
        "Starting SEQUENTIAL TRANSACTIONAL STREAMING full course generation",
        {
          userId,
          request: courseRequest,
          mode: "sequential-transactional-streaming",
        },
      );

      /**
       * emitChunk forwards raw AI tokens to the client via Socket.IO.
       * `step` indicates which part is being generated:
       *   "course"    — course metadata
       *   "module-N"  — module N (chapter)
       *   "lessons-N" — lessons for module N
       */
      const emitChunk = (step: string, chunk: string) => {
        socketHandlers.emitToUser(userId, "generation:stream", { step, chunk });
      };

      response.status(202).json({
        message:
          "Sequential transactional streaming course generation started.",
        note: "Listen to 'generation:stream' for live AI tokens, 'generation:progress' for step updates, 'module:completed' for staged previews, and 'generation:completed' for the final saved result.",
        mode: "sequential-transactional-streaming",
        streamEvent: "generation:stream",
        streamPayload: { step: "course | module-N | lessons-N", chunk: "..." },
      });

      setImmediate(async () => {
        try {
          await this.fullGenerationService!.generateFullCourseSequentialTransactionalStreaming(
            request,
            courseRequest,
            emitChunk,
          );
        } catch (error: any) {
          logger.error(
            "Background sequential transactional streaming generation failed:",
            error,
          );
        }
      });
    } catch (error) {
      logger.error(
        "Error in CourseController.generateFullCourseSequentialTransactionalStreaming:",
        error,
      );
      next(error);
    }
  }
}
