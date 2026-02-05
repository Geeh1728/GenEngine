/**
 * HAPTIC REALITY (Tactile Empathy)
 * Objective: Map high-stress physics events to device vibration motors.
 * Strategy: biological link between the user and the simulation.
 */

let lastHapticTime = 0;
const HAPTIC_THROTTLE = 100; // ms

export function triggerHapticStress(intensity: number) {
    if (typeof window === 'undefined' || !navigator.vibrate) return;

    const now = Date.now();
    if (now - lastHapticTime < HAPTIC_THROTTLE) return;

    // Scale intensity: 0.1 to 1.0 -> 10ms to 100ms
    const duration = Math.min(100, Math.max(10, intensity * 100));
    
    navigator.vibrate(duration);
    lastHapticTime = now;
}

export function triggerHapticImpact() {
    if (typeof window === 'undefined' || !navigator.vibrate) return;
    navigator.vibrate([20, 10, 20]); // Double-tap impact
}
