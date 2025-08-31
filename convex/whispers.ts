import { v } from "convex/values";
import { mutation, internalMutation } from "./functions";
import { internal } from "./_generated/api";
import { stripMarkdown } from "../lib/utils";
import { Id } from "./_generated/dataModel";
import {
  MEMOIR_GENERATION_DELAY,
  TABLES,
  INDEXES,
  ERROR_MESSAGES,
  STATUS,
} from "../lib/constants";
import { query } from "./_generated/server";
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
    if (!identity) throw new Error(ERROR_MESSAGES.NOT_AUTHENTICATED);

    const whispers = await ctx.db
      .query(TABLES.WHISPERS)
      .withIndex(INDEXES.BY_USER, (q) => q.eq("userId", identity.subject))
      .order("desc")
      .take(args.limit ?? 100);

    return whispers.map((w) => ({
      id: w._id,
      title: w.title,
      preview: stripMarkdown(w.fullTranscription),
      timestamp: w.updatedAt ?? w.createdAt,
      createdAt: w._creationTime,
      public: w.public ?? false,
    }));
  },
});

export const searchWhispers = query({
  args: { searchQuery: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error(ERROR_MESSAGES.NOT_AUTHENTICATED);

    if (!args.searchQuery.trim()) {
      // If no search query, return all whispers
      const whispers = await ctx.db
        .query(TABLES.WHISPERS)
        .withIndex(INDEXES.BY_USER, (q) => q.eq("userId", identity.subject))
        .order("desc")
        .collect();

      return whispers.map((w) => ({
        id: w._id,
        title: w.title,
        preview: stripMarkdown(w.fullTranscription),
        timestamp: w.updatedAt ?? w.createdAt,
        createdAt: w.createdAt,
        public: w.public ?? false,
      }));
    }

    // Use search indexes for server-side search
    const searchResults = await ctx.db
      .query(TABLES.WHISPERS)
      .withSearchIndex("search_content", (q) =>
        q
          .search("fullTranscription", args.searchQuery)
          .eq("userId", identity.subject)
      )
      .collect();

    // Also search in titles
    const titleSearchResults = await ctx.db
      .query(TABLES.WHISPERS)
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
      preview: stripMarkdown(w.fullTranscription),
      timestamp: w.updatedAt ?? w.createdAt,
      createdAt: w.createdAt,
      public: w.public ?? false,
    }));
  },
});

export const getWhisper = query({
  args: { id: v.id("whispers") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error(ERROR_MESSAGES.NOT_AUTHENTICATED);
    }

    const whisper = await ctx.db
      .query(TABLES.WHISPERS)
      .withIndex("by_id", (q) => q.eq("_id", args.id))
      .first();

    if (!whisper) {
      return null;
    }

    if (whisper.userId !== identity.subject) {
      throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
    }

    return whisper;
  },
});

