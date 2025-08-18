import { v } from "convex/values";
import { action, mutation } from "./_generated/server";
import { api } from "./_generated/api";
import { Groq } from "groq-sdk";

const groq = new Groq();

export const transcribeFromStorage = action({
  args: {
    storageId: v.id("_storage"),
    whisperId: v.optional(v.id("whispers")),
  },
  handler: async (ctx, args): Promise<{ id: any; storageId: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const userId = identity.subject;

    const fileUrl = await ctx.storage.getUrl(args.storageId);
    if (!fileUrl) {
      throw new Error("Failed to get file URL from storage");
    }

    try {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) {
        throw new Error("GROQ_API_KEY not configured");
      }

      const audioResponse = await fetch(fileUrl);
      if (!audioResponse.ok) {
        throw new Error("Failed to fetch audio file");
      }

      const audioBuffer = await audioResponse.arrayBuffer();
      const audioBlob = new Blob([audioBuffer]);

      const audioFile = new File([audioBlob], "audio.webm", {
        type: "audio/webm",
      });

      const transcriptionResponse = await groq.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-large-v3-turbo",
        response_format: "verbose_json",
      });
      // console.log("Transcription:", transcription);
      // const transcriptionResponse = await fetch(
      //   "https://api.groq.com/openai/v1/audio/transcriptions",
      //   {
      //     method: "POST",
      //     headers: {
      //       Authorization: `Bearer ${apiKey}`,
      //       "Content-Type": "multipart/form-data",
      //     },
      //     body: (() => {
      //       const formData = new FormData();
      //       formData.append("file", audioBlob, "audio.webm");
      //       formData.append("model", "whisper-large-v3-turbo");
      //       formData.append("response_format", "verbose_json");
      //       return formData;
      //     })(),
      //   }
      // );

      const transcription = transcriptionResponse.text;

      if (args.whisperId) {
        const existingWhisper = await ctx.runQuery(
          api.whispers.getWhisperWithTracks,
          {
            id: args.whisperId,
          }
        );

        if (!existingWhisper) {
          throw new Error("Whisper not found");
        }

        if (existingWhisper.userId !== userId) {
          throw new Error("Unauthorized");
        }

        const updatedTranscription =
          existingWhisper.fullTranscription.trim() +
          "\n\n" +
          transcription.trim();

        await ctx.runMutation(api.whispers.updateFullTranscription, {
          id: args.whisperId,
          fullTranscription: updatedTranscription.trim(),
        });

        return { id: args.whisperId, storageId: args.storageId };
      } else {
        let title = "Untitled";

        try {
          const titleResponse = await groq.chat.completions.create({
            messages: [
              {
                role: "user",
                content: `<prompt>
  <instruction>
    You are a title generator. Respond ONLY with the title—no explanations, no quotes, no additional text.
  </instruction>
  <task>
    Generate a short, descriptive title (max 50 characters) for the transcription below. Do not include any special characters.
  </task>
  <examples>
    <example>{ "title": "Productive Day Self-Help Session" }</example>
  </examples>
   <format>
    Return ONLY a JSON object like: { "title": "Your generated title" }
  </format>
  <transcription><![CDATA[${transcription.slice(0, 500)}...]]></transcription>
</prompt>
`,
              },
            ],
            model: "openai/gpt-oss-120b",
            response_format: {
              type: "json_object",
            },
          });

          console.log("Title response:", titleResponse);

          const titleResult = titleResponse.choices[0].message?.content;
          const parsedTitle = JSON.parse(titleResult || "{}");

          title = parsedTitle.title || "Untitled";
        } catch (titleError) {
          console.error("Title generation failed, using default:", titleError);
        }

        const whisperResult = await ctx.runMutation(
          api.whispers.createWhisper,
          {
            title: title,
            fullTranscription: transcription,
            audioUrl: fileUrl,
          }
        );

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
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.whisperId, {
      fullTranscription: args.transcription.trim(),
      title: args.title,
    });

    return { success: true };
  },
});
