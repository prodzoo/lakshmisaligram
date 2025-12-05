import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * edits an image based on a text prompt using Gemini 2.5 Flash Image
 */
export const editImage = async (
  base64Image: string,
  mimeType: string,
  prompt: string
): Promise<string> => {
  try {
    // Ensure base64 string is raw data (remove data URL prefix if present)
    const rawBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: rawBase64,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });

    // Iterate through parts to find the image output
    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          // Return valid data URL
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error("No image data found in the response.");

  } catch (error) {
    console.error("Error editing image:", error);
    throw error;
  }
};

/**
 * Validates if the image contains a person.
 * Returns valid: true if yes.
 * Returns valid: false and a humorous message if no.
 */
export const validateImageContent = async (
  base64Image: string,
  mimeType: string
): Promise<{ isValid: boolean; message?: string }> => {
  try {
    const rawBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
    
    const prompt = `Analyze this image. Does it contain a real human person? 
    If YES, respond exactly with "YES". 
    If it contains an animal, object, food, cartoon, or nothing identifiable as a human, respond with a short, witty, humorous, and slightly roasting error message explaining why this specific subject cannot get a professional headshot. 
    Example: "That is a lovely sandwich, but it is unlikely to get hired as a VP of Sales. Please upload a human."`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: rawBase64, mimeType: mimeType } },
          { text: prompt }
        ]
      }
    });

    const text = response.text?.trim() || "";
    
    if (text.toUpperCase().includes("YES")) {
      return { isValid: true };
    }
    
    // If it's not YES, it's the humorous error message
    return { isValid: false, message: text };

  } catch (error) {
    console.error("Validation error:", error);
    // On error, default to valid to avoid blocking users if API is flaky
    return { isValid: true };
  }
};
