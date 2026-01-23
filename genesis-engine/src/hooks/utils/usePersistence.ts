import { useEffect } from 'react';
import { WorldState } from '@/lib/simulation/schema';

const STORAGE_KEY = 'GENESIS_WORLD_STATE';

export function usePersistence(
    worldState: WorldState | null, 
    setWorldState: (state: WorldState | null) => void
) {
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
    }, []);

    // Save on Change
    useEffect(() => {
        if (worldState) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(worldState));
        }
    }, [worldState]);
}
