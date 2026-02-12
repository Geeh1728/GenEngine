import { useEffect } from 'react';
import { blackboard } from '@/lib/genkit/context';
import { useGenesisStore } from '@/lib/store/GenesisContext';

/**
 * useDreamLogic (v29.0: The Dream Logic Graft)
 * Objective: Adjust global physics laws based on emotional state.
 */
export function useDreamLogic() {
    const { state, dispatch } = useGenesisStore();
    const { worldState } = state;

    useEffect(() => {
        const interval = setInterval(() => {
            const vibe = blackboard.getContext().userVibe;
            
            // HEURISTIC DREAM ENGINE (Proxy for LLM Feedback)
            // If user is agitated, gravity gets weird.
            // If user is calm, world gets stable.

            let gravityY = -9.81;
            let timeScale = 1.0;
            let damping = 0.0;

            if (vibe.intensity > 0.8) {
                // CHAOS MODE: Low gravity, high jitter
                gravityY = -2.0;
                damping = 0.5;
                timeScale = 1.2;
            } else if (vibe.velocity > 0.8) {
                // KINETIC MODE: High drag, normal gravity
                damping = 2.0;
            } else if (vibe.intensity < 0.2) {
                // ZEN MODE: Perfect stability
                gravityY = -9.81;
                damping = 0.1;
                timeScale = 0.8;
            }

            // Apply to WorldState if different
            const currentEnv = worldState.environment || { gravity: { x: 0, y: -9.8, z: 0 }, timeScale: 1 };
            if (Math.abs(currentEnv.gravity.y - gravityY) > 0.1 || Math.abs(currentEnv.timeScale - timeScale) > 0.1) {
                
                // MODULE C: Chronokinetic Haptics (v32.0)
                // Trigger calming heartbeat haptics if simulation slows down (high intensity)
                if (timeScale < 1.0 && typeof navigator !== 'undefined' && navigator.vibrate) {
                    navigator.vibrate([10, 50, 10]); // Subtle heartbeat pulse
                }

                dispatch({
                    type: 'UPDATE_WORLD_ENVIRONMENT',
                    payload: {
                        ...currentEnv,
                        gravity: { ...currentEnv.gravity, y: gravityY },
                        damping,
                        timeScale
                    }
                });
            }
        }, 2000); // Evaluate every 2 seconds

        return () => clearInterval(interval);
    }, [worldState, dispatch]);
}
