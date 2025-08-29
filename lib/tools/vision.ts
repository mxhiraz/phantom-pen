import { groq } from "../llm";

export const analyzeImageAndGenerateName = async (
  fileUrl: string
): Promise<string> => {
  try {
    const response = await fetch(fileUrl);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch file: ${response.status} ${response.statusText}`
      );
    }

    const arrayBuffer = await response.arrayBuffer();

    const base64String = arrayBufferToBase64(arrayBuffer);

    const prompt = `Analyze this image and generate a descriptive, meaningful filename (without extension) that best represents the content. 
    
    The filename should be:
    - Descriptive and relevant to the image content
    - 3-8 words maximum
    - Use hyphens or underscores between words
    - No special characters except hyphens and underscores
    - Professional and appropriate
    
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
                url: `data:image/jpeg;base64,${base64String}`,
              },
            },
          ],
        },
      ],
      model: "meta-llama/llama-4-maverick-17b-128e-instruct",
      temperature: 0.1,
      max_tokens: 50,
    });

    const generatedName = chatCompletion.choices[0]?.message?.content?.trim();

    if (!generatedName) {
      throw new Error("Failed to generate name from AI");
    }

    const cleanName = generatedName
      .replace(/[^a-zA-Z0-9\s\-_]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase()
      .trim();

    return cleanName || "analyzed-image";
  } catch (error) {
    console.error("Error analyzing image:", error);
    return "analyzed-image";
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
