import { useEffect, useRef } from 'react';
import { blackboard } from '@/lib/genkit/context';

/**
 * useIntentionMonitor (Track 1: Emotional Inference Engine)
 * Objective: Track user interaction intensity (Jerk/Velocity) to modulate simulation 'vibe'.
 * Logic: Jerk is the derivative of acceleration. High jerk = Agitation/Chaos.
 */
export function useIntentionMonitor() {
    const lastPosRef = useRef({ x: 0, y: 0, t: Date.now() });
    const lastVelRef = useRef({ x: 0, y: 0, t: Date.now() });
    const lastAccRef = useRef({ x: 0, y: 0, t: Date.now() });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const now = Date.now();
            const dt = (now - lastPosRef.current.t) / 1000; // in seconds
            if (dt < 0.01) return; // Throttle

            // 1. Velocity (px/s)
            const vx = (e.clientX - lastPosRef.current.x) / dt;
            const vy = (e.clientY - lastPosRef.current.y) / dt;
            const velocity = Math.sqrt(vx * vx + vy * vy);

            // 2. Acceleration (px/s^2)
            const ax = (vx - lastVelRef.current.x) / dt;
            const ay = (vy - lastVelRef.current.y) / dt;
            const acceleration = Math.sqrt(ax * ax + ay * ay);

            // 3. Jerk (px/s^3) - The "Agitation" factor
            const jx = (ax - lastAccRef.current.x) / dt;
            const jy = (ay - lastAccRef.current.y) / dt;
            const jerk = Math.sqrt(jx * jx + jy * jy);

            // Normalize for Blackboard (scaled roughly based on desktop interaction)
            // 5000 px/s^3 is a very fast/jittery movement
            const intensity = Math.min(1, jerk / 5000);
            const speed = Math.min(1, velocity / 2000);

            // Update Blackboard
            blackboard.update({
                userVibe: {
                    intensity,
                    velocity: speed,
                    focus: {
                        x: e.clientX / window.innerWidth,
                        y: e.clientY / window.innerHeight
                    }
                }
            });

            // Update history
            lastPosRef.current = { x: e.clientX, y: e.clientY, t: now };
            lastVelRef.current = { x: vx, y: vy, t: now };
            lastAccRef.current = { x: ax, y: ay, t: now };
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);
}
