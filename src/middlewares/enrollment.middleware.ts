import type { NextFunction, Response } from "express";
import { logger } from "../utils/loggers";
import { firebaseFirestore } from "../config/firebase";
import { AppError } from "../utils/errors";
import type { AuthenticatedRequest } from "./auth.middleware";

export const enrollmentMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.uid;

    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const courseId =
      req.params.courseId || req.body.courseId || req.query.courseId;

    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    const courseDoc = await firebaseFirestore
      .collection("courses")
      .doc(courseId as string)
      .get();

    if (!courseDoc.exists) {
      throw new AppError("Course not found", 404);
    }

    const courseData = courseDoc.data();

    if (courseData?.uid === userId) {
      next();
      return;
    }

    const enrollmentId = `${courseId}_${userId}`;
    const enrollmentDoc = await firebaseFirestore
      .collection("enrollments")
      .doc(enrollmentId)
      .get();

    if (!enrollmentDoc.exists) {
      throw new AppError(
        "You must enroll in this course to access its content",
        403,
      );
    }

    const enrollmentData = enrollmentDoc.data();

    if (enrollmentData?.status !== "active") {
      throw new AppError("Your enrollment in this course is not active", 403);
    }

    next();
  } catch (error) {
    logger.error("Error in enrollmentMiddleware:", error);
    next(error);
  }
};

export const lessonEnrollmentMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.uid;

    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const lessonId = req.params.lessonId || req.params.id;
    const chapterId = req.params.chapterId;

    if (!lessonId && !chapterId) {
      throw new AppError("Lesson or Chapter ID is required", 400);
    }

    let courseId: string | undefined;

    if (lessonId) {
      const lessonDoc = await firebaseFirestore
        .collection("lessons")
        .doc(lessonId as string)
        .get();

      if (!lessonDoc.exists) {
        throw new AppError("Lesson not found", 404);
      }

      const lessonData = lessonDoc.data();
      const chapterIdFromLesson = lessonData?.chapterId;

      const chapterDoc = await firebaseFirestore
        .collection("chapters")
        .doc(chapterIdFromLesson)
        .get();

      if (!chapterDoc.exists) {
        throw new AppError("Chapter not found", 404);
      }

      const chapterData = chapterDoc.data();
      courseId = chapterData?.courseId;
    } else if (chapterId) {
      const chapterDoc = await firebaseFirestore
        .collection("chapters")
        .doc(chapterId as string)
        .get();

      if (!chapterDoc.exists) {
        throw new AppError("Chapter not found", 404);
      }

      const chapterData = chapterDoc.data();
      courseId = chapterData?.courseId;
    }

    if (!courseId) {
      throw new AppError("Could not determine course ID", 400);
    }

    const courseDoc = await firebaseFirestore
      .collection("courses")
      .doc(courseId)
      .get();

    if (!courseDoc.exists) {
      throw new AppError("Course not found", 404);
    }

    const courseData = courseDoc.data();

    if (courseData?.uid === userId) {
      next();
      return;
    }

    const enrollmentId = `${courseId}_${userId}`;
    const enrollmentDoc = await firebaseFirestore
      .collection("enrollments")
      .doc(enrollmentId)
      .get();

    if (!enrollmentDoc.exists) {
      throw new AppError(
        "You must enroll in this course to access its content",
        403,
      );
    }

    const enrollmentData = enrollmentDoc.data();

    if (enrollmentData?.status !== "active") {
      throw new AppError("Your enrollment in this course is not active", 403);
    }

    next();
  } catch (error) {
    logger.error("Error in lessonEnrollmentMiddleware:", error);
    next(error);
  }
};
