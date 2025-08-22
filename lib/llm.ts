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
  
<styleGuide>
${buildStyleGuide(userPreferences)}
</styleGuide>

<userPreferences>
User's intended feeling: ${
    userPreferences.feelingIntent || "Create an engaging, meaningful story"
  }
User's memoir motivation: ${
    userPreferences.opener || "Share personal experiences and insights"
  }
</userPreferences>

<voiceNote>
"${whisperContent}"
</voiceNote>

<examples>
<voiceNote>
"I went to the park and played with my dog. I had a lot of fun."
</voiceNote>
<example>
This is an example show when user voice have only one entry:
[
  {
    "date": "20 May 2023",
    "title": "Long vacation",
    "content": "I went to the park and played with my dog. I had a lot of fun."
  } 
] 
</example>
</examples>

<format>
Return ONLY a array of objects like:
[
  {
    "date": "20 May 2023",
    "title": "Long vacation",
    "content": "I went to the park and played with my dog. I had a lot of fun."
  },
  {
    "date": "23 Aug 2025",
    "title": "Productive Day",
    "content": "I went to the park and played with my dog. I had a lot of fun."
  }
]
</format>

<requirements>
<rules>
<rule>Each content field must have maximum 200 words or less.</rule>
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
</requirements>
`;

  console.log("[generateMemoirContent] 🔍 Prompt:", prompt);

  try {
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are a skilled personalized memoir writer who follows the style guide and  preferences provided by the user.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "openai/gpt-oss-120b",
      temperature: 0.1,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "MemoirResponse",
          schema: z.toJSONSchema(MemoirResponseSchema),
        },
      },
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
      console.log("Raw response:", content);
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
