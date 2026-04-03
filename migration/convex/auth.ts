import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get user by UID
 */
export const getUserByUid = query({
  args: { uid: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("uid"), args.uid))
      .unique();
  },
});

/**
 * Get user by ID
 */
export const getUser = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  },
});

/**
 * Create a new user
 */

type User = Doc<"users">;

export const createUser = mutation({
  args: {
    uid: v.string(),
    email: v.string(),
    password: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("uid"), args.uid))
      .unique();

    if (existingUser) {
      return existingUser;
    }

    const userId = await ctx.db.insert("users", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return await ctx.db.get(userId);
  },
});

/**
 * Update user profile
 */
export const updateUserProfile = mutation({
  args: {
    uid: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    photoURL: v.optional(v.string()),
    isPrivate: v.optional(v.boolean()),
    githubUsername: v.optional(v.string()),
    githubId: v.optional(v.string()),
    githubConnectedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("uid"), args.uid))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const updates = {
      ...args,
      uid: undefined, // don't update uid
      updatedAt: Date.now(),
    };

    await ctx.db.patch(user._id, updates);
    return await ctx.db.get(user._id);
  },
});

/**
 * Get user profile (public)
 */
export const getUserProfile = query({
  args: { uid: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("uid"), args.uid))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Return limited public profile if user is private
    if (user.isPrivate) {
      return {
        uid: user.uid,
        firstName: user.firstName,
        lastName: user.lastName,
        photoURL: user.photoURL,
      };
    }

    return user;
  },
});
