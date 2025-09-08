"server-only";
import { Groq } from "groq-sdk";
import { z } from "zod";
import dedent from "dedent";
import OpenAI from "openai";

export const openai = new OpenAI();
export const groq = new Groq();
import { analyzeImageWithVision } from "./tools/vision";

const MemoirEntrySchema = z.object({
  date: z.string(),
  title: z.string(),
  content: z.string(),
});

const MemoirResponseSchema = z.array(MemoirEntrySchema);

const UserPreferencesSchema = z.object({
  question1: z.string().optional(), // Name, birthplace, birthdate
  question2: z.string().optional(), // Tell me about yourself
  question3: z.string().optional(), // Tell me about your loved ones
  question4: z.string().optional(), // Personal and professional interests
});

export const generateMemoirContent = async (
  whisperContent: string,
  whisperTitle: string,
  userPreferences: z.infer<typeof UserPreferencesSchema>
): Promise<z.infer<typeof MemoirResponseSchema>> => {
  const prompt = dedent`
<instruction>
   You are a skilled personalized memoir writer. Follow the user's preferences and style guide strictly.
   
   You have access to a vision tool:
   - Use analyze_url(imageUrl) // Analyze any type of url to get a description
  
</instruction>

<task>
    1. You have to generate a memoir entry based on the user's preferences and style guide.
    2. If you find any type of link (URL) in the voice note, especially image links, you MUST use the analyze_url tool to analyze the image and include the description in your memoir content. This helps provide context and enriches the narrative.
</task>

<styleGuide>
${buildStyleGuide(userPreferences)}
</styleGuide>

${(() => {
  const validPreferences = [];
  if (userPreferences.question1 && userPreferences.question1.length > 10) {
    validPreferences.push(`User's background: ${userPreferences.question1}`);
  }
  if (userPreferences.question2 && userPreferences.question2.length > 10) {
    validPreferences.push(`User's personality: ${userPreferences.question2}`);
  }
  if (userPreferences.question3 && userPreferences.question3.length > 10) {
    validPreferences.push(`User's relationships: ${userPreferences.question3}`);
  }
  if (userPreferences.question4 && userPreferences.question4.length > 10) {
    validPreferences.push(`User's interests: ${userPreferences.question4}`);
  }

  return validPreferences.length > 0
    ? `<userPreferences>\n${validPreferences.join("\n")}\n</userPreferences>`
    : "";
})()}

<rules>
<rule>If voice note content is invalid or nonsensical, Return an Empty Array [].</rule>
<rule>Always Return an Array: Ensure the output is wrapped in [], even for one entry.</rule>
<rule>Generate the content based on the user's preferences and style guide.</rule>
<rule>When modifying a user's voice note, only rephrase or correct grammar without adding, removing, or inferring any new information beyond what was originally said.</rule>
<rule>Content field must not exceed 200 words.</rule>
<rule>Use proper punctuation, capitalization and time as "12:00 PM", "12:00 AM" or "12:00".</rule>
<rule>Each title field must have maximum 50 words or less.</rule>
<rule>The title should be based on your understanding of the user's voice note.</rule>
<rule>Date in "DD MMM YYYY" format (e.g., 23 Aug 2025).</rule>
<rule>If no date is provided, use current date in specified format ${new Date().toLocaleDateString(
    "en-US",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  )}.</rule>
</rules>

<voiceNoteTitle>
"${whisperTitle}"
</voiceNoteTitle>

<voiceNote>
"${whisperContent}"
</voiceNote>

<example>
<voiceNote>
"I went to the park and played with my dog. I had a lot of fun."
</voiceNote>
<response>
[{
    "date": "20 May 2023",
    "title": "Long vacation",
    "content": "I went to the park and played with my dog. I had a lot of fun."
}] 
</response>
</example>

<format>
Return ONLY an array of objects like:
[{
    "date": "20 May 2023",
    "title": "Long vacation",
    "content": "I went to the park and played with my dog. I had a lot of fun."
  },
  {
    "date": "23 Aug 2025",
    "title": "Productive Day",
    "content": "I went to the park and played with my dog. I had a lot of fun."
  }]
