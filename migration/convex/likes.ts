import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get a single like
 */
export const getLike = query({
  args: { id: v.id("likes") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Check if user liked a course
 */
export const isCourseLikedByUser = query({
  args: { userId: v.string(), courseId: v.string() },
  handler: async (ctx, args) => {
    const like = await ctx.db
      .query("likes")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), args.userId),
          q.eq(q.field("courseId"), args.courseId)
        )
      )
      .unique();

    return !!like;
  },
});

/**
 * Get all likes for a course
 */
export const getLikesByCourse = query({
  args: { courseId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("likes")
      .filter((q) => q.eq(q.field("courseId"), args.courseId))
      .collect();
  },
});

/**
 * Get likes count for a course
 */
export const getLikeCount = query({
  args: { courseId: v.string() },
  handler: async (ctx, args) => {
    const likes = await ctx.db
      .query("likes")
      .filter((q) => q.eq(q.field("courseId"), args.courseId))
      .collect();

    return likes.length;
  },
});

/**
 * Like a course
 */
export const likeCourse = mutation({
  args: { userId: v.string(), courseId: v.string() },
  handler: async (ctx, args) => {
    // Check if already liked
    const existingLike = await ctx.db
      .query("likes")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), args.userId),
          q.eq(q.field("courseId"), args.courseId)
        )
      )
      .unique();

    if (existingLike) {
      throw new Error("Already liked this course");
    }

    const likeId = await ctx.db.insert("likes", {
      ...args,
      createdAt: Date.now(),
    });

    // Get updated like count
    const likes = await ctx.db
      .query("likes")
      .filter((q) => q.eq(q.field("courseId"), args.courseId))
      .collect();

    return {
      liked: true,
      likesCount: likes.length,
    };
  },
});

/**
 * Unlike a course
 */
export const unlikeCourse = mutation({
  args: { userId: v.string(), courseId: v.string() },
  handler: async (ctx, args) => {
    const like = await ctx.db
      .query("likes")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), args.userId),
          q.eq(q.field("courseId"), args.courseId)
        )
      )
      .unique();

    if (!like) {
      throw new Error("Like not found");
    }

    await ctx.db.delete(like._id);

    // Get updated like count
    const likes = await ctx.db
      .query("likes")
      .filter((q) => q.eq(q.field("courseId"), args.courseId))
      .collect();

    return {
      liked: false,
      likesCount: likes.length,
    };
  },
});

/**
 * Toggle like on a course
 */
export const toggleLike = mutation({
  args: { userId: v.string(), courseId: v.string() },
  handler: async (ctx, args) => {
    const like = await ctx.db
      .query("likes")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), args.userId),
          q.eq(q.field("courseId"), args.courseId)
        )
      )
      .unique();

    if (like) {
      await ctx.db.delete(like._id);
    } else {
      await ctx.db.insert("likes", {
        ...args,
        createdAt: Date.now(),
      });
    }

    // Get updated like count and status
    const likes = await ctx.db
      .query("likes")
      .filter((q) => q.eq(q.field("courseId"), args.courseId))
      .collect();

    return {
      liked: !like,
      likesCount: likes.length,
    };
  },
});
