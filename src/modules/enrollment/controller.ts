import type { Request, Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { logger } from "../../core/utils/loggers";
import type { EnrollmentService } from "./service";
import type { EnrollmentQueryParams } from "./types";

export class EnrollmentController {
  private service: EnrollmentService;

  constructor(service: EnrollmentService) {
    this.service = service;
  }

  async enrollInCourse(
    request: AuthenticatedRequest,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = request.user?.uid;
      if (!userId) {
        response.status(401).json({ message: "Unauthorized" });
        return;
      }

      const { courseId } = request.params;
      if (!courseId) {
        response.status(400).json({ message: "Course ID is required" });
        return;
      }

      const enrollment = await this.service.enrollInCourse(courseId, userId);

      response.status(201).json({
        data: enrollment,
        message: "Successfully enrolled in course",
      });
    } catch (error) {
      logger.error("Error in EnrollmentController.enrollInCourse:", error);
      next(error);
    }
  }

  async unenrollFromCourse(
    request: AuthenticatedRequest,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = request.user?.uid;
      if (!userId) {
        response.status(401).json({ message: "Unauthorized" });
        return;
      }

      const { courseId } = request.params;
      if (!courseId) {
        response.status(400).json({ message: "Course ID is required" });
        return;
      }

      await this.service.unenrollFromCourse(courseId, userId);

      response.status(200).json({
        message: "Successfully unenrolled from course",
      });
    } catch (error) {
      logger.error("Error in EnrollmentController.unenrollFromCourse:", error);
      next(error);
    }
  }

  async getEnrollmentStatus(
    request: AuthenticatedRequest,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = request.user?.uid;
      if (!userId) {
        response.status(401).json({ message: "Unauthorized" });
        return;
      }

      const { courseId } = request.params;
      if (!courseId) {
        response.status(400).json({ message: "Course ID is required" });
        return;
      }

      const status = await this.service.getEnrollmentStatus(courseId, userId);

      response.status(200).json({
        data: status,
        message: "Enrollment status retrieved successfully",
      });
    } catch (error) {
      logger.error("Error in EnrollmentController.getEnrollmentStatus:", error);
      next(error);
    }
  }

  async getUserEnrollments(
    request: AuthenticatedRequest,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = request.user?.uid;
      if (!userId) {
        response.status(401).json({ message: "Unauthorized" });
        return;
      }

      const queryParams: EnrollmentQueryParams = {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        status: request.query.status as any,
        courseId: request.query.courseId as string,
        limit: request.query.limit
          ? parseInt(request.query.limit as string)
          : undefined,
        offset: request.query.offset
          ? parseInt(request.query.offset as string)
          : undefined,
      };

      const enrollments = await this.service.getUserEnrollments(
        userId,
        queryParams,
      );

      response.status(200).json({
        data: enrollments,
        message: "Enrollments retrieved successfully",
        total: enrollments.length,
      });
    } catch (error) {
      logger.error("Error in EnrollmentController.getUserEnrollments:", error);
      next(error);
    }
  }

  async getCourseEnrollmentCount(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { courseId } = request.params;
      if (!courseId) {
        response.status(400).json({ message: "Course ID is required" });
        return;
      }

      const count = await this.service.getCourseEnrollmentCount(courseId);

      response.status(200).json({
        data: { courseId, count },
        message: "Enrollment count retrieved successfully",
      });
    } catch (error) {
      logger.error(
        "Error in EnrollmentController.getCourseEnrollmentCount:",
        error,
      );
      next(error);
    }
  }
}
