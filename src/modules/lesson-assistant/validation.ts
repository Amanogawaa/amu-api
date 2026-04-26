import { z } from "zod";

export const askQuestionSchema = z.object({
  question: z
    .string()
    .min(1, "Question is required")
    .max(1000, "Question must be less than 1000 characters"),
  chatId: z.string().optional(),
});

export const chatQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional().default(50),
});

export type AskQuestionInput = z.infer<typeof askQuestionSchema>;
export type ChatQueryInput = z.infer<typeof chatQuerySchema>;
