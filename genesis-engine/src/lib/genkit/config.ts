import { googleAI } from '@genkit-ai/googleai';
import { openAI } from 'genkitx-openai';
import { genkit } from 'genkit';
import path from 'path';
import dotenv from 'dotenv';

// Manually load .env.local for Genkit initialization (resilience for various run contexts)
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

// 1. Force-load the key from ANY possible name (Resilience)
const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;

if (!apiKey) {
  console.error("❌ CRITICAL ERROR: NO API KEY FOUND. Check your .env.local file.");
} else {
  console.log("✅ Genkit API Key Detected.");
}

// 2. Initialize Genkit
export const ai = genkit({
    plugins: [
        // Explicitly pass the key. Do not rely on auto-discovery.
        googleAI({ apiKey: apiKey }),
        openAI({
            apiKey: process.env.OPENROUTER_API_KEY,
            baseURL: 'https://openrouter.ai/api/v1',
        }),
    ],
});

// 3. Define the Models

// THE NEW WORKHORSE (Use 'Lite' to save quota)
export const geminiFlash = {
    name: 'googleai/gemini-2.5-flash-lite',
    label: 'Gemini 2.5 Flash Lite'
};

// THE INTELLIGENCE (Use '2.5 Flash' sparingly - only 20/day!)
export const geminiPro = {
    name: 'googleai/gemini-2.5-flash',
    label: 'Gemini 2.5 Flash'
};

// THE UNLIMITED CHANNEL (Native Audio)
export const geminiAudio = {
    name: 'googleai/gemini-2.5-flash-native-audio-dialog',
    label: 'Gemini Audio'
};

// THE VISUAL CORTEX (Gemini 3 / Thinking Preview)
export const gemini3Flash = {
    name: 'googleai/gemini-2.0-flash-thinking-exp-01-21',
    label: 'Gemini 3 Flash (Thinking)',
    config: {
        // Thinking models often support different configs, 
        // using standard Genkit style if supported or just the name.
        version: 'preview'
    }
};

// Legacy Compatibility (Mapping old names to new models to prevent crashes)
export const gemini20Flash = geminiFlash;

// Constants
export const ROBOTICS_MODEL_NAME = 'googleai/gemini-2.5-flash';
export const ROBOTICS_FALLBACK_MODEL = geminiPro;
export const DEEPSEEK_LOGIC_MODEL = 'openai/deepseek/deepseek-r1-distill-llama-8b'; // OpenRouter ID