import { googleAI } from '@genkit-ai/googleai';
import { openAI } from 'genkitx-openai';
import { genkit } from 'genkit';
import fs from 'fs';
import path from 'path';
import { MODELS, LEGACY_MODELS, LOGIC_WATERFALL, VISION_WATERFALL, PHYSICS_WATERFALL, CONTEXT_WATERFALL, REFLEX_WATERFALL } from './models';
import { quotaOracle } from '../utils/quota-oracle';

export { MODELS, LOGIC_WATERFALL, VISION_WATERFALL, PHYSICS_WATERFALL, CONTEXT_WATERFALL, REFLEX_WATERFALL };

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
const groqKey = process.env.GROQ_API_KEY;

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

if (groqKey) {
    console.log("⚡ Groq LPU Key Detected.");
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
 * MODULE G-R: GROQ DIRECT ADAPTER (v32.0)
 * Objective: Direct LPU integration for <200ms latency.
 */
const groqModels = [
    { id: 'meta-llama/llama-4-scout-17b-16e-instruct', name: 'meta-llama/llama-4-scout-17b-16e-instruct' },
    { id: 'meta-llama/llama-4-maverick-17b-128e-instruct', name: 'meta-llama/llama-4-maverick-17b-128e-instruct' },
    { id: 'openai/gpt-oss-120b', name: 'openai/gpt-oss-120b' },
    { id: 'openai/gpt-oss-20b', name: 'openai/gpt-oss-20b' },
    { id: 'groq/compound', name: 'groq/compound' },
    { id: 'groq/compound-mini', name: 'groq/compound-mini' },
    { id: 'moonshotai/kimi-k2-instruct', name: 'moonshotai/kimi-k2-instruct' },
    { id: 'llama-3.1-8b-instant', name: 'llama-3.1-8b-instant' },
    { id: 'llama-3.3-70b-versatile', name: 'llama-3.3-70b-versatile' },
    { id: 'qwen/qwen3-32b', name: 'qwen/qwen3-32b' }
];

groqModels.forEach(model => {
    ai.defineModel(
        {
            name: `groq/${model.name}`,
            label: `Groq LPU ${model.id}`,
        },
        async (req) => {
            const startTime = Date.now();
            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${groqKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: model.id,
                    messages: req.messages.map(m => ({
                        role: m.role === 'model' ? 'assistant' : m.role,
                        content: m.content[0].text
                    })),
                    temperature: req.config?.temperature,
                    max_tokens: req.config?.maxOutputTokens,
                })
            });

            const data = await response.json();
            const latency = Date.now() - startTime;

            if (!response.ok) {
                console.error("[Groq Error Details]:", JSON.stringify(data));
                throw new Error(`Groq Inference failed (${response.status})`);
            }

            // TELEMETRY: Record LPU usage and rate limits
            quotaOracle.recordTelemetry(`groq/${model.id}`, response.headers);
            
            return {
                message: {
                    role: 'model',
                    content: [{ text: data.choices[0].message.content }]
                },
                custom: {
                    latency,
                    remainingRequests: response.headers.get('x-ratelimit-remaining-requests')
                }
            };
        }
    );
});

/**
 * MODULE O-R: OPENROUTER ADAPTER (v23.5 HARDENED)
 * Objective: Direct integration with OpenRouter to ensure 100% model availability.
 */
const openRouterModels = [
    { id: 'deepseek/deepseek-r1', name: 'deepseek-r1' },
    { id: 'liquid/lfm-2.5-1.2b-thinking:free', name: 'liquid-lfm' },
    { id: 'nvidia/nemotron-3-nano-30b-a3b:free', name: 'nemotron' },
    { id: 'openrouter/free', name: 'free-router' },
    { id: 'qwen/qwen3-coder:free', name: 'qwen-coder' }
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
            if (!response.ok) {
                console.error("[OpenRouter Error Details]:", JSON.stringify(data));
                throw new Error(`OpenRouter Inference failed (${response.status})`);
            }

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
    name: MODELS.BRAIN_FLASH_3,
    label: 'Gemini 3 Flash',
};

// --- TIER 2: THE NUCLEAR WORKHORSE (14,400 RPD!) ---
export const geminiFlash = {
    name: MODELS.BRAIN_FLASH_25,
    label: 'Gemini 2.5 Flash'
};

export const gemini20Flash = {
    name: MODELS.BRAIN_FLASH_20_STD,
    label: 'Gemini 2.0 Flash'
};

export const gemma3_4b = {
    name: MODELS.GEMMA_3_4B,
    label: 'Gemma 3 4b'
};

// THE BRAINS
export const BRAIN_PRIMARY = gemini3Flash;
export const BRAIN_WORKHORSE = geminiFlash;
export const BRAIN_REFLEX = gemma3_4b;

// THE UNLIMITED CHANNEL (Native Audio) - 1M RPD / Unlimited
export const geminiAudio = {
    name: MODELS.BRAIN_AUDIO,
    label: 'Gemini 2.5 Flash Native Audio'
};

// --- TIER 3: OPENROUTER FREE SPECIALISTS ---
export const OPENROUTER_FREE_MODELS = {
    MATH: MODELS.BRAIN_PRO, // DeepSeek R1 via OpenRouter
    VISION: MODELS.VISION_GEMINI, 
    VISION_PRO: MODELS.ROBOTICS_ER,
    DEAN: MODELS.BRAIN_ELITE,
    LIBRARIAN: MODELS.BRAIN_LITE,
    DYNAMIC: MODELS.PHYSICS_LIQUID,
    REFLEX: MODELS.GROQ_LLAMA_4_SCOUT,
    GENERAL: MODELS.LOGIC_FREE_ROUTER,
    CHAT: 'openai/mistralai/mistral-7b-instruct:free',
    CODE: MODELS.LOGIC_QWEN_CODER,
    EMBED: 'mistralai/mistral-embed:free'
};

// Legacy Compatibility

// Constants
export const ROBOTICS_MODEL_NAME = LEGACY_MODELS.BRAIN_ROBOTICS;
export const ROBOTICS_FALLBACK_MODEL = OPENROUTER_FREE_MODELS.VISION;
export const DEEPSEEK_LOGIC_MODEL = OPENROUTER_FREE_MODELS.MATH;
export const KIMI_DEAN_MODEL = LEGACY_MODELS.SWARM_REVIEWER; // Use Kimi for heavy logic review
export const QWEN3_MODEL = MODELS.GROQ_QWEN_3;