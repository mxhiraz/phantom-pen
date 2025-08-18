import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { stripMarkdown } from "../lib/utils";
const autoUpdate = (data: any) => ({
  ...data,
  updatedAt: Date.now(),
});

export const listWhispers = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    console.log("identity", identity);
    const whispers = await ctx.db
      .query("whispers")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .take(args.limit ?? 100);

    return whispers.map((w) => ({
      id: w._id,
      title: w.title,
      content: w.fullTranscription,
      preview: stripMarkdown(w.fullTranscription),
      timestamp: w.updatedAt ?? w.createdAt,
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
        preview: stripMarkdown(w.fullTranscription),
        timestamp: w.updatedAt ?? w.createdAt,
      }));
    }

    // Use search indexes for server-side search
    const searchResults = await ctx.db
      .query("whispers")
      .withSearchIndex("search_content", (q) =>
        q
          .search("fullTranscription", args.searchQuery)
          .eq("userId", identity.subject)
      )
      .collect();

    // Also search in titles
    const titleSearchResults = await ctx.db
      .query("whispers")
      .withSearchIndex("search_title", (q) =>
        q.search("title", args.searchQuery).eq("userId", identity.subject)
      )
      .collect();

    // Combine and deduplicate results
    const allResults = [...searchResults, ...titleSearchResults];
    const uniqueResults = allResults.filter(
      (whisper, index, self) =>
        index === self.findIndex((w) => w._id === whisper._id)
    );

    return uniqueResults.map((w) => ({
      id: w._id,
      title: w.title,
      content: w.fullTranscription,
      preview: stripMarkdown(w.fullTranscription),
      timestamp: w.updatedAt ?? w.createdAt,
    }));
  },
});

export const getWhisper = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    console.log(`[getWhisper] Starting query for whisper ID: ${args.id}`);

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      console.log(
        `[getWhisper] Authentication failed for whisper ID: ${args.id}`
      );
      throw new Error("Not authenticated");
    }

    console.log(`[getWhisper] User authenticated: ${identity.subject}`);

    const whisper = await ctx.db
      .query("whispers")
      .withIndex("by_id", (q) => q.eq("_id", args.id as any))
      .first();

    if (!whisper) {
      console.log(`[getWhisper] Whisper not found for ID: ${args.id}`);
      return null;
    }

    if (whisper.userId !== identity.subject) {
      console.log(
        `[getWhisper] Unauthorized access attempt - User: ${identity.subject}, Whisper owner: ${whisper.userId}`
      );
      throw new Error("Unauthorized");
    }

    return whisper;
  },
});

export const createWhisper = mutation({
  args: {
    title: v.string(),
    fullTranscription: v.string(),
    rawTranscription: v.optional(v.any()),
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
      rawTranscription: args.rawTranscription,
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
    rawTranscription: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const whisper = await ctx.db.get(args.id);
    if (!whisper) throw new Error("Whisper not found");
    if (whisper.userId !== identity.subject) throw new Error("Unauthorized");

    await ctx.db.patch(args.id, {
      fullTranscription: args.fullTranscription,
      rawTranscription: args.rawTranscription,
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
