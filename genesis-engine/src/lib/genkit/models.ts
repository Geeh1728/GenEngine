/**
 * ULTIMATE SWARM MODEL IDENTIFIERS (v23.5 Hardened)
 * Objective: PhD-Level Specialization with Verified Free Swarm.
 */

export const MODELS = {
    // ELITE THINKERS (PhD-Level Reasoning)
    BRAIN_ELITE: 'googleai/gemini-3-pro',             // 1.5K RPD
    BRAIN_PRO: 'googleai/gemini-2-pro-exp-02-05',    // 1.5K RPD
    BRAIN_DYNAMIC: 'googleai/gemini-exp-1206',       // Creative Logic
    BRAIN_REASONING: 'openrouter/deepseek-r1',       // Mathematical Truth
    
    // PERFORMANCE HEADS (The Workhorses)
    BRAIN_FLASH_3: 'googleai/gemini-3-flash',        // 20 RPD
    BRAIN_FLASH_25: 'googleai/gemini-2.5-flash',     // 20 RPD
    BRAIN_FLASH_20: 'googleai/gemini-2-flash',       // 1.5K RPD
    BRAIN_FLASH_20_EXP: 'googleai/gemini-2-flash-exp', // 1.5K RPD
    
    // SCALE & BULK (High-Throughput / High-RPD)
    BRAIN_LITE: 'googleai/gemini-2-flash-lite',      // 1.5K RPD
    BRAIN_LITE_25: 'googleai/gemini-2.5-flash-lite', // 20 RPD
    
    // ROBOTICS & SPATIAL (Robotics-ER)
    ROBOTICS_ER: 'googleai/gemini-robotics-er-1.5-preview', // 20 RPD
    COMPUTER_USE: 'googleai/computer-use-preview',   // 1.5K RPD
    DEEP_RESEARCH: 'googleai/deep-research-pro-preview', // 1.5K RPD
    
    // GEMMA 3 SERIES (Nuclear Power: 14.4K RPD)
    GEMMA_3_27B: 'googleai/gemma-3-27b-it',
    GEMMA_3_12B: 'googleai/gemma-3-12b-it',
    GEMMA_3_4B: 'googleai/gemma-3-4b-it',
    GEMMA_3_2B: 'googleai/gemma-3n-e2b-it', 
    GEMMA_3_1B: 'googleai/gemma-3-1b-it',
    
    // MULTIMODAL & VISION SPECIALISTS
    VISION_GEMINI: 'googleai/gemini-3-flash',      
    IMAGE_GEN: 'googleai/imagen-4-generate',         // 25 RPD
    IMAGE_ULTRA: 'googleai/imagen-4-ultra-generate', // 25 RPD
    IMAGE_FAST: 'googleai/imagen-4-fast-generate',   // 25 RPD
    NANO_BANANA: 'googleai/gemini-2.5-flash-preview-image', // 1.5K RPD
    NANO_BANANA_PRO: 'googleai/gemini-3-pro-image',  // 1.5K RPD
    
    // AUDIO & REAL-TIME (Anchor for Live API - UNLIMITED)
    BRAIN_AUDIO: 'googleai/gemini-2.5-flash-native-audio-latest', // UNLIMITED
    BRAIN_AUDIO_TTS: 'googleai/gemini-2.5-flash-tts', // 10 RPD
    BRAIN_AUDIO_PRO_TTS: 'googleai/gemini-2.5-pro-tts', // 1.5K RPD
    
    // LOGIC SPECIALISTS (OpenRouter Free Swarm)
    LOGIC_DEEPSEEK: 'openrouter/deepseek-r1',
    LOGIC_QWEN_CODER: 'openrouter/qwen-coder', 
    LOGIC_FREE_ROUTER: 'openrouter/free-router',
    
    // PHYSICS & REFLEXES
    PHYSICS_LIQUID: 'openrouter/liquid-lfm',
    REFLEX_NVIDIA: 'openrouter/nemotron',

    // GROQ LPU MODELS (v32.0 - Ultra Low Latency)
    GROQ_LLAMA_4_SCOUT: 'groq/meta-llama/llama-4-scout-17b-16e-instruct', 
    GROQ_LLAMA_4_MAVERICK: 'groq/meta-llama/llama-4-maverick-17b-128e-instruct',
    GROQ_GPT_OSS: 'groq/openai/gpt-oss-120b',
    GROQ_GPT_OSS_20B: 'groq/openai/gpt-oss-20b',
    GROQ_KIMI_K2: 'groq/moonshotai/kimi-k2-instruct',
    GROQ_LLAMA_31_8B: 'groq/llama-3.1-8b-instant',
    GROQ_LLAMA_33_70B: 'groq/llama-3.3-70b-versatile',
    GROQ_QWEN_3: 'groq/qwen/qwen3-32b',
    GROQ_COMPOUND: 'groq/groq/compound',
    GROQ_COMPOUND_MINI: 'groq/groq/compound-mini',
    
    // EMBEDDINGS (Validated via separate path)
    EMBEDDING_MODEL: 'googleai/text-embedding-004',
    EMBEDDING_1: 'googleai/gemini-embedding-001',
    MISTRAL_EMBED: 'mistralai/mistral-embed:free',
};

// CASCADING WATERFALLS (Semantic Routing)

export const LOGIC_WATERFALL = [
    MODELS.BRAIN_PRO, // DeepSeek R1 via OpenRouter
    MODELS.GROQ_GPT_OSS, // Groq Reasoning
    MODELS.BRAIN_ELITE, // 2.0 Pro
    MODELS.LOGIC_DEEPSEEK,
    MODELS.GROQ_QWEN_3,
    MODELS.BRAIN_FLASH_3, // Gemini 3 Flash Preview
    MODELS.GEMMA_3_27B
];

export const VISION_WATERFALL = [
    MODELS.VISION_GEMINI, // 2.0 Flash
    MODELS.ROBOTICS_ER, 
    MODELS.VISION_GEMINI_LEGACY, // 2.5 Flash Image
    MODELS.BRAIN_FLASH_3
];

export const PHYSICS_WATERFALL = [
    MODELS.BRAIN_PRO, 
    MODELS.GROQ_GPT_OSS,
    MODELS.PHYSICS_LIQUID,
    MODELS.BRAIN_FLASH_25, // 2.5 Flash
    MODELS.GEMMA_3_27B
];

export const CONTEXT_WATERFALL = [
    MODELS.BRAIN_LITE, // 2.0 Flash Lite
    MODELS.GROQ_KIMI_K2, 
    MODELS.BRAIN_FLASH_3,
    MODELS.BRAIN_FLASH_25
];

export const REFLEX_WATERFALL = [
    MODELS.GROQ_LLAMA_4_SCOUT, // <100ms
    MODELS.BRAIN_FLASH_3, // Gemini 3 Flash
    MODELS.GEMMA_3_4B, 
    MODELS.REFLEX_NVIDIA,
    MODELS.GROQ_LLAMA_31_8B
];

export const SENTINEL_WATERFALL = [
    MODELS.GROQ_LLAMA_31_8B, 
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