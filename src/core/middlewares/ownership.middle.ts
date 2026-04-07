import type { NextFunction, Response } from "express";
import { logger } from "../utils/loggers";
import { AppError } from "../utils/errors";
import { convexClient, api } from "../convex";
import type { AuthenticatedRequest } from "./auth.middleware";

export const courseOwnershipMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    const courseId = req.params.id || req.params.courseId || req.body.courseId;

    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    const course = await convexClient.query((api as any).courses.getCourse, {
      id: courseId,
    });

    if (!course) {
      throw new AppError("Course not found", 404);
    }

    if (course.userId !== userId) {
      throw new AppError(
        "You do not have permission to access this course",
        403,
      );
    }

    next();
  } catch (error) {
    logger.error("Course ownership middleware error:", error);
    next(error);
  }
};
