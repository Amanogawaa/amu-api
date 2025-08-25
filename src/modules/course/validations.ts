import z from 'zod';

export const COURSESCHEMA = z.object({
  course: z.object({
    name: z.string(),
    subtitle: z.string().optional(),
    description: z.string(),
    category: z.string(),
    topic: z.string(),
    level: z.string(),
    language: z.string().default('en'),
    prerequisites: z.string().optional(),
    learning_outcomes: z.array(z.string()),
    duration: z.string(),
    no_of_chapters: z.number(),
    publish: z.boolean(),
    include_certificate: z.boolean(),
    banner_url: z.string(),
  }),
});
