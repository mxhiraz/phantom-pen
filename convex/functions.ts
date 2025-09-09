import {
  mutation as rawMutation,
  internalMutation as rawInternalMutation,
} from "./_generated/server";
import { DataModel } from "./_generated/dataModel";
import { Triggers } from "convex-helpers/server/triggers";
import {
  customCtx,
  customMutation,
} from "convex-helpers/server/customFunctions";

const triggers = new Triggers<DataModel>();

triggers.register("users", async (ctx, change) => {
  if (change.operation === "delete") {
    for await (const scheduledGeneration of ctx.db
      .query("whispers")
      .withIndex("by_user", (q) => q.eq("userId", change.id))) {
      await ctx.db.delete(scheduledGeneration._id);
    }

    for await (const voiceUpload of ctx.db
      .query("voiceUploads")
      .withIndex("by_user", (q) => q.eq("userId", change.id))) {
      await ctx.db.delete(voiceUpload._id);
    }
  }
});

triggers.register("whispers", async (ctx, change) => {
  if (change.operation === "delete") {
    for await (const scheduledGeneration of ctx.db
      .query("scheduledMemoirGeneration")
      .withIndex("by_whisper", (q) => q.eq("whisperId", change.id))) {
      await ctx.db.delete(scheduledGeneration._id);
    }

    for await (const memoir of ctx.db
      .query("memoirs")
      .withIndex("by_whisper", (q) => q.eq("whisperId", change.id))) {
      await ctx.db.delete(memoir._id);
    }
  }
  if (change.operation === "update") {
    if (change.oldDoc.public !== change.newDoc.public) {
      for await (const memoir of ctx.db
        .query("memoirs")
        .withIndex("by_whisper", (q) => q.eq("whisperId", change.id))) {
        await ctx.db.patch(memoir._id, {
          public: change.newDoc.public,
        });
      }
    }
  }
});

export const mutation = customMutation(rawMutation, customCtx(triggers.wrapDB));
export const internalMutation = customMutation(
  rawInternalMutation,
  customCtx(triggers.wrapDB)
);
