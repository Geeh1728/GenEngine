/**
 * ULTIMATE SWARM MODEL IDENTIFIERS (v23.5 Hardened)
 * Objective: PhD-Level Specialization with Verified Free Swarm.
 */

export const MODELS = {
    // ELITE THINKERS (PhD-Level Reasoning)
    BRAIN_ELITE: 'googleai/gemini-2.0-pro-exp-02-05', // 2026 Peak Pro
    BRAIN_PRO: 'openrouter/deepseek-r1',             // Mathematical Truth
    BRAIN_DYNAMIC: 'googleai/gemini-exp-1206',       // Creative Logic
    
    // PERFORMANCE HEADS (The Workhorses)
    BRAIN_FLASH_3: 'googleai/gemini-2.0-flash',      // 2026 Standard Flash
    BRAIN_FLASH_25: 'groq/llama-3.3-70b-versatile',  // LPU Accelerated
    BRAIN_FLASH_20: 'googleai/gemini-2.0-flash-001',
    
    // SCALE & BULK (High-Throughput / High-RPD)
    BRAIN_LITE: 'googleai/gemini-2.0-flash-lite',    // Efficient extraction
    
    // ROBOTICS & SPATIAL (Robotics-ER)
    ROBOTICS_ER: 'googleai/gemini-robotics-er-1.5-preview', // Specialized
    
    // GEMMA 3 SERIES (Nuclear Power: 14.4K RPD)
    GEMMA_3_27B: 'googleai/gemma-3-27b-it',
    GEMMA_3_12B: 'googleai/gemma-3-12b-it',
    GEMMA_3_4B: 'googleai/gemma-3-4b-it',
    GEMMA_3_2B: 'googleai/gemma-3n-e2b-it', 
    GEMMA_3_1B: 'googleai/gemma-3-1b-it',
    
    // MULTIMODAL & VISION SPECIALISTS
    VISION_GEMINI: 'googleai/gemini-2.0-flash',      // Native Vision
    
    // AUDIO & REAL-TIME (Anchor for Live API - UNLIMITED)
    BRAIN_AUDIO: 'googleai/gemini-2.0-flash-exp',    // Live API Native Audio
    
    // LOGIC SPECIALISTS (OpenRouter Free Swarm)
    LOGIC_DEEPSEEK: 'openrouter/deepseek-r1',
    LOGIC_QWEN_CODER: 'openrouter/qwen-coder', 
    LOGIC_FREE_ROUTER: 'openrouter/free-router',
    
    // PHYSICS & REFLEXES
    PHYSICS_LIQUID: 'openrouter/liquid-lfm',
    REFLEX_NVIDIA: 'openrouter/nemotron',

    // GROQ LPU MODELS (v32.0 - Ultra Low Latency)
    GROQ_LLAMA_4_SCOUT: 'groq/meta-llama/llama-4-scout-17b-instruct',
    GROQ_GPT_OSS: 'groq/openai/gpt-oss-120b',
    GROQ_KIMI_K2: 'groq/moonshotai/kimi-k2-instruct',
    GROQ_LLAMA_31_8B: 'groq/llama-3.1-8b-instant',
    GROQ_LLAMA_33_70B: 'groq/llama-3.3-70b-versatile',
    GROQ_QWEN_3: 'groq/qwen-3-72b',
    
    // EMBEDDINGS (Validated via separate path)
    EMBEDDING_MODEL: 'googleai/text-embedding-004',
    EMBEDDING_1: 'googleai/gemini-embedding-001',
    MISTRAL_EMBED: 'mistralai/mistral-embed:free',
};

// CASCADING WATERFALLS (Semantic Routing)

export const LOGIC_WATERFALL = [
    MODELS.BRAIN_PRO, // DeepSeek R1 first for logic
    MODELS.GROQ_GPT_OSS,
    MODELS.BRAIN_ELITE,
    MODELS.LOGIC_DEEPSEEK,
    MODELS.GROQ_QWEN_3,
    MODELS.LOGIC_QWEN_CODER,
    MODELS.LOGIC_FREE_ROUTER,
    MODELS.GEMMA_3_27B,
    MODELS.GEMMA_3_2B
];

export const VISION_WATERFALL = [
    MODELS.VISION_GEMINI, // 2.0 Flash is elite at vision
    MODELS.ROBOTICS_ER, 
    MODELS.BRAIN_FLASH_3,
    MODELS.GEMMA_3_4B
];

export const PHYSICS_WATERFALL = [
    MODELS.BRAIN_PRO, // Logic-heavy physics
    MODELS.GROQ_GPT_OSS,
    MODELS.PHYSICS_LIQUID,
    MODELS.BRAIN_FLASH_3,
    MODELS.LOGIC_DEEPSEEK,
    MODELS.GEMMA_3_27B,
    MODELS.GEMMA_3_2B
];

export const CONTEXT_WATERFALL = [
    MODELS.BRAIN_LITE, // 2.0 Flash Lite is huge context king
    MODELS.GROQ_KIMI_K2, 
    MODELS.BRAIN_FLASH_3,
    MODELS.GEMMA_3_12B,
    MODELS.GEMMA_3_2B
];

export const REFLEX_WATERFALL = [
    MODELS.GROQ_LLAMA_4_SCOUT, // Primary Vibe Coder (<100ms)
    MODELS.BRAIN_FLASH_3,
    MODELS.GEMMA_3_4B, 
    MODELS.GEMMA_3_2B,
    MODELS.GEMMA_3_1B,
    MODELS.REFLEX_NVIDIA
];

export const SENTINEL_WATERFALL = [
    MODELS.GROQ_LLAMA_31_8B, // Primary Validator (14.4K RPD)
    MODELS.BRAIN_LITE,
    MODELS.GEMMA_3_2B
];

// LEGACY COMPATIBILITY (Maps old keys to the new swarm)
export const LEGACY_MODELS = {
    BRAIN_PRIMARY: LOGIC_WATERFALL[0],
    BRAIN_WORKHORSE: LOGIC_WATERFALL[1],
    BRAIN_REFLEX: REFLEX_WATERFALL[0],
    BRAIN_ROBOTICS: VISION_WATERFALL[0],
    SWARM_REVIEWER: CONTEXT_WATERFALL[0],
    VISION_PRECISION: VISION_WATERFALL[1],
    PHYSICS_DYNAMIC: PHYSICS_WATERFALL[0],
    MOBILE_REFLEX: REFLEX_WATERFALL[0],
    CONTEXT_LIBRARIAN: CONTEXT_WATERFALL[0]
};