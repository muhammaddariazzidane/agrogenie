import { GoogleGenAI } from "@google/genai";

export const genAI = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY as string,
});
