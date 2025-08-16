import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const autoUpdate = (data: any) => ({
  ...data,
  updatedAt: Date.now(),
});

export const listWhispers = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    console.log("identity", identity);
    const whispers = await ctx.db
      .query("whispers")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();

    console.log("whispers", whispers);
    return whispers.map((w) => ({
      id: w._id,
      title: w.title,
      content: w.fullTranscription,
      preview:
        w.fullTranscription.length > 80
          ? w.fullTranscription.slice(0, 80) + "..."
          : w.fullTranscription,
      timestamp: new Date(w.createdAt).toISOString(),
    }));
  },
});

export const searchWhispers = query({
  args: { searchQuery: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    if (!args.searchQuery.trim()) {
      // If no search query, return all whispers
      const whispers = await ctx.db
        .query("whispers")
        .withIndex("by_user", (q) => q.eq("userId", identity.subject))
        .order("desc")
        .collect();

      return whispers.map((w) => ({
        id: w._id,
        title: w.title,
        content: w.fullTranscription,
        preview:
          w.fullTranscription.length > 80
            ? w.fullTranscription.slice(0, 80) + "..."
            : w.fullTranscription,
        timestamp: new Date(w.createdAt).toISOString(),
      }));
    }

    // Search in title and content
    const allWhispers = await ctx.db
      .query("whispers")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    const searchLower = args.searchQuery.toLowerCase();
    const filteredWhispers = allWhispers.filter(
      (w) =>
        w.title.toLowerCase().includes(searchLower) ||
        w.fullTranscription.toLowerCase().includes(searchLower)
    );

    return filteredWhispers.map((w) => ({
      id: w._id,
      title: w.title,
      content: w.fullTranscription,
      preview:
        w.fullTranscription.length > 80
          ? w.fullTranscription.slice(0, 80) + "..."
          : w.fullTranscription,
      timestamp: new Date(w.createdAt).toISOString(),
    }));
  },
});

export const getWhisperWithTracks = query({
  args: { id: v.id("whispers") },
  handler: async (ctx, args) => {
    const whisper = await ctx.db.get(args.id);
    if (!whisper) throw new Error("Whisper not found");

    const audioTracks = await ctx.db
      .query("audioTracks")
      .withIndex("by_whisper", (q) => q.eq("whisperId", args.id))
      .order("asc")
      .collect();

    const transformations = await ctx.db
      .query("transformations")
      .withIndex("by_whisper", (q) => q.eq("whisperId", args.id))
      .order("asc")
      .collect();

    return {
      ...whisper,
      audioTracks,
      transformations,
    };
  },
});

export const createWhisper = mutation({
  args: {
    title: v.string(),
    fullTranscription: v.string(),
    audioUrl: v.string(),
    language: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const whisperId = await ctx.db.insert("whispers", {
      title: args.title,
      userId: identity.subject,
      createdAt: Date.now(),
      ...autoUpdate({}),
      fullTranscription: args.fullTranscription,
    });

    await ctx.db.insert("audioTracks", {
      fileUrl: args.audioUrl,
      partialTranscription: args.fullTranscription,
      whisperId,
      language: args.language,
      createdAt: Date.now(),
    });

    return { id: whisperId };
  },
});

export const createBlankNote = mutation({
  args: {
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const whisperId = await ctx.db.insert("whispers", {
      title: args.title,
      userId: identity.subject,
      createdAt: Date.now(),
      ...autoUpdate({}),
      fullTranscription: "Click to start writing...",
    });

    return { id: whisperId };
  },
});

export const addAudioTrack = mutation({
  args: {
    whisperId: v.id("whispers"),
    audioUrl: v.string(),
    partialTranscription: v.string(),
    language: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const whisper = await ctx.db.get(args.whisperId);
    if (!whisper) throw new Error("Whisper not found");

    await ctx.db.insert("audioTracks", {
      fileUrl: args.audioUrl,
      partialTranscription: args.partialTranscription,
      whisperId: args.whisperId,
      language: args.language,
      createdAt: Date.now(),
    });

    const updatedTranscription =
      whisper.fullTranscription + "\n" + args.partialTranscription;

    await ctx.db.patch(args.whisperId, {
      fullTranscription: updatedTranscription,
      ...autoUpdate({}),
    });

    return { id: args.whisperId };
  },
});

export const updateFullTranscription = mutation({
  args: {
    id: v.id("whispers"),
    fullTranscription: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const whisper = await ctx.db.get(args.id);
    if (!whisper) throw new Error("Whisper not found");
    if (whisper.userId !== identity.subject) throw new Error("Unauthorized");

    await ctx.db.patch(args.id, {
      fullTranscription: args.fullTranscription,
      ...autoUpdate({}),
    });

    return { id: args.id, fullTranscription: args.fullTranscription };
  },
});

export const updateTitle = mutation({
  args: {
    id: v.id("whispers"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const whisper = await ctx.db.get(args.id);
    if (!whisper) throw new Error("Whisper not found");
    if (whisper.userId !== identity.subject) throw new Error("Unauthorized");

    await ctx.db.patch(args.id, {
      title: args.title,
      ...autoUpdate({}),
    });

    return { id: args.id, title: args.title };
  },
});

export const deleteWhisper = mutation({
  args: {
    id: v.id("whispers"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const whisper = await ctx.db.get(args.id);
    if (!whisper) throw new Error("Whisper not found");
    if (whisper.userId !== identity.subject) throw new Error("Unauthorized");

    // Delete all related Transformations first
    const transformations = await ctx.db
      .query("transformations")
      .withIndex("by_whisper", (q) => q.eq("whisperId", args.id))
      .collect();

    for (const transformation of transformations) {
      await ctx.db.delete(transformation._id);
    }

    // Delete all related AudioTracks
    const audioTracks = await ctx.db
      .query("audioTracks")
      .withIndex("by_whisper", (q) => q.eq("whisperId", args.id))
      .collect();

    for (const audioTrack of audioTracks) {
      await ctx.db.delete(audioTrack._id);
    }

    // Now delete the Whisper
    await ctx.db.delete(args.id);

    return { id: args.id };
  },
});