</format>
`;

  console.log("[generateMemoirContent] 🔍 Prompt:", prompt);

  try {
    let messages: any[] = [
      {
        role: "user",
        content: prompt,
      },
    ];

    let maxIterations = 5; // Prevent infinite loops
    let currentIteration = 0;

    while (currentIteration < maxIterations) {
      currentIteration++;
      console.log(`[generateMemoirContent] 🔍 Iteration ${currentIteration}`);

      const response = await openai.chat.completions.create({
        messages,
        model: "gpt-4.1",
        temperature: 0.1,
        tool_choice: "auto",
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_url",
              description:
                "Analyze an image and provide a detailed description of what the image contains",
              parameters: {
                type: "object",
                properties: {
                  imageUrl: {
                    type: "string",
                    description: "URL of the image to analyze",
                  },
                },
                required: ["imageUrl"],
              },
            },
          },
        ],
      });

      const message = response.choices[0]?.message;
      const content = message?.content;
      const toolCalls = message?.tool_calls;

      console.log("[generateMemoirContent] 🔍 LLM response:", content);
      console.log("[generateMemoirContent] 🔍 Tool calls:", toolCalls);

      if (content && (!toolCalls || toolCalls.length === 0)) {
        try {
          const parsedContent = JSON.parse(content);
          const validatedResponse = MemoirResponseSchema.parse(parsedContent);

          if (validatedResponse.length === 0) {
            throw new Error("Response should be a non-empty array");
          }

          return validatedResponse;
        } catch (parseError) {
          console.error(
            "Failed to parse or validate LLM response:",
            parseError
          );
          throw new Error("Invalid LLM response format");
        }
      }

      if (toolCalls && toolCalls.length > 0) {
        const toolResults: any[] = [];

        for (const toolCall of toolCalls) {
          if (
            toolCall.type === "function" &&
            toolCall.function.name === "analyze_url"
          ) {
            try {
              const args = JSON.parse(toolCall.function.arguments);
              const imageUrl = args.imageUrl;
              console.log(
                "[generateMemoirContent] 🔍 Analyzing image:",
                imageUrl
              );

              const imageAnalysis = await analyzeImageWithVision(imageUrl);
              console.log(
                "[generateMemoirContent] 🔍 Image analysis result:",
                imageAnalysis
              );

              toolResults.push({
                tool_call_id: toolCall.id,
                role: "tool" as const,
                content: imageAnalysis,
              });
            } catch (error) {
              console.error(
                "[generateMemoirContent] 🔍 Error analyzing image:",
                error
              );

              toolResults.push({
                tool_call_id: toolCall.id,
                role: "tool" as const,
                content: "Error analyzing image",
              });
            }
          }
        }

        messages.push({
          role: "assistant",
          content: content || "",
          tool_calls: toolCalls,
        } as any);

        messages.push(...toolResults);

        continue;
      }

      if (!content && (!toolCalls || toolCalls.length === 0)) {
        throw new Error("No response from LLM");
      }
    }

    throw new Error(
      "Maximum iterations reached without getting a valid response"
    );
  } catch (error) {
    console.error("Error generating memoir content:", error);
    throw error;
  }
};

function buildStyleGuide(preferences: z.infer<typeof UserPreferencesSchema>) {
  let styleGuide = "";

  if (preferences.question1 && preferences.question1.length > 10) {
    styleGuide += `Incorporate the user's background (${preferences.question1}) naturally into the narrative. `;
  }

  if (preferences.question2 && preferences.question2.length > 10) {
    styleGuide += `Match the user's personality and communication style as described: ${preferences.question2}. `;
  }

  if (preferences.question3 && preferences.question3.length > 10) {
    styleGuide += `When mentioning relationships, reflect the user's feelings about their loved ones: ${preferences.question3}. `;
  }

  if (preferences.question4 && preferences.question4.length > 10) {
    styleGuide += `Connect the content to the user's interests and career experiences: ${preferences.question4}. `;
  }

  if (styleGuide === "") {
    styleGuide =
      "Write in a personal, engaging memoir style that reflects the user's unique voice and experiences. Write in a warm, conversational tone that feels like the user is sharing their story with a close friend. Keep the content authentic and true to the user's voice while making it engaging for readers.";
  }

  return styleGuide;
}
