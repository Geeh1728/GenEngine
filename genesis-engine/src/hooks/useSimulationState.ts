import { useReducer, useCallback, useEffect } from 'react';
import { WorldState } from '@/lib/simulation/schema';
import { gameReducer, initialGameState, GameAction } from '@/lib/multiplayer/GameState';
import { usePersistence } from './utils/usePersistence';
import { blackboard } from '@/lib/genkit/context';
import { ComplexityLevel, WorldRuleSchema } from '@/lib/genkit/schemas';
import { z } from 'genkit';

type WorldRule = z.infer<typeof WorldRuleSchema>;

/**
 * useSimulationState: Manages the core physics/logic state of the world.
 * Decoupled from UI and Gamification.
 */
export function useSimulationState() {
    // --- KINETIC CORE: REDUCER STATE ---
    const [gameState, dispatch] = useReducer(gameReducer, initialGameState);
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

    // Direct Dispatch Bridge
    const syncWorldState = useCallback((newState: WorldState | null) => {
        if (!newState) {
            dispatch({ type: 'RESET_SIMULATION' });
        } else {
            dispatch({ type: 'SYNC_WORLD', payload: newState });
        }
    }, []);

    const dispatchAction = useCallback((action: GameAction) => {
        dispatch(action);
    }, []);

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
    }, []);

    const resetSimulation = useCallback(() => {
        dispatch({ type: 'RESET_SIMULATION' });
    }, []);

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
