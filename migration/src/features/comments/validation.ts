import { z } from "zod";

export const createCommentSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
  content: z
    .string()
    .min(1, "Comment content is required")
    .max(1000, "Comment must be less than 1000 characters"),
  parentId: z.string().optional(),
});

export const updateCommentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment content is required")
    .max(1000, "Comment must be less than 1000 characters"),
});

export const commentQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  offset: z.coerce.number().int().nonnegative().optional().default(0),
  parentId: z.string().optional(),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type CommentQueryInput = z.infer<typeof commentQuerySchema>;
