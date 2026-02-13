'use client';

import { useCallback } from 'react';
import { useGenesisStore } from '@/lib/store/GenesisContext';
import { WorldState } from '@/lib/simulation/schema';
import { saveSimulationToDB } from '@/lib/db/pglite';
import { p2p } from '@/lib/multiplayer/P2PConnector';

/**
 * Module L: THE GENESIS STORE (Nervous System) - V13.0 GOLD
 * Objective: Centralized access to the unified Global State.
 * This hook now correctly consumes the GenesisContext instead of creating independent state.
 */
export function useGenesisStoreHook() {
    const { state, dispatch } = useGenesisStore();

    /**
     * Updates the global world state from an AI response or P2P sync.
     */
    const setWorldState = useCallback((worldState: WorldState) => {
        dispatch({ type: 'SYNC_WORLD', payload: worldState });
    }, [dispatch]);

    /**
     * Saves a specific simulation configuration (DNA) for persistence.
     */
    const saveSimulationState = useCallback(async (id: string, type: string, dna: unknown) => {
        await saveSimulationToDB(id, type, dna);
    }, []);

    /**
     * Module L: P2P Synchronization (Ghost Mesh)
     * Objective: Establish real-time WebRTC link for collaborative simulation.
     */
    const sync = useCallback(async (roomId?: string) => {
        const id = roomId || new URLSearchParams(window.location.search).get('s') || 'default-room';
        console.log(`[Genesis Store] Establishing Ghost Mesh Link: ${id}`);
        
        await p2p.connect(id);
        
        // Subscribe to remote updates
        p2p.onSync((remoteData) => {
            if (remoteData.currentWorldState) {
                dispatch({ type: 'SYNC_WORLD', payload: remoteData.currentWorldState });
            }
        });
    }, [dispatch]);

    /**
     * Unlocks the full HUD (Jedi Mode).
     */
    const unlockHUD = useCallback(() => {
        dispatch({ type: 'UNLOCK_HUD' });
    }, [dispatch]);

    return {
        state,
        worldState: state.worldState,
        players: state.players,
        unlockedHUD: state.unlockedHUD,
        dispatch,
        setWorldState,
        saveSimulationState,
        sync,
        unlockHUD
    };
}

// Rename for compatibility while maintaining structural integrity
export { useGenesisStoreHook as useGenesisStore };
