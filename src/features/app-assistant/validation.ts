import { z } from "zod";

export const askAppQuestionSchema = z.object({
  question: z.string().min(1, "Question cannot be empty").max(2000, "Question is too long"),
});

export const appChatQuerySchema = z.object({
  limit: z.string().regex(/^\d+$/).optional().transform(Number),
  offset: z.string().regex(/^\d+$/).optional().transform(Number),
});
