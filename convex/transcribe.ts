import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { groq } from "../lib/llm";

export const transcribeFromStorage = action({
  args: {
    storageId: v.id("_storage"),
    whisperId: v.optional(v.id("whispers")),
  },
  handler: async (ctx, args): Promise<{ id: any; storageId: string }> => {
    console.log(
      `[TRANSCRIBE] Starting transcription for storageId: ${
        args.storageId
      }, whisperId: ${args.whisperId || "new"}`
    );

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      console.error("[TRANSCRIBE] Authentication failed - no identity");
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;
    console.log(`[TRANSCRIBE] Authenticated user: ${userId}`);

    const fileUrl = await ctx.storage.getUrl(args.storageId);
    if (!fileUrl) {
      console.error(
        `[TRANSCRIBE] Failed to get file URL for storageId: ${args.storageId}`
      );
      throw new Error("Failed to get file URL from storage");
    }
    console.log(`[TRANSCRIBE] Retrieved file URL: ${fileUrl}`);

    try {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) {
        console.error("[TRANSCRIBE] GROQ_API_KEY not configured");
        throw new Error("GROQ_API_KEY not configured");
      }
      console.log("[TRANSCRIBE] GROQ API key configured successfully");

      console.log("[TRANSCRIBE] Fetching audio file...");
      const audioResponse = await fetch(fileUrl);
      if (!audioResponse.ok) {
        console.error(
          `[TRANSCRIBE] Failed to fetch audio file: ${audioResponse.status} ${audioResponse.statusText}`
        );
        throw new Error("Failed to fetch audio file");
      }
      console.log("[TRANSCRIBE] Audio file fetched successfully");

      const audioBuffer = await audioResponse.arrayBuffer();
      const audioBlob = new Blob([audioBuffer]);
      console.log(
        `[TRANSCRIBE] Audio buffer size: ${audioBuffer.byteLength} bytes`
      );

      const audioFile = new File([audioBlob], "audio.webm", {
        type: "audio/webm",
      });

      console.log("[TRANSCRIBE] Starting Groq transcription...");
      const transcriptionResponse = await groq.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-large-v3-turbo",
        response_format: "verbose_json",
      });
      console.log(
        `[TRANSCRIBE] Transcription completed. Text length: ${transcriptionResponse.text.length} characters`
      );

      const transcription = {
        text: transcriptionResponse.text.trim(),
        rawTranscription: [
          {
            type: "paragraph",
            content: transcriptionResponse.text.trim(),
          },
        ],
      };

      if (args.whisperId) {
        console.log(
          `[TRANSCRIBE] Updating existing whisper: ${args.whisperId}`
        );
        const existingWhisper = await ctx.runQuery(api.whispers.getWhisper, {
          id: args.whisperId,
        });

        if (!existingWhisper) {
          console.error(`[TRANSCRIBE] Whisper not found: ${args.whisperId}`);
          throw new Error("Whisper not found");
        }

        if (existingWhisper.userId !== userId) {
          console.error(
            `[TRANSCRIBE] Unauthorized access attempt. User: ${userId}, Whisper owner: ${existingWhisper.userId}`
          );
          throw new Error("Unauthorized");
        }

        const updatedTranscription =
          existingWhisper.fullTranscription + "\n" + transcription.text;

        // Append to rawTranscription instead of overwriting
        const updatedRawTranscription = existingWhisper.rawTranscription
          ? [
              ...existingWhisper.rawTranscription,
              ...transcription.rawTranscription,
            ]
          : transcription.rawTranscription;

        console.log(
          `[TRANSCRIBE] Updated rawTranscription length: ${updatedRawTranscription.length} items`
        );
        await ctx.runMutation(api.whispers.updateFullTranscription, {
          id: args.whisperId,
          fullTranscription: updatedTranscription,
          rawTranscription: updatedRawTranscription,
        });
        console.log(
          `[TRANSCRIBE] Whisper updated successfully: ${args.whisperId}`
        );

        // Delete file after successful transcription
        console.log(
          `[TRANSCRIBE] Deleting file from storage: ${args.storageId}`
        );
        await ctx.storage.delete(args.storageId);
        console.log(
          `[TRANSCRIBE] File deleted successfully: ${args.storageId}`
        );

        return { id: args.whisperId, storageId: args.storageId };
      } else {
        console.log("[TRANSCRIBE] Creating new whisper");
        let title = "Untitled";

        try {
          console.log("[TRANSCRIBE] Generating title for new whisper...");
          const titleResponse = await groq.chat.completions.create({
            messages: [
              {
                role: "user",
                content: `<prompt>
  <instruction>
    You are a title generator. Respond ONLY with the title—no explanations, no quotes, no additional text.
  </instruction>
  <task>
    Generate a short, descriptive title (max 30 characters) for the transcription below. Do not include any special characters.
  </task>
  <examples>
    <example>{ "title": "Productive Day" }</example>
  </examples>
   <format>
    Return ONLY a JSON object like: { "title": "Your generated title" }
  </format>
  <transcription><![CDATA[${transcription.text.slice(
    0,
    500
  )}...]]></transcription>
</prompt>
`,
              },
            ],
            temperature: 0,
            max_completion_tokens: 50,
            model: "openai/gpt-oss-120b",
            response_format: {
              type: "json_object",
            },
          });

          console.log(
            `[TRANSCRIBE] Title generation response: ${titleResponse.choices[0].message?.content}`
          );

          const titleResult = titleResponse.choices[0].message?.content;
          const parsedTitle = JSON.parse(titleResult || "{}");

          title = parsedTitle.title || "Untitled";
          console.log(`[TRANSCRIBE] Generated title: "${title}"`);
        } catch (titleError) {
          console.error(
            "[TRANSCRIBE] Title generation failed, using default:",
            titleError
          );
        }

        console.log("[TRANSCRIBE] Creating whisper in database...");
        const whisperResult = await ctx.runMutation(
          api.whispers.createWhisper,
          {
            title: title,
            fullTranscription: transcription.text,
            rawTranscription: transcription.rawTranscription,
          }
        );
        console.log(
          `[TRANSCRIBE] New whisper created successfully: ${whisperResult.id}`
        );

        // Delete file after successful transcription
        console.log(
          `[TRANSCRIBE] Deleting file from storage: ${args.storageId}`
        );
        await ctx.storage.delete(args.storageId);
        console.log(
          `[TRANSCRIBE] File deleted successfully: ${args.storageId}`
        );

        return { id: whisperResult.id, storageId: args.storageId };
      }
    } catch (error) {
      console.error(
        `[TRANSCRIBE] Transcription error for storageId ${args.storageId}:`,
        error
      );

      // Delete file on error as well
      try {
        console.log(
          `[TRANSCRIBE] Attempting to delete file on error: ${args.storageId}`
        );
        await ctx.storage.delete(args.storageId);
        console.log(
          `[TRANSCRIBE] File deleted successfully after error: ${args.storageId}`
        );
      } catch (deleteError) {
        console.error(
          `[TRANSCRIBE] Failed to delete file after error: ${args.storageId}`,
          deleteError
        );
      }

      throw new Error("Failed to transcribe audio");
    }
  },
});
