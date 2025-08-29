"server-only";
import { Groq } from "groq-sdk";
import { z } from "zod";
import dedent from "dedent";
import { stripMarkdown } from "./utils";

export const groq = new Groq();

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
  userPreferences: z.infer<typeof UserPreferencesSchema>
): Promise<z.infer<typeof MemoirResponseSchema>> => {
  const prompt = dedent`
<instruction>
   You are a skilled personalized memoir writer. Follow the user's preferences and style guide strictly.
</instruction>

<task>
    You have to generate a memoir entry based on the user's preferences and style guide.
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
<rule>Always Return an Array: Ensure the output is wrapped in [], even for one entry.</rule>
<rule>Generate the content based on the user's preferences and style guide.</rule>
<rule>When modifying a user's voice note, only rephrase or correct grammar without adding, removing, or inferring any new information beyond what was originally said.</rule>
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

<voiceNote>
"${stripMarkdown(whisperContent)}"
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
