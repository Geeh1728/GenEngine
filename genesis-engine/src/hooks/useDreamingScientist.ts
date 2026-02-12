'use client';

import { useEffect, useRef } from 'react';
import { useGenesisStore } from '@/lib/store/GenesisContext';
import { dreamerAgent } from '@/lib/genkit/agents/dreamer';
import { blackboard } from '@/lib/genkit/context';
import { sfx } from '@/lib/sound/SoundManager';
import { p2p } from '@/lib/multiplayer/P2PConnector';

/**
 * useDreamingScientist (v30.0)
 * Objective: Periodically trigger the Dreaming Scientist agent to propose new simulations.
 */
export function useDreamingScientist() {
    const { state, dispatch } = useGenesisStore();
    const isDreamingRef = useRef(false);

    useEffect(() => {
        if (!state.worldState || state.isProcessing) return;

        const interval = setInterval(async () => {
            const rules = blackboard.getContext().worldRules;
            if (rules.length === 0 || isDreamingRef.current) return;

            // 10% chance to dream every 60 seconds
            if (Math.random() > 0.1) return;

            console.log("[Dreamer] Astra is entering speculative REM state...");
            isDreamingRef.current = true;

            try {
                // v40.0: Randomly alternate between EXPLORE and EVOLVE
                const mode = Math.random() > 0.5 ? 'EVOLVE' : 'EXPLORE';
                
                const discovery = await dreamerAgent({
                    currentRules: rules,
                    currentWorldState: state.worldState || undefined,
                    mode
                });

                if (discovery) {
                    if (mode === 'EVOLVE' && discovery.dreamGhosts) {
                        // v50.0 HEGEMONY: Broadcast to mesh
                        p2p.broadcastAstraDreams(discovery.dreamGhosts);

                        dispatch({
                            type: 'SYNC_WORLD',
                            payload: {
                                ...state.worldState!,
                                dream_ghosts: discovery.dreamGhosts
                            }
                        });
                        dispatch({
                            type: 'ADD_MISSION_LOG',
                            payload: {
                                agent: 'Astra',
                                message: `I've evolved 3 optimized variants of your design. Check the violet dream-ghosts.`,
                                type: 'SUCCESS'
                            }
                        });
                    } else {
                        dispatch({
                            type: 'ADD_MISSION_LOG',
                            payload: {
                                agent: 'Astra',
                                message: `I've been thinking... ${discovery.reasoning} I've prepared a synthetic challenge for you: "${discovery.hypothesis}"`,
                                type: 'THOUGHT'
                            }
                        });

                        // Propose the new world state via a Challenge (Socratic)
                        dispatch({
                            type: 'SET_CHALLENGE',
                            payload: `The Dreaming Scientist has a new hypothesis: "${discovery.hypothesis}". Manifest this reality?`
                        });
                    }
                    
                    sfx.playSuccess();
                }
            } catch (e) {
                console.warn("[Dreamer] REM cycle interrupted.", e);
            } finally {
                isDreamingRef.current = false;
            }
        }, 60000);

        return () => clearInterval(interval);
    }, [state.worldState, state.isProcessing, dispatch]);
}
