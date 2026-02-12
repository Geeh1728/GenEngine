'use client';

import { useCallback, useEffect } from 'react';
import { WorldState } from '@/lib/simulation/schema';
import { useGenesisStore } from '@/lib/store/GenesisContext';
import { GameAction } from '@/lib/multiplayer/GameState';
import { usePersistence } from './utils/usePersistence';
import { blackboard } from '@/lib/genkit/context';

// Local types to avoid server-side schema imports
interface WorldRule {
    id: string;
    rule: string;
    description: string;
    grounding_source?: string;
    isActive: boolean;
}

type ComplexityLevel = 'standard' | 'advanced' | 'quantum';

/**
 * useSimulationState: Centralized Physics/Logic Interface.
 * Refactored (v13.0 GOLD): Consumes the unified Reducer Context.
 */
export function useSimulationState() {
    const { state: gameState, dispatch } = useGenesisStore();
    const { worldState, selectedEntityId } = gameState;

    // --- IMMERSION: PERSISTENCE LAYER ---
    usePersistence(worldState, (state) => {
        if (state) dispatch({ type: 'SYNC_WORLD', payload: state });
    });

    // --- Quantum Bridge Sync ---
    useEffect(() => {
        if (worldState && Object.keys(worldState).length > 0) {
            blackboard.updateFromWorldState(worldState);
        }
    }, [worldState]);

    // --- ACTIONS ---

    const syncWorldState = useCallback((newState: WorldState | null) => {
        if (!newState) {
            dispatch({ type: 'RESET_SIMULATION' });
        } else {
            dispatch({ type: 'SYNC_WORLD', payload: newState });
        }
    }, [dispatch]);

    const dispatchAction = useCallback((action: GameAction) => {
        dispatch(action);
    }, [dispatch]);

    const fetchWorldState = useCallback(async (
        topic: string,
        rules: WorldRule[],
        complexity: ComplexityLevel
    ) => {
        try {
            const response = await fetch('/api/world-state', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic: topic || 'Quantum Physics',
                    rules,
                    complexity
                }),
            });
            if (response.ok) {
                const data = await response.json();
                dispatch({ type: 'SYNC_WORLD', payload: data });
                return data;
            }
        } catch (err) {
            console.error('Failed to fetch world state', err);
            throw err;
        }
    }, [dispatch]);

    const resetSimulation = useCallback(() => {
        dispatch({ type: 'RESET_SIMULATION' });
    }, [dispatch]);

    return {
        gameState,
        worldState,
        selectedEntityId,
        dispatch,
        syncWorldState,
        dispatchAction,
        fetchWorldState,
        resetSimulation
    };
}
