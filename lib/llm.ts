"server-only";
import { Groq } from "groq-sdk";
import { z } from "zod";
import dedent from "dedent";

export const groq = new Groq();

const MemoirEntrySchema = z.object({
  date: z.string(),
  title: z.string(),
  content: z.string(),
});

const MemoirResponseSchema = z.array(MemoirEntrySchema);

const UserPreferencesSchema = z.object({
  voiceStyle: z.enum(["scene-focused", "reflection-focused"]).optional(),
  writingStyle: z.enum(["clean-simple", "musical-descriptive"]).optional(),
  candorLevel: z.enum(["fully-candid", "softened-details"]).optional(),
  humorStyle: z.enum(["natural-humor", "background-humor"]).optional(),
  feelingIntent: z.string().optional(),
  opener: z.string().optional(),
});

export const generateMemoirContent = async (
  whisperContent: string,
  userPreferences: z.infer<typeof UserPreferencesSchema>
): Promise<z.infer<typeof MemoirResponseSchema>> => {
  const prompt = dedent`
<instruction>
   You are a skilled personalized memoir writer. Follow the user's preferences and style guide strictly. When you modify the user's original content, modify only the user's original content and keep all information exactly as provided in the original text.
</instruction>

<task>
    You have to generate a memoir entry based on the user's preferences and style guide.
</task>

<styleGuide>
${buildStyleGuide(userPreferences)}
</styleGuide>

<userPreferences>
User's want readers to feel or understand most: ${
    userPreferences.feelingIntent || "Create an engaging, meaningful story"
  }
User's memoir intended for readers: ${
    userPreferences.opener || "Share personal experiences and insights"
  }
</userPreferences>

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

<rules>
<rule>Always Return an Array: Ensure the output is wrapped in [], even for one entry.</rule>
<rule>If user's voice note is short, keep the same content as the voice note.</rule>
<rule>Content field must not exceed 200 words.</rule>
<rule>Use proper punctuation, capitalization and time as "12:00 PM", "12:00 AM" or "12:00".</rule>
<rule>Each title field must have maximum 50 words or less.</rule>
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

`;

  console.log("[generateMemoirContent] 🔍 Prompt:", prompt);

  try {
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "openai/gpt-oss-120b",
      temperature: 0.2,
      // this does't work for some reason
      // response_format: {
      //   type: "json_schema",
      //   json_schema: {
      //     name: "memoir_entries",
      //     schema: z.toJSONSchema(MemoirResponseSchema),
      //   },
      // },
    });

    const content = response.choices[0]?.message?.content;

    console.log("[generateMemoirContent] 🔍 LLM response:", content);

    if (!content) {
      throw new Error("No response from LLM");
    }

    try {
      const parsedContent = JSON.parse(content);
      const validatedResponse = MemoirResponseSchema.parse(parsedContent);

      if (validatedResponse.length === 0) {
        throw new Error("Response should be a non-empty array");
      }

      return validatedResponse;
    } catch (parseError) {
      console.error("Failed to parse or validate LLM response:", parseError);
      throw new Error("Invalid LLM response format");
    }
  } catch (error) {
    console.error("Error generating memoir content:", error);
    throw error;
  }
};

function buildStyleGuide(preferences: z.infer<typeof UserPreferencesSchema>) {
  let styleGuide = "Write in a ";

  if (preferences.writingStyle === "musical-descriptive") {
    styleGuide += "vivid, flowing style with rich descriptions";
  } else {
    styleGuide += "clear, direct style with simple language";
  }

  if (preferences.voiceStyle === "scene-focused") {
    styleGuide += ". Drop the reader directly into the scene";
  } else {
    styleGuide += ". Include reflection on meaning and significance";
  }

  if (preferences.candorLevel === "fully-candid") {
    styleGuide += ". Be completely honest and open";
  } else {
    styleGuide += ". Soften harsh details while maintaining truth";
  }

  if (preferences.humorStyle === "natural-humor") {
    styleGuide += ". Include natural humor where appropriate";
  } else {
    styleGuide += ". Keep humor subtle and in the background";
  }

  return styleGuide;
}
