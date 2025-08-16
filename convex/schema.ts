import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkUserId: v.string(),
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_user_id", ["clerkUserId"])
    .index("by_created_at", ["createdAt"]),

  whispers: defineTable({
    title: v.string(),
    userId: v.string(),
    createdAt: v.number(),
    updatedAt: v.optional(v.float64()),
    fullTranscription: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_created_at", ["createdAt"]),

  transformations: defineTable({
    whisperId: v.id("whispers"),
    isGenerating: v.boolean(),
    typeName: v.string(),
    text: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_whisper", ["whisperId"])
    .index("by_created_at", ["createdAt"]),

  audioTracks: defineTable({
    fileUrl: v.string(),
    partialTranscription: v.string(),
    whisperId: v.id("whispers"),
    language: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_whisper", ["whisperId"])
    .index("by_created_at", ["createdAt"]),
});
