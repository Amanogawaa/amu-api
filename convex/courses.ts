import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get a single course by ID
 */
export const getCourse = query({
  args: { id: v.id("courses") },
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.id);
    if (!course) {
      throw new Error("Course not found");
    }
    return course;
  },
});

/**
 * Get all courses (with optional filtering)
 */
export const getAllCourses = query({
  args: {
    category: v.optional(v.string()),
    level: v.optional(v.string()),
    publishedOnly: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("courses");

    if (args.publishedOnly) {
      query = query.filter((q) => q.eq(q.field("publish"), true));
    }

    if (args.category) {
      query = query.filter((q) => q.eq(q.field("category"), args.category));
    }

    if (args.level) {
      query = query.filter((q) => q.eq(q.field("level"), args.level));
    }

    const courses = await query.collect();
    return args.limit ? courses.slice(0, args.limit) : courses;
  },
});

/**
 * Get courses created by a specific user
 */
export const getCoursesByUser = query({
  args: { uid: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("courses")
      .filter((q) => q.eq(q.field("uid"), args.uid))
      .collect();
  },
});

/**
 * Create a new course
 */
export const createCourse = mutation({
  args: {
    uid: v.string(),
    name: v.string(),
    description: v.string(),
    topic: v.string(),
    level: v.string(),
    category: v.string(),
    duration: v.string(),
    language: v.string(),
    targetAudience: v.string(),
    prerequisites: v.string(),
    noOfChapters: v.number(),
    skillsGained: v.array(v.string()),
    learning_outcomes: v.array(v.string()),
    publish: v.boolean(),
    draft: v.boolean(),
    supportsCodePlayground: v.optional(v.boolean()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const courseId = await ctx.db.insert("courses", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return await ctx.db.get(courseId);
  },
});

/**
 * Update an existing course
 */
export const updateCourse = mutation({
  args: {
    id: v.id("courses"),
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
 * Delete a course
 */
export const deleteCourse = mutation({
  args: { id: v.id("courses") },
  handler: async (ctx, args) => {
    // Delete associated chapters, lessons, enrollments, comments, likes
    const chapters = await ctx.db
      .query("chapters")
      .filter((q) => q.eq(q.field("courseId"), args.id.toString()))
      .collect();

    for (const chapter of chapters) {
      const lessons = await ctx.db
        .query("lessons")
        .filter((q) =>
          q.eq(q.field("chapterId"), chapter._id.toString())
        )
        .collect();

      for (const lesson of lessons) {
        await ctx.db.delete(lesson._id);
      }

      await ctx.db.delete(chapter._id);
    }

    await ctx.db.delete(args.id);
  },
});

/**
 * Get course with related data (chapters, lessons, stats)
 */
export const getCourseWithDetails = query({
  args: { id: v.id("courses") },
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.id);
    if (!course) {
      throw new Error("Course not found");
    }

    const chapters = await ctx.db
      .query("chapters")
      .filter((q) => q.eq(q.field("courseId"), args.id.toString()))
      .collect();

    const enrollments = await ctx.db
      .query("enrollments")
      .filter((q) => q.eq(q.field("courseId"), args.id.toString()))
      .collect();

    const comments = await ctx.db
      .query("comments")
      .filter((q) => q.eq(q.field("courseId"), args.id.toString()))
      .collect();

    const likes = await ctx.db
      .query("likes")
      .filter((q) => q.eq(q.field("courseId"), args.id.toString()))
      .collect();

    return {
      ...course,
      chapters: chapters.length,
      enrollmentCount: enrollments.length,
      commentsCount: comments.length,
      likesCount: likes.length,
    };
  },
});
