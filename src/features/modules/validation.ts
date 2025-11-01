import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../../utils/errors';
import { noSniff } from 'helmet';

// Schema for capstone project
const capstoneProjectSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  type: z.enum([
    'code_project',
    'design_project',
    'writing_project',
    'analysis_project',
  ]),
  deliverables: z.array(z.string()).min(1, 'At least one deliverable required'),
  technicalRequirements: z.array(z.string()).optional(),
  assessmentType: z.enum(['automated', 'self_assessment', 'peer_review']),
  estimatedTime: z.string().regex(/^\d+h\s\d+m$/, 'Must be in format "Xh Ym"'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
});

// Schema for generating modules
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
  noOfModules: z.number().int().min(3).max(10).optional().default(5),
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

// // Schema for creating/updating a module
// export const createModuleSchema = z.object({
//   courseId: z.string().min(1, 'Course ID is required'),
//   moduleOrder: z.number().int().min(1),
//   courseName: z.string().min(3).max(100),
//   courseDescription: z.string().min(10).max(500),
//   estimatedDuration: z
//     .string()
//     .regex(/^\d+h\s\d+m$/, 'Must be in format "Xh Ym"'),
//   estimatedChapterCount: z.number().int().min(1).max(20),
//   learningObjectives: z.array(z.string()).min(3).max(5),
//   keySkills: z.array(z.string()).min(1),
//   prerequisiteModules: z.array(z.string()).optional().default([]),
//   capstoneProject: capstoneProjectSchema.optional(),
// });

// export const updateModuleSchema = createModuleSchema
//   .partial()
//   .omit({ courseId: true });

// Validation middleware
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
