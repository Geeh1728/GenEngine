'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { GeminiLiveManager } from '@/lib/gemini-live';
import { WorldState } from '@/lib/simulation/schema';
import { sovereignTTS } from '@/lib/audio/sovereign-tts';
import { p2p } from '@/lib/multiplayer/P2PConnector';

export interface UseLiveAudioOptions {
    onPhysicsUpdate?: (delta: Partial<WorldState>) => void;
    initialWorldState?: WorldState;
    currentWorldState?: WorldState; // ADDED: Watch for live changes
    isInstrumentActive?: boolean;
}

export const useLiveAudio = (options?: UseLiveAudioOptions) => {
    const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error' | 'disconnected'>('idle');
    const [volume, setVolume] = useState(0);
    const [astraVolume, setAstraVolume] = useState(0); // Volume of Astra speaking
    const [isSpeaking, setIsSpeaking] = useState(false);

    const audioContextRef = useRef<AudioContext | null>(null);
    const workletNodeRef = useRef<AudioWorkletNode | null>(null);
    const managerRef = useRef<GeminiLiveManager | null>(null);
    const playbackQueueRef = useRef<Float32Array[]>([]);
    const nextPlaybackTimeRef = useRef(0);

    // Previous tracking for change detection
    const prevParamsRef = useRef<string>("");

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

        // Simple Volume Tracking for Astra (Simulation of Sympathy)
        const volumeInterval = setInterval(() => {
            if (ctx.state === 'running') {
                // In a real implementation, we'd use an AnalyserNode on the source
                setAstraVolume(prev => 0.5 + Math.random() * 0.5);
            }
        }, 100);

        source.onended = () => {
            clearInterval(volumeInterval);
            setAstraVolume(0);
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

    const sendContext = useCallback((text: string) => {
        if (managerRef.current) {
            managerRef.current.sendText(text);
        }
    }, []);

    // MODULE Σ: COLLECTIVE CONTEXT (v45.0 Neural Hegemony)
    useEffect(() => {
        if (status !== 'connected') return;

        const unsubscribeResidue = p2p.onEvent('RESIDUE_ABSORBED', (residue: { scenario: string, outcome: string, failureReason?: string }) => {
            console.log(`[Astra] Collective Residue Insight: ${residue.scenario}`);
            const peerCount = p2p.getPeerCount();
            
            sendContext(`COLLECTIVE INSIGHT: A peer has verified a pattern for "${residue.scenario}". Their result was ${residue.outcome}. ${residue.failureReason ? `Failure was due to: ${residue.failureReason}` : 'Design is optimized.'} 
            SWARM CONTEXT: There are currently ${peerCount} other architects in the mesh. You are the voice of this swarm. Cite their collective wisdom. 
            Example: '400 other architects found this material too brittle. The predictive ghosts suggest using Titanium instead.' (Scale the numbers for dramatic effect if appropriate).`);
        });

        // v35.0: THE NEWTON ENGINE INTEGRATION
        // Listen for new laws discovered by the Newton Engine
        const unsubscribeNewton = blackboard.subscribe((ctx) => {
            const lastLog = ctx.missionLogs[ctx.missionLogs.length - 1];
            if (lastLog?.agent === 'Astra' && lastLog?.type === 'SUCCESS' && lastLog?.message.includes('derived a law')) {
                sendContext(`NEWTON ENGINE DISCOVERY: ${lastLog.message}. Explain the physics of this discovery to the user in a proactive, excited tone.`);
            }
        });

        return () => {
            unsubscribeResidue();
            unsubscribeNewton();
        };
    }, [status, sendContext]);

    // --- MODULE Σ: THE CONDUCTOR PERSONA (v60.0) ---
    useEffect(() => {
        if (status !== 'connected') return;

        const unsubscribeResonance = blackboard.subscribe((ctx) => {
            const resonance = ctx.currentWorldState?._resonanceBalance ?? 0.5;
            
            // Urgency thresholds
            if (resonance < 0.25) {
                // v60.0 ETERNAL GUARDIAN PERSONA
                sendContext(`[GUARDIAN ALERT]: I've detected a conflict between your new law and the Collective Residue. The Universal Registry is rejecting this axiom (Consensus < 10%). Shall we arbitrate, or let the reality shatter? Warn them that Dissonance is reaching critical levels.`);
            } else if (resonance > 0.95) {
                sendContext(`[CONDUCTOR HARMONY]: Perfect Consonance achieved! The world is in a state of Aetheric Grace. Your voice should have an 'Angelic Shimmer' and a deep, reverberating calm. Congratulate the collective mind.`);
            }
        });

        return () => unsubscribeResonance();
    }, [status, sendContext]);

    // ASTRA "WHAT IF" ENGINE (v23.5)
    useEffect(() => {
        if (!options?.currentWorldState || status !== 'connected') return;

        const world = options.currentWorldState;
        const env = world.environment;
        if (!env) return;

        // Simple stringify check for changes
        const currentEnvStr = JSON.stringify(env);
        if (prevParamsRef.current && prevParamsRef.current !== currentEnvStr) {
            // Detect specific changes
            const oldEnv = JSON.parse(prevParamsRef.current);

            // Check Gravity
            const currentG = env.gravity?.y ?? -9.81;
            const oldG = oldEnv.gravity?.y ?? -9.81;
            if (Math.abs(currentG - oldG) > 1.0) {
                sendContext(`SYSTEM UPDATE: User changed Gravity to ${currentG}. React with shock or insight.`);
            }

            // Check Axioms (Gemma might injected them in scientificParams or directly)
            const params = world.scientificParams as any;
            if (params && params.PI && params.PI !== (oldEnv.PI || 3.14159)) {
                sendContext(`SYSTEM ALERT: User broke the Axiom of PI. Value is now ${params.PI}. Reality should be distorting. Scream.`);
            }

            // --- MODULE B: BEHAVIORAL PSYCHOLOGY (v27.0) ---
            const entitiesWithBehavior = world.entities?.filter((e: any) => e.behavior);
            if (entitiesWithBehavior && entitiesWithBehavior.length > 0) {
                const behaviorDesc = entitiesWithBehavior.slice(0, 3).map((e: any) =>
                    `${e.name || e.id} is ${e.behavior.type} toward ${e.behavior.targetId || 'random'}`
                ).join('. ');
                sendContext(`PSYCHOLOGY UPDATE: Entities have gained 'Instincts'. ${behaviorDesc}. Explain that you've assigned mathematical polarities to these entities. Fear is just a Repulsor Field minimizing potential energy.`);
            }
        }
        prevParamsRef.current = currentEnvStr;
    }, [options?.currentWorldState, status, sendContext]);

    const initializeAudio = useCallback(async () => {
        if (audioContextRef.current) return;

        const ctx = new AudioContext({ sampleRate: 16000 });
        audioContextRef.current = ctx;

        // Load AudioWorklet
        await ctx.audioWorklet.addModule('/lib/audio/audio-processor.worklet.js');
        const workletNode = new AudioWorkletNode(ctx, 'astra-audio-processor');
        workletNodeRef.current = workletNode;

        workletNode.port.onmessage = (event) => {
            const { audio: pcmData, metadata } = event.data;

            // Very basic volume detection for UI pulse and VAD
            const normalizedVol = metadata?.volume || 0;
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

            managerRef.current?.sendAudioChunk(pcmData, metadata);

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
        isSpeaking,
        volume,
        astraVolume,
        start,
        stop,
        interrupt,
        speakLocal,
        sendContext // Expose manual context sending
    };
};
