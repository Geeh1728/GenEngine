/**
 * SHARED MODEL IDENTIFIERS
 * Objective: Define model names in a plain TS file that is safe for both
 * Client and Server components (prevents 'Module not found: Can't resolve net/tls/http2' errors).
 */

export const MODELS = {
    BRAIN_PRIMARY: 'googleai/gemini-3-flash',
    BRAIN_WORKHORSE: 'googleai/gemma-3-27b',
    BRAIN_REFLEX: 'googleai/gemma-3-4b',
    BRAIN_AUDIO: 'googleai/gemini-2.5-flash-native-audio-dialog',
    BRAIN_ROBOTICS: 'googleai/gemini-robotics-er-1.5-preview',
    SWARM_REVIEWER: 'moonshotai/kimi-k2.5:free',
    EMBEDDING_MODEL: 'googleai/text-embedding-004',
    MISTRAL_EMBED: 'mistralai/mistral-embed:free'
};
