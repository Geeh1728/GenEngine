/**
 * ULTIMATE SWARM MODEL IDENTIFIERS (v23.5 Hardened)
 * Objective: PhD-Level Specialization with Verified Free Swarm.
 */

export const MODELS = {
    // ELITE THINKERS (PhD-Level Reasoning)
    BRAIN_ELITE: 'gemini-3-pro',             // 1.5K RPD
    BRAIN_PRO: 'gemini-2.0-pro-exp-02-05',    // 1.5K RPD
    BRAIN_DYNAMIC: 'gemini-exp-1206',       // Creative Logic
    BRAIN_REASONING: 'openrouter/deepseek-r1',       // Mathematical Truth
    
    // PERFORMANCE HEADS (The Workhorses)
    BRAIN_FLASH_3: 'gemini-3-flash',        // 20 RPD
    BRAIN_FLASH_25: 'gemini-2.5-flash',     // 20 RPD
    BRAIN_FLASH_20: 'gemini-2.0-flash',       // 1.5K RPD
    BRAIN_FLASH_20_EXP: 'gemini-2.0-flash-exp', // 1.5K RPD
    
    // SCALE & BULK (High-Throughput / High-RPD)
    BRAIN_LITE: 'gemini-2.0-flash-lite',      // 1.5K RPD
    BRAIN_LITE_25: 'gemini-2.5-flash-lite', // 20 RPD
    
    // ROBOTICS & SPATIAL (Robotics-ER)
    ROBOTICS_ER: 'gemini-robotics-er-1.5-preview', // 20 RPD
    COMPUTER_USE: 'computer-use-preview',   // 1.5K RPD
    DEEP_RESEARCH: 'deep-research-pro-preview', // 1.5K RPD
    
    // GEMMA 3 SERIES (Nuclear Power: 14.4K RPD)
    GEMMA_3_27B: 'gemma-3-27b-it',
    GEMMA_3_12B: 'gemma-3-12b-it',
    GEMMA_3_4B: 'gemma-3-4b-it',
    GEMMA_3_2B: 'gemma-3n-e2b-it', 
    GEMMA_3_1B: 'gemma-3-1b-it',
    
    // MULTIMODAL & VISION SPECIALISTS
    VISION_GEMINI: 'gemini-3-flash',      
    IMAGE_GEN: 'imagen-4-generate',         // 25 RPD
    IMAGE_ULTRA: 'imagen-4-ultra-generate', // 25 RPD
    IMAGE_FAST: 'imagen-4-fast-generate',   // 25 RPD
    NANO_BANANA: 'gemini-2.5-flash-preview-image', // 1.5K RPD
    NANO_BANANA_PRO: 'gemini-3-pro-image',  // 1.5K RPD
    
    // AUDIO & REAL-TIME (Anchor for Live API - UNLIMITED)
    BRAIN_AUDIO: 'gemini-2.5-flash-native-audio-latest', // UNLIMITED
    BRAIN_AUDIO_TTS: 'gemini-2.5-flash-tts', // 10 RPD
    BRAIN_AUDIO_PRO_TTS: 'gemini-2.5-pro-tts', // 1.5K RPD
    
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
    EMBEDDING_MODEL: 'text-embedding-004',
    EMBEDDING_1: 'gemini-embedding-001',
    MISTRAL_EMBED: 'mistralai/mistral-embed:free',
};

// CASCADING WATERFALLS (Semantic Routing)

export const LOGIC_WATERFALL = [
    MODELS.BRAIN_REASONING, // DeepSeek R1 via OpenRouter
    MODELS.GROQ_GPT_OSS, // 120B Reasoning
    MODELS.BRAIN_ELITE, // Gemini 3 Pro (1.5K RPD)
    MODELS.BRAIN_PRO, // Gemini 2 Pro Exp (1.5K RPD)
    MODELS.GROQ_COMPOUND,
    MODELS.LOGIC_DEEPSEEK,
    MODELS.GROQ_QWEN_3,
    MODELS.BRAIN_FLASH_20, // 1.5K RPD backup
    MODELS.GEMMA_3_27B
];

export const VISION_WATERFALL = [
    MODELS.VISION_GEMINI, // 3 Flash
    MODELS.BRAIN_FLASH_20, // 2 Flash (1.5K RPD)
    MODELS.ROBOTICS_ER, 
    MODELS.NANO_BANANA,
    MODELS.GROQ_LLAMA_4_MAVERICK, // Multimodal Llama
    MODELS.GEMMA_3_4B
];

export const PHYSICS_WATERFALL = [
    MODELS.BRAIN_REASONING, 
    MODELS.GROQ_GPT_OSS,
    MODELS.PHYSICS_LIQUID,
    MODELS.BRAIN_FLASH_20,
    MODELS.BRAIN_PRO,
    MODELS.GEMMA_3_27B
];

export const CONTEXT_WATERFALL = [
    MODELS.BRAIN_LITE, // 2 Flash Lite (1.5K RPD)
    MODELS.GROQ_KIMI_K2, 
    MODELS.BRAIN_FLASH_20,
    MODELS.BRAIN_LITE_25,
    MODELS.GEMMA_3_12B
];

export const REFLEX_WATERFALL = [
    MODELS.GROQ_LLAMA_4_SCOUT, // <100ms
    MODELS.BRAIN_FLASH_20, // High RPD Flash
    MODELS.BRAIN_FLASH_3, 
    MODELS.GEMMA_3_4B, 
    MODELS.REFLEX_NVIDIA,
    MODELS.GROQ_LLAMA_31_8B
];

export const SENTINEL_WATERFALL = [
    MODELS.GROQ_LLAMA_31_8B, // 14.4K RPD
    MODELS.BRAIN_LITE, // 1.5K RPD
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
