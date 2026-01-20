import { useReducer, useCallback } from 'react';
import { gameReducer, initialGameState } from '@/lib/multiplayer/GameState';
import { WorldState } from '@/lib/simulation/schema';
import { saveSimulationToDB } from '@/lib/db/pglite';

/**
 * Module L: THE GENESIS STORE (Nervous System)
 * Central hook for managing client-side simulation state.
 */
export function useGenesisStore() {
    const [state, dispatch] = useReducer(gameReducer, initialGameState);

    /**
     * Updates the global world state from an AI response or P2P sync.
     */
    const setWorldState = useCallback((worldState: WorldState) => {
        dispatch({ type: 'SYNC_WORLD', payload: worldState });
    }, []);

    /**
     * Saves a specific simulation configuration (DNA) for persistence.
     */
    const saveSimulationState = useCallback(async (id: string, type: string, dna: unknown) => {
        await saveSimulationToDB(id, type, dna);
    }, []);

    /**
     * Future stub for WebRTC/P2P Synchronization.
     */
    const sync = useCallback(async () => {
        console.log('[Genesis Store] Sync requested (Stub)');
        // Implementation for Module L (Multiplayer) goes here
    }, []);

    return {
        state,
        worldState: state.worldState,
        players: state.players,
        dispatch,
        setWorldState,
        saveSimulationState,
        sync
    };
}

export type GenesisStore = ReturnType<typeof useGenesisStore>;
