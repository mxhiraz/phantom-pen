import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    profilePicture: v.optional(v.string()),
    onboardingCompleted: v.boolean(),
    isMemoirPublic: v.boolean(),
    question1: v.optional(v.string()), // Name, birthplace, birthdate
    question2: v.optional(v.string()), // Tell me about yourself
    question3: v.optional(v.string()), // Tell me about your loved ones
    question4: v.optional(v.string()), // Personal and professional interests
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_memoir_public", ["isMemoirPublic"]),

  whispers: defineTable({
    title: v.string(),
    userId: v.string(),
    createdAt: v.number(),
    updatedAt: v.optional(v.float64()),
    fullTranscription: v.string(),
    rawTranscription: v.optional(v.any()),
    public: v.optional(v.boolean()),
  })
    .index("by_user", ["userId"])
    .index("by_created_at", ["createdAt"])
    .index("by_public", ["public"])
    .searchIndex("search_content", {
      searchField: "fullTranscription",
      filterFields: ["userId"],
    })
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["userId"],
    }),

  memoirs: defineTable({
    userId: v.string(),
    whisperId: v.id("whispers"),
    date: v.string(),
    title: v.string(),
    content: v.string(),
    public: v.optional(v.boolean()),
    llmGeneratedAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_whisper", ["whisperId"])
    .index("by_date", ["date"])
    .index("by_public", ["public"])
    .index("by_user_date", ["userId", "date"]),

  scheduledMemoirGeneration: defineTable({
    userId: v.string(),
    whisperId: v.id("whispers"),
    scheduledAt: v.number(),
    status: v.union(
      v.literal("active"),
      v.literal("failed"),
      v.literal("processing")
    ),
    errorMessage: v.optional(v.string()),
    scheduledFunctionId: v.optional(v.id("_scheduled_functions")),
    createdAt: v.number(),
  })
    .index("by_whisper", ["whisperId"])
    .index("by_status", ["status"])
    .index("by_user", ["userId"]),

  voiceUploads: defineTable({
    userId: v.string(),
    status: v.union(v.literal("completed"), v.literal("failed")),
    fileUrl: v.string(),
    createdAt: v.number(),
    whisperId: v.id("whispers"),
    updatedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_created_at", ["createdAt"]),
});
