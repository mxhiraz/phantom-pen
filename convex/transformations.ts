import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createTransformation = mutation({
  args: {
    whisperId: v.id("whispers"),
    typeName: v.string(),
    text: v.string(),
    isGenerating: v.boolean(),
  },
  handler: async (ctx, args) => {
    const transformationId = await ctx.db.insert("transformations", {
      whisperId: args.whisperId,
      typeName: args.typeName,
      text: args.text,
      isGenerating: args.isGenerating,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return transformationId;
  },
});

export const updateTransformation = mutation({
  args: {
    id: v.id("transformations"),
    text: v.string(),
    isGenerating: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      text: args.text,
      isGenerating: args.isGenerating,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const getTransformationsByWhisper = query({
  args: { whisperId: v.id("whispers") },
  handler: async (ctx, args) => {
    const transformations = await ctx.db
      .query("transformations")
      .withIndex("by_whisper", (q) => q.eq("whisperId", args.whisperId))
      .order("asc")
      .collect();

    return transformations;
  },
});
