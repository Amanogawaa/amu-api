import { z } from "zod";

export const generateQuizSchema = z.object({
  lessonId: z.string().min(1, "Lesson ID is required"),
  lessonName: z.string().min(1, "Lesson name is required"),
  previousLessonsContent: z
    .string()
    .min(1, "Previous lessons content is required"),
  numberOfQuestions: z.number().int().positive().max(20).optional().default(5),
  difficulty: z.enum(["easy", "medium", "hard"]).optional().default("medium"),
});

export const submitQuizSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1, "Question ID is required"),
        selectedAnswer: z.union([
          z.string().min(1, "Selected answer is required"),
          z.array(z.string()).min(1, "At least one answer is required"),
        ]),
      }),
    )
    .min(1, "At least one answer is required"),
});

export type GenerateQuizInput = z.infer<typeof generateQuizSchema>;
export type SubmitQuizInput = z.infer<typeof submitQuizSchema>;
