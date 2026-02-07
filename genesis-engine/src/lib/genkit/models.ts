/**
 * SHARED MODEL IDENTIFIERS (v11.0 Platinum Swarm)
 * Objective: Define model names and Cascading Waterfalls for 100% uptime.
 */

export const MODELS = {
    // SINGLE IDENTIFIERS
    BRAIN_AUDIO: 'googleai/gemini-2.0-flash-exp', // Latest multimodal live
    EMBEDDING_MODEL: 'googleai/text-embedding-004',
    MISTRAL_EMBED: 'mistralai/mistral-embed:free',
};

// CASCADING WATERFALLS (Priority Sequence)
export const LOGIC_WATERFALL = [
    'openai/o3-mini', 
    'googleai/gemini-3-flash-exp', // v21.0 Hardened
    'googleai/gemini-2.0-pro-exp-02-05',
    'googleai/gemini-2.0-flash-001',
    'googleai/gemini-1.5-pro'
];

export const VISION_WATERFALL = [
    'googleai/gemini-2.0-flash-001',
    'openai/gpt-4o-mini'
];

export const PHYSICS_WATERFALL = [
    'googleai/gemini-2.0-flash-001',
    'openai/gpt-4o-mini'
];

export const CONTEXT_WATERFALL = [
    'googleai/gemini-2.0-flash-001',
    'openai/gpt-4o-mini'
];

export const REFLEX_WATERFALL = [
    'openai/gpt-4o-mini'
];

// LEGACY COMPATIBILITY (Maps old keys to the top of the waterfalls)
export const LEGACY_MODELS = {
    BRAIN_PRIMARY: LOGIC_WATERFALL[1],
    BRAIN_WORKHORSE: LOGIC_WATERFALL[2],
    BRAIN_REFLEX: REFLEX_WATERFALL[0],
    BRAIN_ROBOTICS: VISION_WATERFALL[1],
    SWARM_REVIEWER: CONTEXT_WATERFALL[1],
    VISION_PRECISION: VISION_WATERFALL[0],
    PHYSICS_DYNAMIC: PHYSICS_WATERFALL[0],
    MOBILE_REFLEX: REFLEX_WATERFALL[0],
    CONTEXT_LIBRARIAN: CONTEXT_WATERFALL[1]
};