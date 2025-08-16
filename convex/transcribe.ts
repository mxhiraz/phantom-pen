import { v } from "convex/values";
import { action, mutation } from "./_generated/server";
import { api } from "./_generated/api";

export const transcribeFromStorage = action({
  args: {
    storageId: v.id("_storage"),
    whisperId: v.optional(v.id("whispers")),
    language: v.optional(v.string()),
    durationSeconds: v.number(),
  },
  handler: async (ctx, args): Promise<{ id: any; storageId: string }> => {
    // Get the user identity from auth context
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const userId = identity.subject;

    // Get the file URL from storage
    const fileUrl = await ctx.storage.getUrl(args.storageId);

    if (!fileUrl) {
      throw new Error("Failed to get file URL from storage");
    }

    try {
      // Call Groq for transcription using HTTP API (actions can use fetch)
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) {
        throw new Error("GROQ_API_KEY not configured");
      }

      // Fetch the audio file from storage
      const audioResponse = await fetch(fileUrl);
      if (!audioResponse.ok) {
        throw new Error("Failed to fetch audio file");
      }

      const audioBuffer = await audioResponse.arrayBuffer();
      const audioBlob = new Blob([audioBuffer]);

      // Call Groq Whisper API for transcription
      const transcriptionResponse = await fetch(
        "https://api.groq.com/openai/v1/audio/transcriptions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "multipart/form-data",
          },
          body: (() => {
            const formData = new FormData();
            formData.append("file", audioBlob, "audio.webm");
            formData.append("model", "whisper-large-v3-turbo");
            formData.append("response_format", "verbose_json");
            return formData;
          })(),
        }
      );

      if (!transcriptionResponse.ok) {
        const errorText = await transcriptionResponse.text();
        console.error("Groq transcription error:", errorText);
        throw new Error(
          `Groq transcription failed: ${transcriptionResponse.status}`
        );
      }

      const transcriptionResult = await transcriptionResponse.json();
      const transcription = transcriptionResult.text;

      if (args.whisperId) {
        // Add to existing whisper - NO title generation needed
        const existingWhisper = await ctx.runQuery(
          api.whispers.getWhisperWithTracks,
          {
            id: args.whisperId,
          }
        );

        if (!existingWhisper) {
          throw new Error("Whisper not found");
        }

        // Verify ownership
        if (existingWhisper.userId !== userId) {
          throw new Error("Unauthorized");
        }

        // Append new transcription to existing content
        const updatedTranscription =
          existingWhisper.fullTranscription.trim() +
          "\n" +
          transcription.trim();

        // Update existing whisper with appended content
        await ctx.runMutation(api.whispers.updateFullTranscription, {
          id: args.whisperId,
          fullTranscription: updatedTranscription.trim(),
        });

        // Add audio track
        await ctx.runMutation(api.whispers.addAudioTrack, {
          whisperId: args.whisperId,
          audioUrl: fileUrl,
          partialTranscription: transcription.trim(),
        });

        return { id: args.whisperId, storageId: args.storageId };
      } else {
        // Create new whisper - Generate AI title
        let title = "Untitled";

        try {
          // Generate title from transcription using Groq Chat API
          const titleResponse = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                messages: [
                  {
                    role: "user",
                    content: `Generate a short, descriptive title (max 50 characters) for this transcription. IMPORTANT: Do NOT include any commas in the title. Use spaces, dashes, or colons instead. Examples: "Productive Day Self-Help Session" or "Morning Routine - Wellness Tips" or "Work Meeting: Project Updates": "${transcription.slice(
                      0,
                      500
                    )}..."`,
                  },
                ],
                model: "llama3-8b-8192",
                max_tokens: 50,
                temperature: 0.7,
              }),
            }
          );

          if (titleResponse.ok) {
            const titleResult = await titleResponse.json();
            if (titleResult.choices && titleResult.choices[0]) {
              title =
                titleResult.choices[0].message?.content
                  ?.trim()
                  .replace(/,/g, "") || "Untitled";
            }
          }
        } catch (titleError) {
          console.error("Title generation failed, using default:", titleError);
          // If title generation fails, just use "Untitled"
        }

        // Create new whisper
        const whisperResult = await ctx.runMutation(
          api.whispers.createWhisper,
          {
            title: title.slice(0, 80),
            fullTranscription: transcription,
            audioUrl: fileUrl,
          }
        );

        await ctx.runMutation(api.whispers.addAudioTrack, {
          whisperId: whisperResult.id,
          audioUrl: fileUrl,
          partialTranscription: transcription,
        });

        return { id: whisperResult.id, storageId: args.storageId };
      }
    } catch (error) {
      console.error("Transcription error:", error);
      throw new Error("Failed to transcribe audio");
    }
  },
});

export const updateTranscription = mutation({
  args: {
    whisperId: v.id("whispers"),
    transcription: v.string(),
    title: v.string(),
    audioTrackId: v.id("audioTracks"),
  },
  handler: async (ctx, args) => {
    // Update the audio track with transcription
    await ctx.db.patch(args.audioTrackId, {
      partialTranscription: args.transcription.trim(),
    });

    // Update the whisper with transcription and title
    await ctx.db.patch(args.whisperId, {
      fullTranscription: args.transcription.trim(),
      title: args.title,
    });

    return { success: true };
  },
});
