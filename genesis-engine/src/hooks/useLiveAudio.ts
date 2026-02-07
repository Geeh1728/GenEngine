'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { GeminiLiveManager } from '@/lib/gemini-live';
import { WorldState } from '@/lib/simulation/schema';
import { sovereignTTS } from '@/lib/audio/sovereign-tts';

export interface UseLiveAudioOptions {
    onPhysicsUpdate?: (delta: Partial<WorldState>) => void;
    initialWorldState?: WorldState;
    isInstrumentActive?: boolean;
}

export const useLiveAudio = (options?: UseLiveAudioOptions) => {
    const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error' | 'disconnected'>('idle');
    const [volume, setVolume] = useState(0);
    const [isSpeaking, setIsSpeaking] = useState(false);

    const audioContextRef = useRef<AudioContext | null>(null);
    const workletNodeRef = useRef<AudioWorkletNode | null>(null);
    const managerRef = useRef<GeminiLiveManager | null>(null);
    const playbackQueueRef = useRef<Float32Array[]>([]);
    const nextPlaybackTimeRef = useRef(0);

    const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const stop = useCallback(() => {
        if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current);
        managerRef.current?.disconnect();
        audioContextRef.current?.close();
        audioContextRef.current = null;
        setStatus('idle');
    }, []);

    const resetActivityTimeout = useCallback(() => {
        if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current);
        activityTimeoutRef.current = setTimeout(() => {
            console.log("Astra: Silence timeout reached (30s). Severing link.");
            stop();
        }, 30000);
    }, [stop]);

    const speakLocal = useCallback(async (text: string) => {
        setIsSpeaking(true);
        await sovereignTTS.playOffline(text);
        setIsSpeaking(false);
    }, []);


    const schedulePlayback = useCallback((data: Float32Array) => {
        if (!audioContextRef.current) return;

        const ctx = audioContextRef.current;
        const buffer = ctx.createBuffer(1, data.length, 24000);
        buffer.getChannelData(0).set(data);

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);

        const startTime = Math.max(ctx.currentTime, nextPlaybackTimeRef.current);
        source.start(startTime);
        nextPlaybackTimeRef.current = startTime + buffer.duration;

        setIsSpeaking(true);
        source.onended = () => {
            if (ctx.currentTime >= nextPlaybackTimeRef.current - 0.1) {
                setIsSpeaking(false);
            }
        };
    }, []);

    const handleIncomingAudio = useCallback((buffer: ArrayBuffer) => {
        if (!audioContextRef.current) return;

        resetActivityTimeout(); // Astra is speaking

        // Convert Int16 PCM (24kHz) to Float32 for Web Audio
        const int16 = new Int16Array(buffer);
        const float32 = new Float32Array(int16.length);
        for (let i = 0; i < int16.length; i++) {
            float32[i] = int16[i] / 32768;
        }

        schedulePlayback(float32);
    }, [resetActivityTimeout, schedulePlayback]);

    const interrupt = useCallback(() => {
        resetActivityTimeout();
        managerRef.current?.interrupt();
        playbackQueueRef.current = [];
        nextPlaybackTimeRef.current = 0;
        setIsSpeaking(false);
    }, [resetActivityTimeout]);

    const initializeAudio = useCallback(async () => {
        if (audioContextRef.current) return;

        const ctx = new AudioContext({ sampleRate: 16000 });
        audioContextRef.current = ctx;

        // Load AudioWorklet
        await ctx.audioWorklet.addModule('/lib/audio/audio-processor.worklet.js');
        const workletNode = new AudioWorkletNode(ctx, 'astra-audio-processor');
        workletNodeRef.current = workletNode;

        workletNode.port.onmessage = (event) => {
            const pcmData = event.data;
            
            // Very basic volume detection for UI pulse and VAD
            const int16 = new Int16Array(pcmData);
            let sum = 0;
            for (let i = 0; i < int16.length; i++) {
                sum += Math.abs(int16[i]);
            }

            const normalizedVol = sum / int16.length / 32768;
            setVolume(normalizedVol);

            // INTELLIGENT SILENCE: Only interrupt if volume is significant (>0.05)
            // This prevents background noise from cutting off Astra.
            // MODULE A-S: Skip interrupt if user is playing an instrument (Piano Test)
            if (isSpeaking && normalizedVol > 0.05) {
                if (options?.isInstrumentActive) {
                    console.log("[VAD] User is playing. Astra will not interrupt.");
                } else {
                    console.log("[VAD] Significant user audio detected. Interrupting Astra.");
                    interrupt();
                }
            }

            managerRef.current?.sendAudioChunk(pcmData);

            // Reset timeout if user is making sound
            if (normalizedVol > 0.01) {
                resetActivityTimeout();
            }
        };

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const source = ctx.createMediaStreamSource(stream);
        source.connect(workletNode);

        // Manager setup
        // IRON SHIELD: Using Secure Proxy, no client-side key.
        managerRef.current = new GeminiLiveManager(
            {
                initialWorldState: options?.initialWorldState
            },
            handleIncomingAudio,
            (delta) => options?.onPhysicsUpdate?.(delta),
            (newStatus) => {
                setStatus(newStatus);
                if (newStatus === 'connected') resetActivityTimeout();
            }
        );
        managerRef.current.connect();
    }, [options, resetActivityTimeout, handleIncomingAudio, interrupt, isSpeaking]);

    const start = () => {
        if (status === 'idle' || status === 'disconnected') {
            initializeAudio();
        }
    };

    useEffect(() => {
        return () => {
            if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current);
            stop();
        };
    }, [stop]);


    return {
        status,
        volume,
        isSpeaking,
        start,
        stop,
        interrupt,
        speakLocal
    };
};
