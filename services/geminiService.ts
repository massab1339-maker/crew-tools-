import { GoogleGenAI, Chat, GenerateContentResponse, Content } from "@google/genai";
import { MODEL_NAME, SYSTEM_INSTRUCTION, GOAL_COACH_INSTRUCTION } from '../constants';

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

export const createGoalCoachSession = (): Chat => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  return ai.chats.create({
    model: MODEL_NAME,
    config: {
      systemInstruction: GOAL_COACH_INSTRUCTION,
      temperature: 0.7,
    },
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
