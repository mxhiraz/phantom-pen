import { v } from "convex/values";
import { query, internalAction, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { TABLES, INDEXES, ERROR_MESSAGES, STATUS } from "../lib/constants";
import { generateMemoirContent } from "../lib/llm";
import { Doc } from "./_generated/dataModel";

export const getUserMemoirs = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error(ERROR_MESSAGES.NOT_AUTHENTICATED);

    return await ctx.db
      .query(TABLES.MEMOIRS)
      .withIndex(INDEXES.BY_USER, (q) => q.eq("userId", identity.subject))
      .filter((q) =>
        q.and(
          q.neq(q.field("date"), "Error"),
          q.neq(q.field("title"), "Error"),
          q.neq(
            q.field("content"),
            "Failed to generate memoir content. Please try again."
          )
        )
      )
      .order("desc")
      .take(args?.limit ?? 100);
  },
});

export const getPublicMemoirs = query({
  args: { limit: v.optional(v.number()), clerkId: v.string() },
  handler: async (ctx, args): Promise<Doc<"memoirs">[] | string> => {
    const user = await ctx.runQuery(api.users.getUser, {
      clerkId: args.clerkId,
    });

    if (!user) throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);

    if (!user.isMemoirPublic) {
      return ERROR_MESSAGES.MEMOIRS_NOT_PUBLIC;
    }

    const memoirs = await ctx.db
      .query(TABLES.MEMOIRS)
      .withIndex(INDEXES.BY_USER, (q) => q.eq("userId", user.clerkId))
      .filter((q) =>
        q.and(
          q.neq(q.field("date"), "Error"),
          q.neq(q.field("title"), "Error"),
          q.neq(
            q.field("content"),
            "Failed to generate memoir content. Please try again."
          )
        )
      )
      .order("desc")
      .take(args?.limit ?? 100);

    return memoirs;
  },
});

export const generateMemoirContentAndUpdate = internalAction({
  args: {
    userId: v.string(),
    whisperId: v.id("whispers"),
  },
  handler: async (ctx, args) => {
    let scheduledGeneration: null | Doc<"scheduledMemoirGeneration"> = null;
    try {
      console.log(
        `[generateMemoirContentAndUpdate] 🤖 Processing memoir content for whisper: ${args.whisperId}`
      );

      // Find the scheduled memoir generation record for this whisper
      scheduledGeneration = await ctx.runQuery(
        api.memoirs.getScheduledGenerationByWhisper,
        { whisperId: args.whisperId }
      );

      if (scheduledGeneration) {
        // Mark as processing
        await ctx.runMutation(
          internal.memoirs.updateScheduledGenerationStatus,
          {
            scheduleId: scheduledGeneration._id,
            status: STATUS.PROCESSING,
          }
        );
      }

      // Get whisper content
      const whisper = await ctx.runQuery(api.memoirs.getWhisperInternal, {
        whisperId: args.whisperId,
      });

      if (!whisper || whisper.fullTranscription.trim().length === 0) {
        throw new Error(`Whisper not found or empty: ${args.whisperId}`);
      }

      // Get user preferences
      const user = await ctx.runQuery(api.users.getUser, {
        clerkId: args.userId,
      });

      if (!user) {
        throw new Error(`User not found: ${args.userId}`);
      }

      // Generate new memoir content using LLM
      const memoirEntries = await generateMemoirContent(
        whisper.fullTranscription,
        {
          voiceStyle: user.voiceStyle,
          writingStyle: user.writingStyle,
          candorLevel: user.candorLevel,
          humorStyle: user.humorStyle,
          feelingIntent: user.feelingIntent,
          opener: user.opener,
        }
      );

      console.log(
        `[generateMemoirContentAndUpdate] 💾 Creating ${memoirEntries.length} new memoir records...`
      );

      // Clean up existing memoirs for this whisper
      const existingMemoirs = await ctx.runQuery(
        api.memoirs.getMemoirsByWhisper,
        {
          whisperId: args.whisperId,
        }
      );

      for (const memoir of existingMemoirs) {
        await ctx.runMutation(internal.memoirs.deleteMemoir, {
          memoirId: memoir._id,
        });
      }

      console.log(
        `[generateMemoirContentAndUpdate] 🗑️ Cleaned up ${existingMemoirs.length} existing memoirs`
      );

      for (const entry of memoirEntries) {
        await ctx.runMutation(internal.memoirs.createMemoir, {
          userId: args.userId,
          whisperId: args.whisperId,
          date: entry.date,
          title: entry.title,
          content: entry.content,
        });
      }

      console.log(
        `[generateMemoirContentAndUpdate] ✅ Successfully completed memoir generation for whisper: ${args.whisperId}`
      );

      // Mark as completed successfully
      if (scheduledGeneration) {
        await ctx.runMutation(internal.memoirs.deleteScheduledGeneration, {
          scheduleId: scheduledGeneration._id,
        });
      }
    } catch (error) {
      console.error(
        `[generateMemoirContentAndUpdate] ❌ Error generating memoir content:`,
        error
      );

      if (scheduledGeneration) {
        await ctx.runMutation(
          internal.memoirs.updateScheduledGenerationStatus,
          {
            scheduleId: scheduledGeneration._id,
            status: STATUS.FAILED,
            errorMessage:
              error instanceof Error ? error.message : "Unknown error",
          }
        );
      }

      throw error;
    }
  },
});

export const deleteMemoir = internalMutation({
  args: { memoirId: v.id("memoirs") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.memoirId);
  },
});

// helpers
export const createMemoir = internalMutation({
  args: {
    userId: v.string(),
    whisperId: v.id("whispers"),
    date: v.string(),
    title: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const memoirId = await ctx.db.insert(TABLES.MEMOIRS, {
      userId: args.userId,
      whisperId: args.whisperId,
      date: args.date,
      title: args.title,
      content: args.content,
      llmGeneratedAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return memoirId;
  },
});

export const getMemoirsByWhisper = query({
  args: { whisperId: v.id("whispers") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query(TABLES.MEMOIRS)
      .withIndex(INDEXES.BY_WHISPER, (q) => q.eq("whisperId", args.whisperId))
      .collect();
  },
});

export const getScheduledGenerationByWhisper = query({
  args: { whisperId: v.id("whispers") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query(TABLES.SCHEDULED_MEMOIR_GENERATION)
      .withIndex(INDEXES.BY_WHISPER, (q) => q.eq("whisperId", args.whisperId))
      .filter((q) => q.eq(q.field("status"), STATUS.ACTIVE))
      .order("desc")
      .first();
  },
});

export const updateScheduledGenerationStatus = internalMutation({
  args: {
    scheduleId: v.id("scheduledMemoirGeneration"),
    status: v.union(
      v.literal("active"),
      v.literal("processing"),
      v.literal("failed")
    ),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updateData: any = { status: args.status };

    if (args.errorMessage) {
      updateData.errorMessage = args.errorMessage;
    }

    await ctx.db.patch(args.scheduleId, updateData);
  },
});

export const deleteScheduledGeneration = internalMutation({
  args: { scheduleId: v.id("scheduledMemoirGeneration") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.scheduleId);
  },
});

export const getWhisperInternal = query({
  args: { whisperId: v.id("whispers") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.whisperId);
  },
});
