import { useEffect, useRef } from 'react';
import { ecsWorld } from '@/lib/ecs/world';
import { useFrame } from '@react-three/fiber';

/**
 * MODULE H: STRUCTURAL PAIN HAPTICS (v50.0 GOLD)
 * Objective: Tie physical stress to biological feedback.
 * Mechanism: If any entity exceeds 90% stress, trigger a 'Shatter Pulse' vibration.
 */
export function useHaptics() {
    const lastVibrationTime = useRef(0);
    const VIBRATION_COOLDOWN = 200; // ms

    useFrame((state) => {
        // v50.0: Query ECS world for high-stress entities
        const highStressEntities = ecsWorld.entities.filter(e => (e as any).stress_intensity > 0.9);

        if (highStressEntities.length > 0 && typeof navigator !== 'undefined' && navigator.vibrate) {
            const now = Date.now();
            if (now - lastVibrationTime.current > VIBRATION_COOLDOWN) {
                // Shatter Pulse: High-frequency, rhythmic vibration
                // 50ms pulse, 30ms break, 50ms pulse
                navigator.vibrate([50, 30, 50]);
                lastVibrationTime.current = now;
            }
        }
    });
}
