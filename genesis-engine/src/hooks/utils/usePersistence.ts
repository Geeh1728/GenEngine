import { useEffect, useRef } from 'react';
import { WorldState } from '@/lib/simulation/schema';

const STORAGE_KEY = 'GENESIS_WORLD_STATE';
const DEBOUNCE_MS = 1000;

export function usePersistence(
    worldState: WorldState | null, 
    setWorldState: (state: WorldState | null) => void
) {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Load on Mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed && !worldState) {
                    console.log("[Persistence] Rehydrating World State");
                    setWorldState(parsed);
                }
            } catch (e) {
                console.error("[Persistence] Corrupt State", e);
            }
        }
    }, [setWorldState, worldState]);

    // Save on Change (Debounced)
    useEffect(() => {
        if (worldState) {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            timeoutRef.current = setTimeout(() => {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(worldState));
            }, DEBOUNCE_MS);
        }

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [worldState]);
}