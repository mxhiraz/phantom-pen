import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { groq } from "../lib/llm";
import { parseMarkdownToBlocks } from "../lib/utils";
import dedent from "dedent";
import { LANGUAGES } from "../lib/constants";

export const transcribeFromStorage = action({
  args: {
    storageId: v.id("_storage"),
    whisperId: v.optional(v.id("whispers")),
    language: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ id: any; storageId: string; voiceUploadId: any }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;

    let voiceUploadId = null;

    const fileUrl = await ctx.storage.getUrl(args.storageId);
    if (!fileUrl) {
      console.error(
        `[TRANSCRIBE] Failed to get file URL for storageId: ${args.storageId}`
      );
      throw new Error("Failed to get file URL from storage");
    }

    try {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) {
        throw new Error("GROQ_API_KEY not configured");
      }

      const audioResponse = await fetch(fileUrl);
      if (!audioResponse.ok) {
        console.error(
          `[TRANSCRIBE] Failed to fetch audio file: ${audioResponse.status} ${audioResponse.statusText}`
        );
        throw new Error("Failed to fetch audio file");
      }

      const audioBuffer = await audioResponse.arrayBuffer();
      const audioBlob = new Blob([audioBuffer]);
      const audioFile = new File([audioBlob], "audio.webm", {
        type: "audio/webm",
      });

      const transcriptionResponse = await groq.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-large-v3",
        ...(args.language && { language: args.language }),
      });

      console.log("[TRANSCRIBE] transcriptionResponse", transcriptionResponse);
      let markdown = null;
      try {
        const markdownResponse = await groq.chat.completions.create({
          messages: [
            {
              role: "user",
              content: dedent`<prompt>
  <instruction>
    You are a markdown generator. Your responsibility is to convert raw text to beautiful markdown without modifying content.
  </instruction>
  <task>
   You have to Convert large raw transcription to markdown format. If the transcription is short, keep the same content as the transcription.
  </task>
  <examples>
   <rawTranscription>Hello, my name is Arshia.</rawTranscription>
    <example>{ "markdown": "Hello, my name is Arshia." }</example>
  </examples>
  <language>${LANGUAGES[args.language as keyof typeof LANGUAGES]}</language>
   <format>
    Return ONLY a JSON object like: { "markdown": "# Your generated title" }
  </format>
  <transcription><![CDATA[${transcriptionResponse.text.trim()})}...]]></transcription>
</prompt>
`,
            },
          ],
          temperature: 0,
          model: "openai/gpt-oss-120b",
          response_format: {
            type: "json_object",
          },
        });

        const result = markdownResponse.choices[0].message?.content;
        const data = JSON.parse(result || "{}");

        console.log(data);

        markdown = parseMarkdownToBlocks(data.markdown);
      } catch (error) {
        console.error(["groq error"], "can't get markdown", error);
      }
      const transcription = {
        text: transcriptionResponse.text.trim(),
        rawTranscription:
          markdown && markdown.length > 0
            ? [...markdown]
            : [
                {
                  type: "paragraph",
                  content: transcriptionResponse.text.trim(),
                },
              ],
      };

      if (args.whisperId) {
        const existingWhisper = await ctx.runQuery(api.whispers.getWhisper, {
          id: args.whisperId,
        });

        if (!existingWhisper) {
          throw new Error("Whisper not found");
        }

        if (existingWhisper.userId !== userId) {
          throw new Error("Unauthorized");
        }

        const updatedTranscription =
          existingWhisper.fullTranscription + "\n" + transcription.text;

        const updatedRawTranscription = existingWhisper.rawTranscription
          ? [
              ...existingWhisper.rawTranscription,
              ...transcription.rawTranscription,
            ]
          : transcription.rawTranscription;

        await ctx.runMutation(api.whispers.updateFullTranscription, {
          id: args.whisperId,
          fullTranscription: updatedTranscription,
          rawTranscription: updatedRawTranscription,
        });

        voiceUploadId = await ctx.runMutation(
          api.voiceUploads.createVoiceUpload,
          {
            fileUrl,
            whisperId: args.whisperId,
          }
        );

        return { id: args.whisperId, storageId: args.storageId, voiceUploadId };
      } else {
        let title = "Untitled";

        try {
          const titleResponse = await groq.chat.completions.create({
            messages: [
              {
                role: "user",
                content: dedent`<prompt>
  <instruction>
    You are a title generator. Respond ONLY with the title—no explanations, no quotes, no additional text.
  </instruction>
  <task>
    Generate a short, descriptive title (max 30 characters) for the transcription below. Do not include any special characters.
  </task>
  <language>${LANGUAGES[args.language as keyof typeof LANGUAGES]}</language>
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
            model: "openai/gpt-oss-20b",
            response_format: {
              type: "json_object",
            },
          });

          const titleResult = titleResponse.choices[0].message?.content;
          const parsedTitle = JSON.parse(titleResult || "{}");

          title = parsedTitle.title || "Untitled";
        } catch (titleError) {
          console.error(
            "[TRANSCRIBE] Title generation failed, using default:",
            titleError
          );
        }

        const whisperResult = await ctx.runMutation(
          api.whispers.createWhisper,
          {
            title: title,
            fullTranscription: transcription.text,
            rawTranscription: transcription.rawTranscription,
          }
        );

        voiceUploadId = await ctx.runMutation(
          api.voiceUploads.createVoiceUpload,
          {
            fileUrl,
            whisperId: whisperResult.id,
          }
        );

        return {
          id: whisperResult.id,
          storageId: args.storageId,
          voiceUploadId,
        };
      }
    } catch (error) {
      console.error(
        `[TRANSCRIBE] Transcription error for storageId ${args.storageId}:`,
        error
      );

      // Update voice upload status to failed
      if (voiceUploadId) {
        await ctx.runMutation(api.voiceUploads.updateVoiceUploadFailed, {
          id: voiceUploadId,
        });
      }

      throw new Error("Failed to transcribe audio");
    }
  },
});
