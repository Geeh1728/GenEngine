'use client';

import { useEffect, useRef } from 'react';

/**
 * useSynesthesia: The Matter-to-Music Bridge (v24.0)
 * Objective: Map subatomic/physical stress to harmonic frequencies.
 */
export function useSynesthesia(kineticEnergy: number = 0, stress: number = 0) {
    const audioCtx = useRef<AudioContext | null>(null);
    const osc = useRef<OscillatorNode | null>(null);
    const gain = useRef<GainNode | null>(null);

    useEffect(() => {
        // Initialize on first interaction/mount
        if (!audioCtx.current) {
            audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            osc.current = audioCtx.current.createOscillator();
            gain.current = audioCtx.current.createGain();

            osc.current.type = 'sine';
            gain.current.gain.value = 0;

            osc.current.connect(gain.current);
            gain.current.connect(audioCtx.current.destination);
            osc.current.start();
        }

        // Map Stress to Pitch: High stress = High frequency
        // Map Kinetic Energy to Volume: High movement = High volume
        if (osc.current && gain.current) {
            const freq = 200 + (stress * 800);
            const volume = Math.min(kineticEnergy / 1000, 0.1);

            osc.current.frequency.setTargetAtTime(freq, audioCtx.current!.currentTime, 0.1);
            gain.current.gain.setTargetAtTime(volume, audioCtx.current!.currentTime, 0.1);
        }

        return () => {
            // No cleanup needed for singleton-style hook, 
            // but we might want to mute if energy is 0
        };
    }, [kineticEnergy, stress]);

    return null;
}
