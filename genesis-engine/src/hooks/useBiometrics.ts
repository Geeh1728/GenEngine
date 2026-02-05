import { useState, useEffect, useCallback, useRef } from 'react';
import { useGenesisStore } from '@/lib/store/GenesisContext';

/**
 * Module T+: THE COGNITIVE SENTINEL (v13.5)
 * Objective: Track user frustration/boredom via interaction telemetry.
 * Logic: Calculates CognitiveLoadScore based on mouse jitter and interaction frequency.
 */
export function useBiometrics() {
    const { state, dispatch } = useGenesisStore();
    const [cognitiveLoad, setCognitiveLoad] = useState(0.5); // 0 to 1
    const [userSentiment, setUserSentiment] = useState<'CONFUSED' | 'BORED' | 'ENGAGED' | 'FRUSTRATED'>('ENGAGED');

    const telemetryRef = useRef({
        lastMousePos: { x: 0, y: 0 },
        mouseVelocity: 0,
        clickCount: 0,
        lastInteraction: Date.now()
    });

    // 1. TELEMETRY COLLECTOR
    useEffect(() => {
        const handleMove = (e: MouseEvent) => {
            const dx = e.clientX - telemetryRef.current.lastMousePos.x;
            const dy = e.clientY - telemetryRef.current.lastMousePos.y;
            telemetryRef.current.mouseVelocity = Math.sqrt(dx*dx + dy*dy);
            telemetryRef.current.lastMousePos = { x: e.clientX, y: e.clientY };
            telemetryRef.current.lastInteraction = Date.now();
        };

        const handleClick = () => {
            telemetryRef.current.clickCount++;
            telemetryRef.current.lastInteraction = Date.now();
        };

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('click', handleClick);
        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('click', handleClick);
        };
    }, []);

    // 2. COGNITIVE ENGINE (Heuristic analysis)
    const updateBiometrics = useCallback(() => {
        const now = Date.now();
        const idleTime = (now - telemetryRef.current.lastInteraction) / 1000;
        const velocity = telemetryRef.current.mouseVelocity;
        
        setCognitiveLoad(prev => {
            let load = prev;

            // Frustration Heuristic: High velocity/jitter + rapid clicks
            if (velocity > 100 && telemetryRef.current.clickCount > 5) {
                load = Math.min(1, load + 0.2);
            } 
            // Boredom Heuristic: High idle time
            else if (idleTime > 30) {
                load = Math.max(0, load - 0.1);
            }
            // Engagement: Moderate movement and steady clicks
            else {
                load = 0.5 + (velocity / 1000);
            }

            // Reset click count for next window
            telemetryRef.current.clickCount = 0;
            return Math.min(1, Math.max(0, load));
        });
    }, []);

    // Map Load to Sentiment
    useEffect(() => {
        if (cognitiveLoad > 0.8) {
            setUserSentiment('FRUSTRATED');
        } else if (cognitiveLoad > 0.6) {
            setUserSentiment('CONFUSED');
        } else if (cognitiveLoad < 0.3) {
            setUserSentiment('BORED');
        } else {
            setUserSentiment('ENGAGED');
        }
    }, [cognitiveLoad]);

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
        if (userSentiment === 'CONFUSED' && cognitiveLoad > 0.85) {
             // Only log once per state change ideally, but for now this is fine
             // dispatch handles uniqueness usually or UI deduplicates
            dispatch({ 
                type: 'ADD_MISSION_LOG', 
                payload: { 
                    agent: 'Astra', 
                    message: "I noticed this part is tricky. Would you like me to simplify the physics?", 
                    type: 'SUCCESS' 
                } 
            });
            
            setCognitiveLoad(0.5); // Reset to avoid spam
        } else if (userSentiment === 'BORED' && cognitiveLoad < 0.2) {
             dispatch({ 
                type: 'ADD_MISSION_LOG', 
                payload: { 
                    agent: 'Saboteur', 
                    message: 'Engagement dropping. Initiating structural anomaly to re-engage...', 
                    type: 'THINKING' 
                } 
            });
            dispatch({ type: 'SET_SABOTAGED', payload: true });
            setCognitiveLoad(0.5);
        }
    }, [userSentiment, cognitiveLoad, dispatch]);

    return { cognitiveLoad, userSentiment };
}