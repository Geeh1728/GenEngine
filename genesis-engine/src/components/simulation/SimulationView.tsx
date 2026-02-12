'use client';

import React, { useState } from 'react';
import { SimulationCanvas } from '@/components/simulation/SimulationCanvas';
import { useJarvis } from '@/lib/voice/useJarvis';
import { Mic, MicOff } from 'lucide-react';
import { WorldState } from '@/lib/simulation/schema';

interface SimulationViewProps {
    isObserved: boolean;
    godMode?: unknown;
}

export const SimulationView: React.FC<SimulationViewProps> = ({ }) => {
    const { speak, listen, isListening, transcript, isSpeaking } = useJarvis({ voiceStress: 0.1 });
    const [worldState] = useState<WorldState | undefined>(() => ({
        scenario: 'Gravity Test',
        mode: 'PHYSICS',
        domain: 'SCIENCE',
        explanation: 'A simple demonstration of gravity acting on a sphere.',
        constraints: [],
        successCondition: 'Objects settle on floor',
        _renderingStage: 'SOLID',
        _resonanceBalance: 0.5,
        entities: [
            {
                id: 'ball-1',
                shape: 'sphere',
                name: 'Test Ball',
                physics: {
                    mass: 1,
                    friction: 0.5,
                    restitution: 0.7,
                    isStatic: false
                },
                position: { x: 0, y: 5, z: 0 },
                rotation: { x: 0, y: 0, z: 0, w: 1 },
                dimensions: { x: 1, y: 1, z: 1 },
                visual: {
                    color: 'hotpink',
                }
            },
            {
                id: 'floor',
                shape: 'plane',
                name: 'Floor',
                physics: {
                    mass: 0,
                    friction: 0.5,
                    restitution: 0.2,
                    isStatic: true
                },
                position: { x: 0, y: 0, z: 0 },
                rotation: { x: 0, y: 0, z: 0, w: 1 },
                dimensions: { x: 50, y: 1, z: 50 },
                visual: {
                    color: '#222',
                }
            }
        ],
        description: 'Initial Unity Test State'
    }));

    const toggleVoice = () => {
        if (isListening) {
            // stop listening logic if needed
        } else {
            speak("Genesis Engine Online. Awaiting command.");
            listen();
        }
    };

    return (
        <div className="w-full h-full relative group bg-black/50 overflow-hidden">
            <div className="absolute top-4 left-4 z-20 pointer-events-none">
                <p className="text-[10px] uppercase tracking-[0.3em] text-blue-400/50 font-bold mb-1">
                    Kinetic Core
                </p>
                <h4 className="text-xl font-outfit font-bold text-white uppercase tracking-wider">
                    {worldState?.description || 'Initializing...'}
                </h4>
            </div>

            {/* Main Physics Canvas */}
            <SimulationCanvas worldState={worldState} debug={false} />

            {/* Jarvis UI */}
            <div className="absolute bottom-6 right-6 z-50 flex items-center gap-4">
                {transcript && (
                    <div className="bg-black/80 px-4 py-2 rounded-lg border border-blue-500/30 text-blue-200 text-sm backdrop-blur-md">
                        &quot;{transcript}&quot;
                    </div>
                )}

                <button
                    onClick={toggleVoice}
                    className={`p-4 rounded-full transition-all duration-300 border ${isListening
                        ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                        : 'bg-blue-500/10 border-blue-500/50 text-blue-400 hover:bg-blue-500/20'
                        }`}
                >
                    {isListening ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                </button>
            </div>

            {isSpeaking && (
                <div className="absolute top-6 right-6 z-20 flex gap-1 h-4 items-end">
                    <div className="w-1 bg-cyan-400 animate-[bounce_0.5s_infinite] h-full" />
                    <div className="w-1 bg-cyan-400 animate-[bounce_0.7s_infinite] h-2/3" />
                    <div className="w-1 bg-cyan-400 animate-[bounce_0.6s_infinite] h-full" />
                </div>
            )}
        </div>
    );
};