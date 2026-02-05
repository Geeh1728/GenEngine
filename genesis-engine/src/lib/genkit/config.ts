import { googleAI } from '@genkit-ai/googleai';
import { openAI } from 'genkitx-openai';
import { genkit } from 'genkit';
import fs from 'fs';
import path from 'path';
import { MODELS, LEGACY_MODELS, LOGIC_WATERFALL, VISION_WATERFALL, PHYSICS_WATERFALL, CONTEXT_WATERFALL, REFLEX_WATERFALL } from './models';

export { LOGIC_WATERFALL, VISION_WATERFALL, PHYSICS_WATERFALL, CONTEXT_WATERFALL, REFLEX_WATERFALL };

/**
 * ENVIRONMENT LOADER (Iron Shield)
 * Only attempts manual loading in development.
 * Vercel/Production relies on Dashboard-injected variables.
 */
if (process.env.NODE_ENV === 'development') {
    try {
        const paths = [
            path.resolve(process.cwd(), '.env.local'),
            path.resolve(process.cwd(), 'genesis-engine', '.env.local')
        ];

        for (const envPath of paths) {
            if (fs.existsSync(envPath)) {
                console.log(`[Development] Loading .env.local from: ${envPath}`);
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
        console.error('[Development] Failed to load .env.local manually:', error);
    }
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

// --- TIER 1: THE ELITE COUNCIL (20 RPD) ---
export const gemini3Flash = {
    name: LEGACY_MODELS.BRAIN_PRIMARY,
    label: 'Gemini 3 Flash',
};

// --- TIER 2: THE NUCLEAR WORKHORSE (14,400 RPD!) ---
export const geminiFlash = {
    name: LEGACY_MODELS.BRAIN_WORKHORSE,
    label: 'Gemma 3 27b'
};

export const gemma3_4b = {
    name: LEGACY_MODELS.BRAIN_REFLEX,
    label: 'Gemma 3 4b'
};

// THE BRAINS
export const BRAIN_PRIMARY = gemini3Flash;
export const BRAIN_WORKHORSE = geminiFlash;
export const BRAIN_REFLEX = gemma3_4b;

// THE UNLIMITED CHANNEL (Native Audio) - 1M RPD / Unlimited
export const geminiAudio = {
    name: MODELS.BRAIN_AUDIO,
    label: 'Gemini Audio'
};

// --- TIER 3: OPENROUTER FREE SPECIALISTS ---
export const OPENROUTER_FREE_MODELS = {
    MATH: LOGIC_WATERFALL[0],
    VISION: VISION_WATERFALL[0],
    VISION_PRO: VISION_WATERFALL[0],
    DEAN: CONTEXT_WATERFALL[1],
    LIBRARIAN: CONTEXT_WATERFALL[1],
    DYNAMIC: PHYSICS_WATERFALL[0],
    REFLEX: REFLEX_WATERFALL[0],
    GENERAL: 'openai/meta-llama/llama-3.3-70b-instruct:free',
    CHAT: 'openai/mistralai/mistral-7b-instruct:free',
    CODE: 'openai/qwen/qwen-2.5-coder-32b-instruct:free',
    EMBED: MODELS.MISTRAL_EMBED
};

// Legacy Compatibility
export const gemini20Flash = geminiFlash;
export const gemini15Flash = geminiFlash;
export const gemini15Pro = gemini3Flash;

// Constants
export const ROBOTICS_MODEL_NAME = LEGACY_MODELS.BRAIN_ROBOTICS;
export const ROBOTICS_FALLBACK_MODEL = OPENROUTER_FREE_MODELS.VISION;
export const DEEPSEEK_LOGIC_MODEL = OPENROUTER_FREE_MODELS.MATH;
export const KIMI_DEAN_MODEL = LEGACY_MODELS.SWARM_REVIEWER; // Use Kimi for heavy logic review