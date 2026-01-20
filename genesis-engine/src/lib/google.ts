import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. Initialize the Free Tier Client
// This uses the key from .env.local
const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

// 2. Define the Models
// "flash" = Logic/Physics (Fast & Free)
// "embedding" = Vector Search (Free)
export const physicsModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
export const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

// 3. Helper Function to Clean Text
export function cleanText(text: string) {
    return text.replace(/\s+/g, " ").trim();
}
