import { incrementApiUsage, getApiUsage } from '../db/pglite';

/**
 * MODULE Q: DYNAMIC QUOTA ORACLE (v22.0)
 * Objective: Real-time API budget management and predictive pivoting.
 */

export interface QuotaState {
    remaining: number;
    limit: number;
    resetAt: number;
}

class QuotaOracle {
    private static instance: QuotaOracle;
    private memoryQuota: Map<string, QuotaState> = new Map();

    private constructor() {}

    public static getInstance(): QuotaOracle {
        if (!QuotaOracle.instance) {
            QuotaOracle.instance = new QuotaOracle();
        }
        return QuotaOracle.instance;
    }

    /**
     * Updates the local oracle with data from API headers.
     */
    public recordTelemetry(modelId: string, headers: Headers) {
        const remaining = parseInt(headers.get('x-ratelimit-remaining') || '-1');
        const limit = parseInt(headers.get('x-ratelimit-limit') || '-1');
        const resetSeconds = parseInt(headers.get('x-ratelimit-reset') || '0');

        if (remaining !== -1) {
            this.memoryQuota.set(modelId, {
                remaining,
                limit,
                resetAt: Date.now() + (resetSeconds * 1000)
            });
            console.log(`[Oracle] ${modelId} Quota: ${remaining}/${limit}`);
        }
    }

    /**
     * Checks if a model is "Safe" to use.
     */
    public async isSafe(modelId: string): Promise<boolean> {
        // 1. Check Memory Cache (Latest Header Data)
        const state = this.memoryQuota.get(modelId);
        const buffer = modelId.includes('groq') ? 10 : 5;
        if (state && state.remaining < buffer) {
            if (Date.now() < state.resetAt) {
                console.warn(`[Oracle] ${modelId} is throttled (Memory Check - Buffer: ${buffer}).`);
                return false;
            }
        }

        // 2. Check Local DB Persistence (RPD Safety)
        const usage = await getApiUsage(modelId);
        
        // DYNAMIC THRESHOLDS (v23.0 - v32.0 Groq Shift)
        let SAFE_THRESHOLD = 1400; // Default Flash
        if (modelId.includes('pro')) SAFE_THRESHOLD = 45;
        if (modelId.includes('gemma-3')) SAFE_THRESHOLD = 14000; // Nuclear 14.4K RPD
        if (modelId.includes('robotics-er')) SAFE_THRESHOLD = 18;
        if (modelId.includes('tts')) SAFE_THRESHOLD = 8;

        // GROQ LPU LIMITS (v32.0)
        if (modelId.includes('groq')) {
            SAFE_THRESHOLD = 1000; // Default Groq Reasoning
            if (modelId.includes('instant')) SAFE_THRESHOLD = 14400; // Sentinel 14.4K RPD
        }

        if (usage >= SAFE_THRESHOLD) {
            console.warn(`[Oracle] ${modelId} reached RPD limit: ${usage}/${SAFE_THRESHOLD}`);
            return false;
        }

        return true;
    }

    /**
     * Logs successful usage.
     */
    public async recordSuccess(modelId: string) {
        await incrementApiUsage(modelId);
    }
}

export const quotaOracle = QuotaOracle.getInstance();
