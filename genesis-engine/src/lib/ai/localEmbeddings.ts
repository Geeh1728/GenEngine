'use client';

/**
 * THE LOCAL EMBEDDER (Xenova/Transformers.js)
 * Objective: True Offline vectorization in the browser.
 */

let pipelineInstance: any = null;

export async function generateLocalEmbedding(text: string): Promise<number[] | null> {
    if (typeof window === 'undefined') return null;

    try {
        if (!pipelineInstance) {
            // Lazy load the transformers library
            const { pipeline, env } = await import('@xenova/transformers');
            
            // Optimization for browser: use local cache
            env.allowRemoteModels = true;
            env.useBrowserCache = true;

            console.log("[LocalEmbeddings] Loading model: all-MiniLM-L6-v2...");
            pipelineInstance = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
            console.log("[LocalEmbeddings] Model loaded successfully.");
        }

        // Generate embedding
        const output = await pipelineInstance(text, { 
            pooling: 'mean', 
            normalize: true 
        });

        // Convert the Tensor to a standard JS array
        return Array.from(output.data) as number[];
    } catch (error) {
        console.error("[LocalEmbeddings] Failed to generate local embedding:", error);
        return null;
    }
}
