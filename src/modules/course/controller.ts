import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../../core/middlewares/auth.middleware";
import { sendResponse } from "../../core/utils/response";
import { CourseService } from "./service";
import type { CourseQueryParams, GenerateCourseRequest } from "./types";
import { logger } from "../../core/utils/loggers";
import { FullCourseGenerationService } from "../../core/service/generation.service";
import { getSocketHandlers } from "../../core/socket/socket.helpers";

export class CourseController {
  private courseService: CourseService;
  private fullGenerationService?: FullCourseGenerationService;

  constructor(
    courseService: CourseService,
    fullGenerationService?: FullCourseGenerationService,
  ) {
    this.courseService = courseService;
    this.fullGenerationService = fullGenerationService;
  }

  /**
   * Get all courses with optional filtering
   */
  async getAllCourses(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const params: CourseQueryParams = {
        category: req.query.category as string,
        level: req.query.level as any,
        publishedOnly: req.query.publishedOnly === "true",
        draft: req.query.draft === "true",
        limit: req.query.limit
          ? parseInt(req.query.limit as string)
          : undefined,
      };

      const courses = await this.courseService.getAllCourses(params);

      return sendResponse(res, courses, 200, "Courses retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single course by ID
   */
  async getCourseById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const courseId = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

      if (!courseId) {
        return sendResponse(res, null, 400, "Course ID is required");
      }

      const course = await this.courseService.getCourseById(courseId);

      return sendResponse(res, course, 200, "Course retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get course with details (chapters, enrollments, comments, likes)
   */
  async getCourseWithDetails(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const courseId = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

      if (!courseId) {
        return sendResponse(res, null, 400, "Course ID is required");
      }

      const course = await this.courseService.getCourseWithDetails(courseId);

      return sendResponse(
        res,
        course,
        200,
        "Course with details retrieved successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get courses created by authenticated user
   */
  async getUserCourses(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return sendResponse(res, null, 401, "Unauthorized");
      }

      const courses = await this.courseService.getCoursesByUser(userId);

      return sendResponse(
        res,
        courses,
        200,
        "User courses retrieved successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new course
   */
  async createCourse(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return sendResponse(res, null, 401, "Unauthorized");
      }

      const courseData = req.body as GenerateCourseRequest;
      const course = await this.courseService.createCourse(userId, courseData);

      return sendResponse(res, course, 201, "Course created successfully");
    } catch (error) {
      next(error);
    }
  }

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
        userId: request.user?.id,
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

  /**
   * Delete a course
   */
  async deleteCourse(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const courseId = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

      if (!courseId) {
        return sendResponse(res, null, 400, "Course ID is required");
      }

      await this.courseService.deleteCourse(courseId);

      return sendResponse(res, null, 200, "Course deleted successfully");
    } catch (error) {
      next(error);
    }
  }
}
