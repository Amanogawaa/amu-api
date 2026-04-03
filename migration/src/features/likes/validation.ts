import { z } from "zod";

export const likeToggleSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
});

export type LikeToggleInput = z.infer<typeof likeToggleSchema>;
