import { useEffect, useRef } from 'react';
import { WorldState } from '@/lib/simulation/schema';

const STORAGE_KEY = 'GENESIS_WORLD_STATE';
const DEBOUNCE_MS = 1000;

export function usePersistence(
    worldState: WorldState | null, 
    setWorldState: (state: WorldState | null) => void,
    lastInteractionId?: string | null,
    setInteractionId?: (id: string | null) => void
) {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Load on Mount: Rehydrate Interaction ID for Brain Memory
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.lastInteractionId && setInteractionId) {
                    console.log("[Hippocampus] Rehydrating Interaction ID:", parsed.lastInteractionId);
                    setInteractionId(parsed.lastInteractionId);
                }
            } catch (e) {
                console.error("[Persistence] Corrupt State", e);
            }
        }
    }, [setInteractionId]);

    // Save on Change (Debounced)
    useEffect(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            const dataToSave = {
                worldState,
                lastInteractionId
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
        }, DEBOUNCE_MS);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [worldState, lastInteractionId]);
}