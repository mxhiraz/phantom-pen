import { groq } from "../llm";

export const analyzeImageWithVision = async (
  imageUrl: string
): Promise<string> => {
  try {
    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch image: ${response.status} ${response.statusText}`
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64String = arrayBufferToBase64(arrayBuffer);

    const prompt = `Analyze this image and provide a detailed description of what you see. Include:
    - Main objects and subjects
    - Colors and visual elements
    - Mood or atmosphere
    - Any text or symbols visible
    - Overall context or setting
    
    Be descriptive and accurate.`;

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
                url: `data:image/jpeg;base64,${base64String}`,
              },
            },
          ],
        },
      ],
      model: "meta-llama/llama-4-maverick-17b-128e-instruct",
      temperature: 0,
      max_tokens: 50,
    });

    const analysis = chatCompletion.choices[0]?.message?.content?.trim();

    if (!analysis) {
      throw new Error("Failed to analyze image");
    }

    return analysis;
  } catch (error) {
    console.error("Error analyzing image:", error);
    return "Unable to analyze image";
  }
};

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
