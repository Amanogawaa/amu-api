import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get enrollment by ID
 */
export const getEnrollment = query({
  args: { id: v.id("enrollments") },
  handler: async (ctx, args) => {
    const enrollment = await ctx.db.get(args.id);
    if (!enrollment) {
      throw new Error("Enrollment not found");
    }
    return enrollment;
  },
});

/**
 * Get all enrollments for a user
 */
export const getEnrollmentsByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("enrollments")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();
  },
});

/**
 * Get all enrollments for a course
 */
export const getEnrollmentsByCourse = query({
  args: { courseId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("enrollments")
      .filter((q) => q.eq(q.field("courseId"), args.courseId))
      .collect();
  },
});

/**
 * Check if user is enrolled in a course
 */
export const isUserEnrolled = query({
  args: { userId: v.string(), courseId: v.string() },
  handler: async (ctx, args) => {
    const enrollment = await ctx.db
      .query("enrollments")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), args.userId),
          q.eq(q.field("courseId"), args.courseId),
        ),
      )
      .unique();

    return !!enrollment;
  },
});

/**
 * Enroll a user in a course
 */
export const enrollInCourse = mutation({
  args: { userId: v.string(), courseId: v.string() },
  handler: async (ctx, args) => {
    // Check if already enrolled
    const existingEnrollment = await ctx.db
      .query("enrollments")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), args.userId),
          q.eq(q.field("courseId"), args.courseId),
        ),
      )
      .unique();

    if (existingEnrollment) {
      return existingEnrollment;
    }

    const enrollmentId = await ctx.db.insert("enrollments", {
      courseId: args.courseId,
      userId: args.userId,
      status: "active",
      enrolledAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return await ctx.db.get(enrollmentId);
  },
});

/**
 * Update enrollment status
 */
export const updateEnrollmentStatus = mutation({
  args: {
    id: v.id("enrollments"),
    status: v.string(), // "active" | "completed" | "dropped"
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });
    return await ctx.db.get(args.id);
  },
});

/**
 * Get enrollment count for a course
 */
export const getEnrollmentCount = query({
  args: { courseId: v.string() },
  handler: async (ctx, args) => {
    const enrollments = await ctx.db
      .query("enrollments")
      .filter((q) => q.eq(q.field("courseId"), args.courseId))
      .collect();

    return enrollments.length;
  },
});
