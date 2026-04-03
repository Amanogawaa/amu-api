import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get user by ID
 */
export const getUserById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get user by email
 */
export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .unique();
  },
});

/**
 * Create a new user
 */
export const createUser = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    program: v.string(),
    year: v.number(),
    school: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .unique();

    if (existingUser) {
      return existingUser;
    }

    const user = await ctx.db.insert("users", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return await ctx.db.get(user);
  },
});

/**
 * Update user profile
 */
export const updateUserProfile = mutation({
  args: {
    id: v.id("users"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    photoURL: v.optional(v.string()),
    isPrivate: v.optional(v.boolean()),
    githubUsername: v.optional(v.string()),
    githubId: v.optional(v.string()),
    githubConnectedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);

    if (!user) {
      throw new Error("User not found");
    }

    const { id, ...updates } = args;
    const patchData = {
      ...updates,
      updatedAt: Date.now(),
    };

    await ctx.db.patch(args.id, patchData);
    return await ctx.db.get(args.id);
  },
});

/**
 * Get user profile (public)
 */
export const getUserProfile = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);

    if (!user) {
      throw new Error("User not found");
    }

    // Return limited public profile if user is private
    if (user.isPrivate) {
      return {
        firstName: user.firstName,
        lastName: user.lastName,
        photoURL: user.photoURL,
      };
    }

    return user;
  },
});
