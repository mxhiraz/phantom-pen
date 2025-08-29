import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { Groq } from "groq-sdk";

const groq = new Groq();

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const getFileUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const getFileUrlAction = action({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const deleteFile = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    await ctx.storage.delete(args.storageId);
  },
});

export const analyzeImageAndGenerateName = action({
  args: {
    base64Image: v.string(),
    originalFileName: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const prompt = `Analyze this image and generate a descriptive, meaningful filename (without extension) that best represents the content. 
      
      The filename should be:
      - Descriptive and relevant to the image content
      - 3-8 words maximum
      - No special characters
      - Professional and appropriate
      
      Original filename: ${args.originalFileName}
      
      Return only the filename, nothing else.`;

      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt,
              },
              {
                type: "image_url",
                image_url: {
                  url: args.base64Image,
                },
              },
            ],
          },
        ],
        model: "meta-llama/llama-4-maverick-17b-128e-instruct",
        temperature: 0,
        max_tokens: 50,
      });

      const generatedName = chatCompletion.choices[0]?.message?.content?.trim();

      if (!generatedName) {
        throw new Error("Failed to generate name from AI");
      }

      // Clean the generated name to ensure it's safe for filenames
      const cleanName = generatedName
        .replace(/[^a-zA-Z0-9\s\-_]/g, "") // Remove special characters
        .replace(/\s+/g, "-") // Replace spaces with hyphens
        .toLowerCase()
        .trim();

      return cleanName || args.originalFileName.replace(/\.[^/.]+$/, "");
    } catch (error) {
      console.error("Error analyzing image:", error);
      // Fallback to original filename without extension
      return args.originalFileName.replace(/\.[^/.]+$/, "");
    }
  },
});
