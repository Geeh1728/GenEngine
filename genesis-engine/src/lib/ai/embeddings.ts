'use client';

import { generateLocalEmbedding } from './localEmbeddings';
import { getApiUsage, incrementApiUsage } from '@/lib/db/pglite';
import { MODELS } from '@/lib/genkit/models';

/**
 * THE PROTECTED HYBRID EMBEDDING SWITCH (v7.5)
 * Objective: Use high-quality Google embeddings for complex queries,
 * but aggressively protect the 1K RPD limit by forcing local mode
 * for small notes and high-volume background tasks.
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
    const usage = await getApiUsage(MODELS.EMBEDDING_MODEL);

    // Rule A: Small notes/Diary entries go local (R0 cost)
    if (charCount < 500) {
        console.log("[Embeddings] Small chunk (<500 chars). Arbitraging to local model.");
        return generateLocalEmbedding(text, onProgress);
    }

    // Rule B: Quota Protection (90% Threshold)
    if (usage > 900) {
        console.warn("[Embeddings] 1K RPD Quota Warning (900+ used). Forcing local mode for safety.");
        return generateLocalEmbedding(text, onProgress);
    }

    try {
        console.log(`[Embeddings] Online (${usage}/1000). Calling Cloud Embedding...`);
        
        const response = await fetch('/api/embeddings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
        });

        if (!response.ok) {
            throw new Error(`Cloud API failed with status ${response.status}`);
        }

        const data = await response.json();
        
        // Log cloud usage
        await incrementApiUsage(MODELS.EMBEDDING_MODEL);
        
        return data.embedding;
    } catch (error) {
        console.warn("[Embeddings] Cloud Embedding failed. Falling back to local...", error);
        return generateLocalEmbedding(text);
    }
}

// Keep the old name for backward compatibility
export const getOfflineEmbedding = generateLocalEmbedding;