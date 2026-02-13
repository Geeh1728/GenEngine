import LZString from 'lz-string';

/**
 * Wormhole Utility (v17.0 - Neural Fossil Upgrade)
 * Compressed WorldState serialization with Merkle-Logic Hashing.
 */

// Simple SHA-256 implementation using Web Crypto API (works in Edge/Node 18+)
export async function generateNeuralFossil(state: Record<string, unknown>): Promise<string> {
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
        // v45.0: Ensure Predictive Ghost Data is preserved in the temporal hash
        const payload = {
            ...state,
            _temporal_anchor: Date.now(),
            _has_ghosts: !!(state.dream_ghosts?.length || state.omegaPoint?.length)
        };

        const json = JSON.stringify(payload);
        const compressed = LZString.compressToEncodedURIComponent(json);
        
        // Generate Neural Fossil
        const fossil = await generateNeuralFossil(payload);
        
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

        

        /**

         * MODULE Σ: THE COMPOSER'S FOSSIL (v60.0)

         * Converts a 3D WorldState into a musical Score.

         * Result: JSON mapping of frequencies, amplitudes, and spatial coordinates.

         */

        export function generateMusicalScore(state: any): Record<string, any> {

            if (!state || !state.entities) return { version: '60.0', tracks: [] };

        

            const score = {

                version: '60.0',

                timestamp: Date.now(),

                resonance: state._resonanceBalance || 0.5,

                tracks: state.entities.map((e: any) => {

                    // Extract frequency from frequency_map or harmonic data

                    const freq = e.frequency_map?.[0]?.note || e.harmonic?.frequency || 'C4';

                    const amplitude = e.physics?.mass ? Math.min(e.physics.mass / 10, 1.0) : 0.5;

                    

                    return {

                        id: e.id,

                        name: e.name || 'Instrument',

                        position: e.position,

                        frequency: freq,

                        amplitude,

                        texture: e.visual?.texture || e.texturePrompt,

                        spatial_pan: Math.tanh(e.position.x / 10) // Map X position to panning

                    };

                })

            };

        

            console.log(`[Wormhole] Neural Score Materialized: ${score.tracks.length} tracks.`);

            return score;

        }

        
