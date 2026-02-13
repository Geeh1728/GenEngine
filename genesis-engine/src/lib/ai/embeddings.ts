'use client';

import { generateLocalEmbedding } from './localEmbeddings';
import { getApiUsage, incrementApiUsage } from '@/lib/db/pglite';

// Local constants to avoid genkit/models import which pulls server code
const EMBEDDING_MODEL = 'googleai/text-embedding-004';
const MISTRAL_EMBED = 'openrouter/mistralai/mistral-embed';

/**
 * THE PROTECTED HYBRID EMBEDDING SWITCH (v7.5)
 * Objective: Tiered Retrieval with Mistral-Embed fallback.
 * 1. Primary: Google text-embedding-004.
 * 2. Specialist: Mistral-Embed (Math/Physics).
 * 3. Fallback: Local Transformers.js.
 */

export async function getEmbedding(text: string, onProgress?: (progress: number) => void): Promise<number[] | null> {
    const isOffline = typeof window !== 'undefined' && !navigator.onLine;

    // 1. HARD OFFLINE: Always local
    if (isOffline) {
        console.log("[Embeddings] Offline detected. Calling local transformer...");
        return generateLocalEmbedding(text, onProgress);
    }

    // 2. PROTECTED LOGIC: Tiered Arbitrage
    const charCount = text.length;
    const usage = await getApiUsage(EMBEDDING_MODEL);
    
    // Check for Math Specialist trigger
    const hasMathSymbols = /[+\-=/*^√πθΩΣΔλ]/.test(text);

    // Rule A: Small notes/Diary entries go local (R0 cost)
    if (charCount < 500 && !hasMathSymbols) {
        console.log("[Embeddings] Small chunk (<500 chars). Arbitraging to local model.");
        return generateLocalEmbedding(text, onProgress);
    }

    try {
        // Strategy: If math is detected, go straight to Mistral (Tier 2)
        // If quota is near, switch to Mistral (Tier 2)
        let preferredModel = EMBEDDING_MODEL;
        let isMathReroute = false;

        if (hasMathSymbols) {
            console.log("[Embeddings] Math symbols detected. Specialist Reroute: Mistral-Embed.");
            preferredModel = MISTRAL_EMBED;
            isMathReroute = true;
        } else if (usage > 850) {
            console.warn("[Embeddings] Google Quota Near Limit. Switching to Mistral Specialist...");
            preferredModel = MISTRAL_EMBED;
        }

        console.log(`[Embeddings] Calling Cloud Embedding (${preferredModel})...`);
        
        const response = await fetch('/api/embeddings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, model: preferredModel }),
        });

        if (!response.ok) {
            throw new Error(`Cloud API failed with status ${response.status}`);
        }

        const data = await response.json();
        
        // Log cloud usage only for Google
        if (preferredModel === EMBEDDING_MODEL) {
            await incrementApiUsage(EMBEDDING_MODEL);
        }
        
        return data.embedding;
    } catch (error) {
        console.warn("[Embeddings] Cloud Embedding failed. Falling back to local...", error);
        return generateLocalEmbedding(text);
    }
}

// Keep the old name for backward compatibility
export const getOfflineEmbedding = generateLocalEmbedding;
