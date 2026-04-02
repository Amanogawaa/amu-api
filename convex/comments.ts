import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get a single comment
 */
export const getComment = query({
  args: { id: v.id("comments") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get all comments for a course
 */
export const getCommentsByCourse = query({
  args: { courseId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("comments")
      .filter((q) =>
        q.and(
          q.eq(q.field("courseId"), args.courseId),
          q.eq(q.field("deleted"), false),
        ),
      )
      .order("desc", (q) => q.field("createdAt"))
      .collect();
  },
});

/**
 * Create a comment
 */
export const createComment = mutation({
  args: {
    courseId: v.string(),
    authorId: v.string(),
    authorName: v.optional(v.string()),
    authorEmail: v.optional(v.string()),
    content: v.string(),
    parentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const commentId = await ctx.db.insert("comments", {
      ...args,
      deleted: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return await ctx.db.get(commentId);
  },
});

/**
 * Update a comment
 */
export const updateComment = mutation({
  args: {
    id: v.id("comments"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      content: args.content,
      updatedAt: Date.now(),
    });
    return await ctx.db.get(args.id);
  },
});

/**
 * Soft delete a comment
 */
export const deleteComment = mutation({
  args: { id: v.id("comments") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      deleted: true,
      updatedAt: Date.now(),
    });
    return await ctx.db.get(args.id);
  },
});

/**
 * Get comment count for a course
 */
export const getCommentCount = query({
  args: { courseId: v.string() },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .filter((q) =>
        q.and(
          q.eq(q.field("courseId"), args.courseId),
          q.eq(q.field("deleted"), false),
        ),
      )
      .collect();

    return comments.length;
  },
});
