'use client';

import { generateLocalEmbedding } from './localEmbeddings';

/**
 * THE HYBRID EMBEDDING SWITCH
 * Objective: Use high-quality Google embeddings when online, 
 * but switch to local transformers.js when offline or throttled.
 */

export async function getEmbedding(text: string, onProgress?: (progress: number) => void): Promise<number[] | null> {
    const isOffline = typeof window !== 'undefined' && !navigator.onLine;

    if (isOffline) {
        console.log("[Embeddings] Offline detected. Calling local transformer...");
        return generateLocalEmbedding(text, onProgress);
    }

    try {
        console.log("[Embeddings] Online. Attempting Cloud Embedding...");
        // ... (existing cloud logic)
        // This calls our internal API which uses Google's text-embedding-004
        const response = await fetch('/api/embeddings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
        });

        if (!response.ok) {
            throw new Error(`Cloud API failed with status ${response.status}`);
        }

        const data = await response.json();
        return data.embedding;
    } catch (error) {
        console.warn("[Embeddings] Cloud Embedding failed. Falling back to local...", error);
        // Fallback to local model if API fails (429, 500, etc.)
        return generateLocalEmbedding(text);
    }
}

// Keep the old name for backward compatibility
export const getOfflineEmbedding = generateLocalEmbedding;