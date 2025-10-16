import z from 'zod';

export const CHAPTERSCHEMA = z.object({
  chapters: z.array(
    z.object({
      chapterId: z.number(),
      title: z.string(),
      description: z.string(),
      estimatedDuration: z.string(),
      lessons: z.array(
        z.object({
          lessonId: z.string(),
          title: z.string(),
          type: z.string(),
          duration: z.string(),
          description: z.string(),
        })
      ),
    })
  ),
});
