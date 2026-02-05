'use client';

import { useState, useCallback, useRef } from 'react';
import { WorldState } from '@/lib/simulation/schema';

/**
 * useTimeline: The Neural Snapshot Engine (v9.0)
 * Allows "Time Travel" and "Reality Branching" in simulations.
 */
export function useTimeline(initialState?: WorldState) {
    const [snapshots, setSnapshots] = useState<WorldState[]>(initialState ? [initialState] : []);
    const [currentIndex, setCurrentIndex] = useState(0);
    const maxSnapshots = 20;

    const takeSnapshot = useCallback((state: WorldState) => {
        setSnapshots(prev => {
            // Only take snapshot if it's substantially different from the last one
            const last = prev[prev.length - 1];
            if (last && JSON.stringify(last.entities) === JSON.stringify(state.entities)) {
                return prev;
            }
            
            const next = [...prev, state];
            if (next.length > maxSnapshots) next.shift();
            setCurrentIndex(next.length - 1);
            return next;
        });
    }, []);

    const travelTo = useCallback((index: number): WorldState | null => {
        if (index < 0 || index >= snapshots.length) return null;
        setCurrentIndex(index);
        return snapshots[index];
    }, [snapshots]);

    const branch = useCallback((index: number, name: string): WorldState | null => {
        const state = travelTo(index);
        if (!state) return null;

        // Create a new "Reality" from the snapshot
        const branchedState = {
            ...state,
            scenario: `${state.scenario} (Branch: ${name})`,
            description: `Branched from timeline t-${snapshots.length - index}`
        };

        // Reset timeline to this branch
        setSnapshots([branchedState]);
        setCurrentIndex(0);
        return branchedState;
    }, [snapshots.length, travelTo]);

    return {
        snapshots,
        currentIndex,
        takeSnapshot,
        travelTo,
        branch,
        canRewind: currentIndex > 0,
        canForward: currentIndex < snapshots.length - 1
    };
}
