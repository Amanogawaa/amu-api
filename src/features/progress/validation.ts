import { z } from 'zod';

export const progressUpdateSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  lessonId: z.string().min(1, 'Lesson ID is required'),
  completed: z.boolean(),
  totalLessons: z.number().int().positive().optional(),
});

export const getProgressQuerySchema = z.object({
  courseId: z.string().optional(),
});

export type ProgressUpdateInput = z.infer<typeof progressUpdateSchema>;
export type GetProgressQueryInput = z.infer<typeof getProgressQuerySchema>;
