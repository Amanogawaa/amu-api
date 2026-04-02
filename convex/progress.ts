import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get progress record for user in course
 */
export const getProgress = query({
  args: { userId: v.string(), courseId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("progress")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), args.userId),
          q.eq(q.field("courseId"), args.courseId),
        ),
      )
      .unique();
  },
});

/**
 * Get all progress for a user
 */
export const getProgressByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("progress")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();
  },
});

/**
 * Create or update progress
 */
export const updateProgress = mutation({
  args: {
    userId: v.string(),
    courseId: v.string(),
    chapterId: v.optional(v.string()),
    lessonId: v.optional(v.string()),
    status: v.string(), // "started" | "in_progress" | "completed"
    progress: v.number(), // 0-100
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("progress")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), args.userId),
          q.eq(q.field("courseId"), args.courseId),
        ),
      )
      .unique();

    const progressData = {
      userId: args.userId,
      courseId: args.courseId,
      chapterId: args.chapterId,
      lessonId: args.lessonId,
      status: args.status,
      progress: args.progress,
      lastAccessedAt: Date.now(),
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, progressData);
      return await ctx.db.get(existing._id);
    } else {
      const progressId = await ctx.db.insert("progress", {
        ...progressData,
        createdAt: Date.now(),
        completedAt: args.status === "completed" ? Date.now() : undefined,
      });
      return await ctx.db.get(progressId);
    }
  },
});

/**
 * Mark course as completed
 */
export const completeProgress = mutation({
  args: { userId: v.string(), courseId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("progress")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), args.userId),
          q.eq(q.field("courseId"), args.courseId),
        ),
      )
      .unique();

    if (!existing) {
      throw new Error("Progress record not found");
    }

    await ctx.db.patch(existing._id, {
      status: "completed",
      progress: 100,
      completedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return await ctx.db.get(existing._id);
  },
});

/**
 * Get overall course progress for a user
 */
export const getCourseProgress = query({
  args: { userId: v.string(), courseId: v.string() },
  handler: async (ctx, args) => {
    const progress = await ctx.db
      .query("progress")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), args.userId),
          q.eq(q.field("courseId"), args.courseId),
        ),
      )
      .unique();

    return progress || null;
  },
});
