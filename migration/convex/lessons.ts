import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get a single lesson by ID
 */
export const getLesson = query({
  args: { id: v.id("lessons") },
  handler: async (ctx, args) => {
    const lesson = await ctx.db.get(args.id);
    if (!lesson) {
      throw new Error("Lesson not found");
    }
    return lesson;
  },
});

/**
 * Get all lessons for a chapter
 */
export const getLessonsByChapter = query({
  args: { chapterId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("lessons")
      .filter((q) => q.eq(q.field("chapterId"), args.chapterId))
      .order("asc", (q) => q.field("lessonOrder"))
      .collect();
  },
});

/**
 * Get all lessons for a course
 */
export const getLessonsByCourse = query({
  args: { courseId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("lessons")
      .filter((q) => q.eq(q.field("courseId"), args.courseId))
      .collect();
  },
});

/**
 * Create a new lesson
 */
export const createLesson = mutation({
  args: {
    chapterId: v.string(),
    courseId: v.optional(v.string()),
    lessonOrder: v.number(),
    lessonName: v.string(),
    type: v.string(),
    duration: v.string(),
    lessonDescription: v.string(),
    content: v.optional(v.string()),
    videoSearchQuery: v.optional(v.string()),
    selectedVideoId: v.optional(v.string()),
    videoTranscript: v.optional(v.string()),
    transcriptLanguage: v.optional(v.string()),
    resources: v.array(
      v.object({
        title: v.string(),
        url: v.string(),
        type: v.string(),
        description: v.string(),
      })
    ),
    learningOutcome: v.string(),
    prerequisites: v.array(v.string()),
    playgroundEnvironment: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const lessonId = await ctx.db.insert("lessons", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return await ctx.db.get(lessonId);
  },
});

/**
 * Update an existing lesson
 */
export const updateLesson = mutation({
  args: {
    id: v.id("lessons"),
    updates: v.any(),
  },
  handler: async (ctx, args) => {
    const updates = {
      ...args.updates,
      updatedAt: Date.now(),
    };
    await ctx.db.patch(args.id, updates);
    return await ctx.db.get(args.id);
  },
});

/**
 * Delete a lesson
 */
export const deleteLesson = mutation({
  args: { id: v.id("lessons") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
