import type { NextFunction, Response } from "express";
import { logger } from "../utils/loggers";
import { firebaseFirestore } from "../config/firebase";
import { AppError } from "../utils/errors";
import type { AuthenticatedRequest } from "./auth.middleware";

export const courseOwnershipMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const courseId = req.params.id || req.params.courseId || req.body.courseId;

    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    const courseDoc = await firebaseFirestore
      .collection("courses")
      .doc(courseId)
      .get();

    if (!courseDoc.exists) {
      throw new AppError("Course not found", 404);
    }

    const courseData = courseDoc.data();

    if (courseData?.uid !== req.user?.uid) {
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
