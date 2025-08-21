import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  whispers: defineTable({
    title: v.string(),
    userId: v.string(),
    createdAt: v.number(),
    updatedAt: v.optional(v.float64()),
    fullTranscription: v.string(),
    rawTranscription: v.optional(v.any()),
  })
    .index("by_user", ["userId"])
    .index("by_created_at", ["createdAt"])
    .searchIndex("search_content", {
      searchField: "fullTranscription",
      filterFields: ["userId"],
    })
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["userId"],
    }),

  voiceUploads: defineTable({
    userId: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    fileUrl: v.string(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_created_at", ["createdAt"]),
});
