import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get a single chapter by ID
 */
export const getChapter = query({
  args: { id: v.id("chapters") },
  handler: async (ctx, args) => {
    const chapter = await ctx.db.get(args.id);
    if (!chapter) {
      throw new Error("Chapter not found");
    }
    return chapter;
  },
});

/**
 * Get all chapters for a course
 */
export const getChaptersByCourse = query({
  args: { courseId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chapters")
      .filter((q) => q.eq(q.field("courseId"), args.courseId))
      .order("asc", (q) => q.field("chapterOrder"))
      .collect();
  },
});

/**
 * Create a new chapter
 */
export const createChapter = mutation({
  args: {
    courseId: v.string(),
    courseName: v.string(),
    chapterOrder: v.number(),
    chapterName: v.string(),
    chapterDescription: v.string(),
    estimatedDuration: v.string(),
    learningObjectives: v.array(v.string()),
    keyTopics: v.array(v.string()),
    prerequisites: v.array(v.string()),
    practicalApplication: v.string(),
    estimatedLessonCount: v.number(),
  },
  handler: async (ctx, args) => {
    const chapterId = await ctx.db.insert("chapters", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return await ctx.db.get(chapterId);
  },
});

/**
 * Update an existing chapter
 */
export const updateChapter = mutation({
  args: {
    id: v.id("chapters"),
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
 * Delete a chapter and all its lessons
 */
export const deleteChapter = mutation({
  args: { id: v.id("chapters") },
  handler: async (ctx, args) => {
    const lessons = await ctx.db
      .query("lessons")
      .filter((q) => q.eq(q.field("chapterId"), args.id.toString()))
      .collect();

    for (const lesson of lessons) {
      await ctx.db.delete(lesson._id);
    }

    await ctx.db.delete(args.id);
  },
});

/**
 * Get chapter with lesson details
 */
export const getChapterWithLessons = query({
  args: { id: v.id("chapters") },
  handler: async (ctx, args) => {
    const chapter = await ctx.db.get(args.id);
    if (!chapter) {
      throw new Error("Chapter not found");
    }

    const lessons = await ctx.db
      .query("lessons")
      .filter((q) => q.eq(q.field("chapterId"), args.id.toString()))
      .order("asc", (q) => q.field("lessonOrder"))
      .collect();

    return {
      ...chapter,
      lessons,
    };
  },
});
