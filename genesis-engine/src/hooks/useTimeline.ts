'use client';

import { useCallback, useEffect } from 'react';
import { useGenesisStore } from '@/lib/store/GenesisContext';
import { SpeculativeGhost } from '@/lib/simulation/reflex-predictor';
import { sfx } from '@/lib/sound/SoundManager';

/**
 * MODULE P-G: REALITY BRANCHING & AETHERIC RECALL (v50.0 GOLD)
 * Objective: Manage multiple branching timelines and 4D time-travel.
 * Mechanism: Link Tesseract W-axis to the world history buffer.
 */
export function useTimeline() {
    console.log("[Timeline] Initializing v50.0 hook...");
    const { state, dispatch } = useGenesisStore();
    const { worldHistory, historyIndex, wRotation, worldState } = state;

    /**
     * Records the current world state into history.
     */
    const recordHistory = useCallback(() => {
        if (worldState) {
            dispatch({ type: 'RECORD_HISTORY', payload: JSON.parse(JSON.stringify(worldState)) });
        }
    }, [worldState, dispatch]);

    /**
     * Travels to a specific point in the timeline.
     */
    const travelTo = useCallback((index: number) => {
        dispatch({ type: 'TRAVEL_TO', payload: index });
    }, [dispatch]);

    /**
     * v50.0 AETHERIC RECALL: Link W-axis to history.
     * Scrubbing the 4D rotation physically 'Peels Back' time.
     */
    useEffect(() => {
        if (worldHistory.length < 2) return;

        // Map wRotation (0 to 2*PI) to historyIndex
        const normalizedW = ((wRotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const targetIndex = Math.floor((normalizedW / (Math.PI * 2)) * worldHistory.length);
        
        if (targetIndex !== historyIndex && targetIndex < worldHistory.length) {
            travelTo(targetIndex);
        }
    }, [wRotation, worldHistory.length, travelTo]);

    /**
     * Pins a speculative branch as the current reality.
     */
    const pinBranch = useCallback((ghost: SpeculativeGhost) => {
        if (!worldState) return;

        console.log(`[Timeline] Snapping to branch: ${ghost.label}`);
        sfx.playSuccess();

        const nextWorldState = {
            ...worldState,
            entities: worldState.entities?.map(e => {
                const updated = ghost.entities.find((ge: any) => ge.id === e.id);
                if (updated) {
                    return { ...e, ...updated };
                }
                return e;
            }),
            scenario: `[RESTORED]: ${ghost.label}`
        };

        dispatch({
            type: 'SYNC_WORLD',
            payload: nextWorldState
        });

        dispatch({
            type: 'ADD_MISSION_LOG',
            payload: {
                agent: 'Conductor',
                message: `Reality Stabilized on branch: "${ghost.label}". Causal loop closed.`,
                type: 'SUCCESS'
            }
        });
    }, [worldState, dispatch]);

    return {
        pinBranch,
        recordHistory,
        travelTo,
        history: worldHistory,
        currentIndex: historyIndex
    };
}
