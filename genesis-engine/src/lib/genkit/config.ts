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
const openRouterKey = process.env.OPENROUTER_API_KEY;

// satisfy openai plugin validation
if (openRouterKey && !process.env.OPENAI_API_KEY) {
    process.env.OPENAI_API_KEY = openRouterKey;
}

if (!apiKey) {
    // Only log if not in a headless/test environment where keys might be injected differently
    if (process.env.NODE_ENV !== 'test') console.error("❌ CRITICAL ERROR: NO GOOGLE API KEY FOUND.");
} else {
    console.log("✅ Genkit API Key Detected.");
}

// 2. Initialize Genkit
export const ai = genkit({
    plugins: [
        // Explicitly pass the key. Do not rely on auto-discovery.
        googleAI({ apiKey: apiKey }),
        openAI({
            apiKey: openRouterKey,
            baseURL: 'https://openrouter.ai/api/v1',
        }),
    ],
});

/**
 * MODULE O-R: OPENROUTER ADAPTER (v23.0 ULTIMATE)
 * Objective: Direct integration with OpenRouter to ensure 100% model availability.
 */
const openRouterModels = [
    { id: 'deepseek/deepseek-r1-0528:free', name: 'deepseek-r1' },
    { id: 'liquid/lfm-2.5-1.2b-thinking:free', name: 'liquid-lfm' },
    { id: 'nvidia/nemotron-3-nano-30b-a3b:free', name: 'nemotron' },
    { id: 'openai/gpt-oss-120b:free', name: 'gpt-oss' },
    { id: 'mistralai/mistral-small-3.1-24b-instruct:free', name: 'mistral-small' },
    { id: 'openrouter/free', name: 'free-router' },
    { id: 'qwen/qwen3-coder:free', name: 'qwen-coder' },
    { id: 'allenai/molmo2-8b:free', name: 'molmo-2' },
    { id: 'qwen/qwen3-next-80b-a3b-instruct:free', name: 'qwen-vl' },
    { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'llama-3.3-70b' }
];

openRouterModels.forEach(model => {
    ai.defineModel(
        {
            name: `openrouter/${model.name}`,
            label: `OpenRouter ${model.id}`,
        },
        async (req) => {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${openRouterKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: model.id,
                    messages: req.messages.map(m => ({
                        role: m.role,
                        content: m.content[0].text // Simplified for now
                    })),
                    temperature: req.config?.temperature,
                    max_tokens: req.config?.maxOutputTokens,
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(`OpenRouter Error: ${JSON.stringify(data)}`);

            return {
                message: {
                    role: 'model',
                    content: [{ text: data.choices[0].message.content }]
                }
            };
        }
    );
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