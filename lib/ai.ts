import OpenAI from "openai";

if (!process.env.DEEPSEEK_API_KEY) {
  console.warn("⚠️ DEEPSEEK_API_KEY не задан в .env");
}

export const ai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY ?? "",
  baseURL: "https://api.deepseek.com/v1",
});

export const AI_MODEL = "deepseek-chat";