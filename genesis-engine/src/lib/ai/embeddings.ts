'use client';

let pipe: any = null;

export async function getOfflineEmbedding(text: string) {
  if (typeof window === 'undefined') return null;

  try {
    if (!pipe) {
      // Load transformers.js via CDN
      const { pipeline } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2');
      pipe = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }

    const output = await pipe(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data) as number[];
  } catch (error) {
    console.error("Offline Embedding Error:", error);
    return null;
  }
}

export async function getEmbedding(text: string) {
  // Check online status
  if (typeof window !== 'undefined' && !navigator.onLine) {
    console.log("Offline detected. Using local transformers.js");
    return getOfflineEmbedding(text);
  }

  // Fallback to API call
  try {
    const response = await fetch('/api/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    const data = await response.json();
    return data.embedding;
  } catch (error) {
    console.log("API Embedding failed. Falling back to offline.");
    return getOfflineEmbedding(text);
  }
}
