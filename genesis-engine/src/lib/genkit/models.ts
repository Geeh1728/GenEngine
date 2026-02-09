/**
 * ULTIMATE SWARM MODEL IDENTIFIERS (v23.5 Hardened)
 * Objective: PhD-Level Specialization with Verified Free Swarm.
 */

export const MODELS = {
    // ELITE THINKERS (PhD-Level Reasoning)
    BRAIN_ELITE: 'googleai/gemini-3-pro-preview', // 429: Keep
    BRAIN_PRO: 'googleai/gemini-2.5-pro',         // 429: Keep
    BRAIN_DYNAMIC: 'googleai/gemini-exp-1206',    // 429: Keep
    
    // PERFORMANCE HEADS (The Workhorses)
    BRAIN_FLASH_3: 'googleai/gemini-3-flash-preview',
    BRAIN_FLASH_25: 'googleai/gemini-2.5-flash',
    BRAIN_FLASH_20: 'googleai/gemini-2.0-flash-001',
    
    // SCALE & BULK (High-Throughput / High-RPD)
    BRAIN_LITE: 'googleai/gemini-2.0-flash-lite',
    
    // ROBOTICS & SPATIAL (Robotics-ER)
    ROBOTICS_ER: 'googleai/gemini-robotics-er-1.5-preview',
    
    // GEMMA 3 SERIES (Nuclear Power: 14.4K RPD)
    GEMMA_3_27B: 'googleai/gemma-3-27b-it',
    GEMMA_3_12B: 'googleai/gemma-3-12b-it',
    GEMMA_3_4B: 'googleai/gemma-3-4b-it',
    GEMMA_3_2B: 'googleai/gemma-3n-e2b-it', // Verified functional
    GEMMA_3_1B: 'googleai/gemma-3-1b-it',
    
    // MULTIMODAL & VISION SPECIALISTS
    VISION_GEMINI: 'googleai/gemini-2.5-flash-image',
    
    // AUDIO & REAL-TIME (Anchor for Live API - UNLIMITED)
    BRAIN_AUDIO: 'googleai/gemini-2.5-flash-native-audio-latest',
    
    // LOGIC SPECIALISTS (OpenRouter Free Swarm)
    LOGIC_DEEPSEEK: 'openrouter/deepseek-r1',
    LOGIC_QWEN_CODER: 'openrouter/qwen-coder', // 429: Keep
    LOGIC_FREE_ROUTER: 'openrouter/free-router',
    
    // PHYSICS & REFLEXES
    PHYSICS_LIQUID: 'openrouter/liquid-lfm',
    REFLEX_NVIDIA: 'openrouter/nemotron',
    
    // EMBEDDINGS (Validated via separate path)
    EMBEDDING_MODEL: 'googleai/text-embedding-004',
    EMBEDDING_1: 'googleai/gemini-embedding-001',
    MISTRAL_EMBED: 'mistralai/mistral-embed:free',
};

// CASCADING WATERFALLS (Semantic Routing)

export const LOGIC_WATERFALL = [
    MODELS.BRAIN_FLASH_3,
    MODELS.LOGIC_DEEPSEEK,
    MODELS.BRAIN_PRO,
    MODELS.LOGIC_QWEN_CODER,
    MODELS.LOGIC_FREE_ROUTER,
    MODELS.GEMMA_3_27B,
    MODELS.GEMMA_3_2B
];

export const VISION_WATERFALL = [
    MODELS.ROBOTICS_ER, 
    MODELS.VISION_GEMINI,
    MODELS.BRAIN_FLASH_3,
    MODELS.GEMMA_3_4B
];

export const PHYSICS_WATERFALL = [
    MODELS.PHYSICS_LIQUID,
    MODELS.BRAIN_FLASH_25,
    MODELS.LOGIC_DEEPSEEK,
    MODELS.GEMMA_3_27B,
    MODELS.GEMMA_3_2B
];

export const CONTEXT_WATERFALL = [
    MODELS.BRAIN_LITE, 
    MODELS.BRAIN_FLASH_3,
    MODELS.GEMMA_3_12B,
    MODELS.GEMMA_3_2B
];

export const REFLEX_WATERFALL = [
    MODELS.GEMMA_3_4B, 
    MODELS.GEMMA_3_2B,
    MODELS.GEMMA_3_1B,
    MODELS.REFLEX_NVIDIA,
    MODELS.BRAIN_FLASH_3
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