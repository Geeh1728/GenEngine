'use client';

/**
 * THE LOCAL EMBEDDER (Xenova/Transformers.js)
 * Objective: True Offline vectorization in the browser.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pipelineInstance: any = null;
let modelLoadingProgress: number = 0;

export function getModelLoadingProgress() {
    return modelLoadingProgress;
}

export async function generateLocalEmbedding(text: string, onProgress?: (progress: number) => void): Promise<number[] | null> {
    if (typeof window === 'undefined') return null;

    try {
        if (!pipelineInstance) {
            // Lazy load the transformers library
            const { pipeline, env } = await import('@xenova/transformers');
            
            // Optimization for browser: use local cache
            env.allowRemoteModels = true;
            env.useBrowserCache = true;

            console.log("[LocalEmbeddings] Loading model: all-MiniLM-L6-v2...");
            
            pipelineInstance = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                progress_callback: (data: any) => {
                    if (data.status === 'progress') {
                        modelLoadingProgress = data.progress;
                        if (onProgress) onProgress(data.progress);
                        console.log(`[LocalEmbeddings] Loading: ${Math.round(data.progress)}%`);
                    }
                }
            });
            console.log("[LocalEmbeddings] Model loaded successfully.");
            modelLoadingProgress = 100;
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
