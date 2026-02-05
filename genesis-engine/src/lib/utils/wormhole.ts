import LZString from 'lz-string';

/**
 * Wormhole Utility (v17.0 - Neural Fossil Upgrade)
 * Compressed WorldState serialization with Merkle-Logic Hashing.
 */

// Simple SHA-256 implementation using Web Crypto API (works in Edge/Node 18+)
export async function generateNeuralFossil(state: any): Promise<string> {
    try {
        // 1. Normalize State (Rosetta Normalization)
        // We ensure keys are sorted so the hash is deterministic
        const normalized = JSON.stringify(state, Object.keys(state).sort());
        
        // 2. Generate Hash
        const msgBuffer = new TextEncoder().encode(normalized);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        return hashHex;
    } catch (error) {
        console.error('[Wormhole] Fossil generation failed:', error);
        return 'fossil_error';
    }
}

export const encodeWorld = async (state: any): Promise<string> => {
    try {
        const json = JSON.stringify(state);
        const compressed = LZString.compressToEncodedURIComponent(json);
        
        // Generate Neural Fossil
        const fossil = await generateNeuralFossil(state);
        
        // Append Fossil to string (e.g., "COMPRESSED_DATA.FOSSIL_HASH")
        return `${compressed}.${fossil.substring(0, 16)}`; // Short hash for URL safety
    } catch (error) {
        console.error('[Wormhole] Encoding failed:', error);
        return '';
    }
};

export const decodeWorld = async (str: string): Promise<any | null> => {
    try {
        // Split Fossil
        const parts = str.split('.');
        const compressed = parts[0];
        const providedFossil = parts[1]; // might be undefined for legacy links

        const decompressed = LZString.decompressFromEncodedURIComponent(compressed);
        if (!decompressed) return null;
        
        const state = JSON.parse(decompressed);

        // Verify Fossil if present
        if (providedFossil) {
            const calculatedFossil = await generateNeuralFossil(state);
            if (calculatedFossil.substring(0, 16) !== providedFossil) {
                console.warn('[Wormhole] ⚠️ REALITY CORRUPTION DETECTED. Hash mismatch.');
                // In v17.0, we might reject this, but for now we warn.
                state.isCorrupted = true;
            }
        }

        return state;
    } catch (error) {
        console.error('[Wormhole] Decoding failed:', error);
        return null;
    }
};