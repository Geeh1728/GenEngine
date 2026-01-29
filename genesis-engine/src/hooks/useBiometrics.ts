import { useState, useEffect, useCallback } from 'react';
import { useGenesisStore } from '@/lib/store/GenesisContext';

/**
 * Module T+: THE COGNITIVE SENTINEL (MediaPipe 2026 Simulation)
 * Objective: Track user frustration/boredom via simulated biometric signals.
 * Logic: Calculates CognitiveLoadScore (Pupil/Blink/Head-tilt).
 */
export function useBiometrics() {
    const { state, dispatch } = useGenesisStore();
    const [cognitiveLoad, setCognitiveLoad] = useState(0.5); // 0 to 1

    // Simulated Biometric Stream (Mocking MediaPipe 2026 Landmarks)
    const updateBiometrics = useCallback(() => {
        // In a real 2026 implementation, this would call:
        // const landmarks = await mediaPipe.detectFaceLandmarks(videoElement);
        // const score = calculateCognitiveLoad(landmarks);
        
        // MOCK: Fluctuating load based on interaction frequency and simulation complexity
        setCognitiveLoad(prev => {
            const complexityMult = state.worldState?.entities?.length ? Math.min(state.worldState.entities.length / 10, 0.5) : 0.1;
            const drift = (Math.random() - 0.5) * 0.1;
            return Math.max(0, Math.min(1, prev + drift + (state.isProcessing ? 0.05 : -0.02) + complexityMult));
        });
    }, [state.isProcessing, state.worldState?.entities?.length]);

    useEffect(() => {
        let handle: number;
        
        const scheduleUpdate = () => {
            // Use requestIdleCallback if available, fallback to setTimeout
            if ('requestIdleCallback' in window) {
                handle = (window as any).requestIdleCallback(() => {
                    updateBiometrics();
                    setTimeout(scheduleUpdate, 5000); // Check every 5 seconds when idle
                }, { timeout: 2000 });
            } else {
                handle = setTimeout(() => {
                    updateBiometrics();
                    scheduleUpdate();
                }, 5000) as unknown as number;
            }
        };

        scheduleUpdate();
        return () => {
            if ('cancelIdleCallback' in window) {
                (window as any).cancelIdleCallback(handle);
            } else {
                clearTimeout(handle);
            }
        };
    }, [updateBiometrics]);

    // Sentinel Reactions
    useEffect(() => {
        if (cognitiveLoad > 0.85) {
            dispatch({ 
                type: 'ADD_MISSION_LOG', 
                payload: { 
                    agent: 'Babel', 
                    message: 'Student frustration detected. Preparing verbal hint in native tongue...', 
                    type: 'INFO' 
                } 
            });
            
            // This would trigger the actual Babel Voice output
            // window.dispatchEvent(new CustomEvent('babel-voice-hint', { detail: { message: "Don't forget about the center of mass." } }));
        } else if (cognitiveLoad > 0.7) {
            dispatch({ 
                type: 'ADD_MISSION_LOG', 
                payload: { 
                    agent: 'Saboteur', 
                    message: 'Low engagement detected. Initiating structural anomaly...', 
                    type: 'THINKING' 
                } 
            });
            // Trigger Saboteur Glitch
            dispatch({ type: 'SET_SABOTAGED', payload: true });
        }
    }, [cognitiveLoad, dispatch]);

    return { cognitiveLoad };
}
