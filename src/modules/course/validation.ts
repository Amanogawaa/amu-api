import type { NextFunction } from "express";
import { z } from "zod";
import { ValidationError } from "../../core/utils/errors";

export const generateCourseSchema = z.object({
  category: z.string().min(2).max(50),
  topic: z.string().min(2).max(100),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  duration: z.string().regex(/^\d+\s*(hour|hours|minute|minutes|day|days)$/i, {
    message: "Duration must be in format: \"X hours\" or 'X minutes'",
  }),
  noOfChapters: z.number().int().min(1).max(20),
  language: z.string().min(2).max(50),
  userInstructions: z.string().max(1000).optional(),
  promptMode: z.enum(["system", "legacy"]).optional(),
});

export const validateGenerateCourse = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    generateCourseSchema.parse(req.body);
    next();
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(
        error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", "),
      );
    }
    next(error);
  }
};
