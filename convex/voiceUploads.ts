import { v } from "convex/values";
import { mutation } from "./functions";
import { query } from "./_generated/server";

export const createVoiceUpload = mutation({
  args: {
    fileUrl: v.string(),
    whisperId: v.id("whispers"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const voiceUploadId = await ctx.db.insert("voiceUploads", {
      userId: identity.subject,
      status: "completed",
      fileUrl: args.fileUrl,
      createdAt: Date.now(),
      whisperId: args.whisperId,
    });
    return voiceUploadId;
  },
});

export const updateVoiceUploadFailed = mutation({
  args: {
    id: v.id("voiceUploads"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "failed",
      updatedAt: Date.now(),
    });
  },
});

export const getVoiceUploads = query({
  args: {
    status: v.optional(v.union(v.literal("completed"), v.literal("failed"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    if (args.status) {
      return await ctx.db
        .query("voiceUploads")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect();
    } else {
      return await ctx.db
        .query("voiceUploads")
        .withIndex("by_user", (q) => q.eq("userId", identity.subject))
        .order("desc")
        .collect();
    }
  },
});
