import { GoogleGenAI, Chat, GenerateContentResponse, Content } from "@google/genai";
import { MODEL_NAME, SYSTEM_INSTRUCTION, THUMBNAIL_DESIGNER_INSTRUCTION, MAGIC_AI_LOGO_PROMPT } from '../constants';

export const createChatSession = (history?: Content[]): Chat => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  return ai.chats.create({
    model: MODEL_NAME,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7,
    },
    history: history,
  });
};

export const sendMessageStream = async (
  chat: Chat,
  message: string
): Promise<AsyncIterable<GenerateContentResponse>> => {
  try {
    const response = await chat.sendMessageStream({ message });
    return response;
  } catch (error) {
    console.error("Error sending message to Gemini:", error);
    throw error;
  }
};

export const generateThumbnailDesign = async (prompt: string): Promise<any> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: THUMBNAIL_DESIGNER_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.4, 
      }
    });

    let text = response.text;
    if (!text) throw new Error("No response from AI");
    
    text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      text = text.substring(firstBrace, lastBrace + 1);
    }

    try {
      return JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse JSON", text);
      throw new Error("AI returned invalid JSON structure");
    }
  } catch (error) {
    console.error("Error generating thumbnail design:", error);
    throw error;
  }
};

export const generateLogo = async (brand: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = MAGIC_AI_LOGO_PROMPT.replace('{BRAND}', brand);
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      }
    });

    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
    }
    
    throw new Error("No image data found in AI response");
  } catch (error) {
    console.error("Error generating logo:", error);
    throw error;
  }
};