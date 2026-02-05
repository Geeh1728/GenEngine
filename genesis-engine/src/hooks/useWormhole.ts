import { blackboard } from '@/lib/genkit/context';
import { normalizeEntities } from '@/lib/simulation/normalizer';
import { encodeWorld } from '@/lib/utils/wormhole';

/**
 * useWormhole: The Sharing Hook
 * Captures the current digital reality and compresses it into a cold-storage URL.
 */
export function useWormhole() {
    const generateWormholeURL = async () => {
        const ctx = blackboard.getContext();
        const state = ctx.currentWorldState;

        if (!state) {
            console.warn('[Wormhole] No world state found to capture.');
            return null;
        }

        // Capture and normalize (The Rosetta Protocol)
        const normalizedEntities = normalizeEntities(state.entities || []);
        const normalizedState = {
            ...state,
            entities: normalizedEntities
        };

        const encodedString = await encodeWorld(normalizedState);
        if (!encodedString) return null;

        // Construct the sovereign URL
        const url = new URL(window.location.origin + window.location.pathname);
        url.searchParams.set('w', encodedString);

        return url.toString();
    };

    return { generateWormholeURL };
}