export const getPublicWhisper = query({
  args: { id: v.id("whispers") },
  handler: async (ctx, args) => {
    const whisper = await ctx.db
      .query(TABLES.WHISPERS)
      .withIndex("by_id", (q) => q.eq("_id", args.id))
      .first();

    if (!whisper) {
      return null;
    }

    if (!whisper.public) {
      return null;
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
    if (!identity) throw new Error(ERROR_MESSAGES.NOT_AUTHENTICATED);

    const whisperId = await ctx.db.insert(TABLES.WHISPERS, {
      title: args.title,
      userId: identity.subject,
      createdAt: Date.now(),
      ...autoUpdate({}),
      fullTranscription: args.fullTranscription,
      rawTranscription: args.rawTranscription,
      public: true,
    });

    try {
      await ctx.runMutation(
        internal.whispers.scheduleMemoirGenerationInternal,
        {
          whisperId: whisperId,
          userId: identity.subject,
        }
      );
    } catch (error) {
      console.error(ERROR_MESSAGES.FAILED_TO_SCHEDULE, error);
    }

    return { id: whisperId };
  },
});

export const createBlankNote = mutation({
  args: {
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error(ERROR_MESSAGES.NOT_AUTHENTICATED);

    const whisperId = await ctx.db.insert(TABLES.WHISPERS, {
      title: args.title,
      userId: identity.subject,
      createdAt: Date.now(),
      ...autoUpdate({}),
      fullTranscription: "Click to start writing...",
      public: true,
    });

    return { id: whisperId };
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
    if (!identity) throw new Error(ERROR_MESSAGES.NOT_AUTHENTICATED);

    const whisper = await ctx.db.get(args.id);
    if (!whisper) throw new Error(ERROR_MESSAGES.WHISPER_NOT_FOUND);
    if (whisper.userId !== identity.subject)
      throw new Error(ERROR_MESSAGES.UNAUTHORIZED);

    await ctx.db.patch(args.id, {
      fullTranscription: args.fullTranscription,
      rawTranscription: args.rawTranscription,
      ...autoUpdate({}),
    });

    try {
      await ctx.runMutation(
        internal.whispers.scheduleMemoirGenerationInternal,
        {
          whisperId: args.id,
          userId: identity.subject,
        }
      );
    } catch (error) {
      console.error(ERROR_MESSAGES.FAILED_TO_SCHEDULE, error);
    }

    return { id: args.id, fullTranscription: args.fullTranscription };
  },
});

export const scheduleMemoirGenerationInternal = internalMutation({
  args: {
    whisperId: v.id("whispers"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const existingSchedules = await ctx.db
      .query(TABLES.SCHEDULED_MEMOIR_GENERATION)
      .withIndex(INDEXES.BY_WHISPER, (q) => q.eq("whisperId", args.whisperId))
      .collect();

    for (const schedule of existingSchedules) {
      if (schedule.scheduledFunctionId) {
        await ctx.scheduler.cancel(schedule.scheduledFunctionId);
      }
      await ctx.db.delete(schedule._id);
    }

    // Schedule the memoir generation
    const scheduledFunctionId: Id<"_scheduled_functions"> =
      await ctx.scheduler.runAfter(
        MEMOIR_GENERATION_DELAY,
        internal.memoirs.generateMemoirContentAndUpdate,
        {
          userId: args.userId,
          whisperId: args.whisperId,
        }
      );

    await ctx.db.insert(TABLES.SCHEDULED_MEMOIR_GENERATION, {
      userId: args.userId,
      whisperId: args.whisperId,
      scheduledAt: Date.now() + MEMOIR_GENERATION_DELAY,
      status: STATUS.ACTIVE,
      scheduledFunctionId,
      createdAt: Date.now(),
    });

    console.log(
      `[scheduleMemoirGenerationInternal] ✅ Scheduled memoir generation for whisper: ${
        args.whisperId
      } in ${MEMOIR_GENERATION_DELAY / 1000}s`
    );
  },
});

export const updateTitle = mutation({
  args: {
    id: v.id("whispers"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error(ERROR_MESSAGES.NOT_AUTHENTICATED);

    const whisper = await ctx.db.get(args.id);
    if (!whisper) throw new Error(ERROR_MESSAGES.WHISPER_NOT_FOUND);
    if (whisper.userId !== identity.subject)
      throw new Error(ERROR_MESSAGES.UNAUTHORIZED);

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
    if (!identity) throw new Error(ERROR_MESSAGES.NOT_AUTHENTICATED);

    const whisper = await ctx.db.get(args.id);
    if (!whisper) throw new Error(ERROR_MESSAGES.WHISPER_NOT_FOUND);
    if (whisper.userId !== identity.subject)
      throw new Error(ERROR_MESSAGES.UNAUTHORIZED);

    await ctx.db.delete(args.id);

    return { id: args.id };
  },
});

export const togglePrivacy = mutation({
  args: {
    id: v.id("whispers"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error(ERROR_MESSAGES.NOT_AUTHENTICATED);

    const whisper = await ctx.db.get(args.id);
    if (!whisper) throw new Error(ERROR_MESSAGES.WHISPER_NOT_FOUND);
    if (whisper.userId !== identity.subject)
      throw new Error(ERROR_MESSAGES.UNAUTHORIZED);

    const currentPublic = whisper.public ?? false;
    const newPublic = !currentPublic;

    await ctx.db.patch(args.id, {
      public: newPublic,
      ...autoUpdate({}),
    });

    return { id: args.id, public: newPublic };
  },
});
