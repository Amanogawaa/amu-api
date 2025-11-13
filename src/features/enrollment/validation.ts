import { z } from 'zod';
import type { NextFunction, Request, Response } from 'express';
import { logger } from '../../utils/loggers';

const enrollmentSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
});

export const validateEnrollmentRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    enrollmentSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('Enrollment validation failed:', error.issues);
      res.status(400).json({
        message: 'Invalid request data',
        errors: error.issues,
      });
      return;
    }
    next(error);
  }
};

export const validateCourseIdParam = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { courseId } = req.params;

  if (!courseId || typeof courseId !== 'string' || courseId.trim() === '') {
    res.status(400).json({
      message: 'Valid course ID is required',
    });
    return;
  }

  next();
};
