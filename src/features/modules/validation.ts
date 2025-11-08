import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../../utils/errors';

export const generateModulesSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  courseName: z.string().min(3).max(100),
  courseDescription: z.string().min(10).max(100000),
  learningOutcomes: z.array(z.string()).min(3).max(10),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  duration: z.string().regex(/^\d+\s*(hour|hours|minute|minutes|day|days)$/i, {
    message: 'Duration must be in format: "X hours" or "X minutes"',
  }),
  language: z.string().min(2).max(30),
  noOfModules: z.number().int().min(2).max(10).optional().default(5),
  prerequisites: z.string().max(500).optional().default(''),
});

export const updateModuleSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  courseName: z.string().min(3).max(100).optional(),
  courseDescription: z.string().min(10).max(100000).optional(),
  learningOutcomes: z.array(z.string()).min(3).max(10).optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  duration: z
    .string()
    .regex(/^\d+\s*(hour|hours|minute|minutes|day|days)$/i, {
      message: 'Duration must be in format: "X hours" or "X minutes"',
    })
    .optional(),
  noOfModules: z.number().int().min(3).max(10).optional(),
  prerequisites: z.string().max(500).optional(),
  userInstructions: z.string().max(1000).optional(),
  keepExistingIds: z.boolean().optional(),
});

export const validateGenerateModules = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    generateModulesSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(
        error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
      );
    }
    next(error);
  }
};

export const validateUpdateModule = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    updateModuleSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(
        error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
      );
    }
    next(error);
  }
};
