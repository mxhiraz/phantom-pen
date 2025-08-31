import { v, Validator } from "convex/values";
import { internalMutation, mutation } from "./functions";
import { query } from "./_generated/server";
import { TABLES, INDEXES, ERROR_MESSAGES } from "../lib/constants";
import { UserJSON } from "@clerk/backend";

export const getUser = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query(TABLES.USERS)
      .withIndex(INDEXES.BY_CLERK_ID, (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});

export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query(TABLES.USERS)
      .withIndex(INDEXES.BY_CLERK_ID, (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      return null;
    }
    return {
      username: user?.firstName + " " + user?.lastName || "",
      profilePicture: user?.profilePicture || "",
    };
  },
});
export const upsertFromClerk = internalMutation({
  args: { data: v.any() as Validator<UserJSON> },
  async handler(ctx, { data }) {
    console.log("upsertFromClerk", data);
    const userAttributes = {
      clerkId: data.id,
      firstName: data.first_name || "",
      lastName: data.last_name || "",
      email: data.email_addresses[0].email_address,
      profilePicture: data.image_url,
    };

    const user = await ctx.db
      .query(TABLES.USERS)
      .withIndex(INDEXES.BY_CLERK_ID, (q) => q.eq("clerkId", data.id))
      .first();
    if (user === null) {
      await ctx.db.insert(TABLES.USERS, {
        ...userAttributes,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        onboardingCompleted: false,
        isMemoirPublic: false,
      });
    } else {
      await ctx.db.patch(user._id, {
        ...userAttributes,
        updatedAt: Date.now(),
      });
    }
  },
});

export const deleteFromClerk = internalMutation({
  args: { clerkUserId: v.string() },
  async handler(ctx, { clerkUserId }) {
    const user = await ctx.db
      .query(TABLES.USERS)
      .withIndex(INDEXES.BY_CLERK_ID, (q) => q.eq("clerkId", clerkUserId))
      .first();

    if (user) {
      await ctx.db.delete(user._id);
    }
  },
});

export const createUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const clerkUser = await ctx.auth.getUserIdentity();
    if (!clerkUser) {
      throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const existingUser = await ctx.db
      .query(TABLES.USERS)
      .withIndex(INDEXES.BY_CLERK_ID, (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existingUser) {
      return existingUser._id;
    }

    const userId = await ctx.db.insert(TABLES.USERS, {
      clerkId: args.clerkId,
      email: args.email,
      onboardingCompleted: false,
      isMemoirPublic: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return userId;
  },
});

export const updateOnboarding = mutation({
  args: {
    clerkId: v.string(),
    question1: v.optional(v.string()),
    question2: v.optional(v.string()),
    question3: v.optional(v.string()),
    question4: v.optional(v.string()),
    isMemoirPublic: v.optional(v.boolean()),
    onboardingCompleted: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query(TABLES.USERS)
      .withIndex(INDEXES.BY_CLERK_ID, (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const { clerkId, ...updateData } = args;

    await ctx.db.patch(user._id, {
      ...updateData,
      updatedAt: Date.now(),
    });

    return user._id;
  },
});

export const completeOnboarding = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query(TABLES.USERS)
      .withIndex(INDEXES.BY_CLERK_ID, (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    await ctx.db.patch(user._id, {
      onboardingCompleted: true,
      updatedAt: Date.now(),
    });

    return user._id;
  },
});

export const toggleMemoirPrivacy = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query(TABLES.USERS)
      .withIndex(INDEXES.BY_CLERK_ID, (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const newPrivacy = !user.isMemoirPublic;

    await ctx.db.patch(user._id, {
      isMemoirPublic: newPrivacy,
      updatedAt: Date.now(),
    });

    return { isMemoirPublic: newPrivacy };
  },
});
