import { gemini15Flash, gemini15Pro, googleAI } from '@genkit-ai/googleai';
import { openAI } from 'genkitx-openai';
import { genkit } from 'genkit';
import fs from 'fs';
import path from 'path';

// Manually load .env.local
try {
    const paths = [
        path.resolve(process.cwd(), '.env.local'),
        path.resolve(process.cwd(), 'genesis-engine', '.env.local')
    ];

    for (const envPath of paths) {
        if (fs.existsSync(envPath)) {
            console.log(`Loading .env.local from: ${envPath}`);
            const envConfig = fs.readFileSync(envPath, 'utf-8').replace(/^\uFEFF/, '');
            envConfig.split(/\r?\n/).forEach(line => {
                const match = line.match(/^([^=]+)=(.*)$/);
                if (match) {
                    const key = match[1].trim();
                    const value = match[2].trim().replace(/^['"](.*)['"]$/, '$1'); // Strip quotes
                    if (key && value) {
                        process.env[key] = value;
                    }
                }
            }); break; // Stop after finding the first one
        }
    }
} catch (error) {
    console.error('Failed to load .env.local manually:', error);
}

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
        version: 'preview'
    }
};

// Legacy Compatibility (Mapping old names to new models to prevent crashes)
export const gemini20Flash = geminiFlash;
export const gemini15Flash = geminiFlash;
export const gemini15Pro = geminiPro;

// Constants
export const ROBOTICS_MODEL_NAME = 'gemini-robotics-er-1.5-preview';
export const ROBOTICS_FALLBACK_MODEL = geminiPro;
export const DEEPSEEK_LOGIC_MODEL = 'openai/deepseek/deepseek-r1-distill-llama-8b'; // OpenRouter ID