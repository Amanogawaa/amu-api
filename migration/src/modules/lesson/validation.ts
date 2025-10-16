import z from 'zod';

export const LESSONSCHEMA = z.object({
  lessons: z.array(
    z.object({
      lessonId: z.string(),
      title: z.string(),
      type: z.enum(['video', 'article', 'quiz', 'assignment']),
      description: z.string(),
      duration: z.string(),
      content: z.string().optional(),
      videoUrl: z.string().optional(),
      resources: z
        .array(
          z.object({
            title: z.string(),
            url: z.string(),
            type: z.enum(['pdf', 'link', 'doc', 'image']),
          })
        )
        .optional(),
      questions: z
        .array(
          z.object({
            question: z.string(),
            type: z.string(),
            options: z.array(z.string()).optional(),
            correctAnswer: z.string(),
            explanation: z.string().optional(),
          })
        )
        .optional(),
    })
  ),
});
