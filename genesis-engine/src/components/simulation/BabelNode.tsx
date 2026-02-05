'use client';

import React, { useEffect, useRef } from 'react';
import { WorldState } from '@/lib/simulation/schema';
import { useLiveAudio } from '@/hooks/useLiveAudio';
import { useAstraCompanion } from '@/hooks/useAstraCompanion';
import { AstraOrb } from '../audio/AstraOrb';
import { ExternalLink } from 'lucide-react';

interface BabelNodeProps {
    worldState: WorldState;
    onPhysicsUpdate: (delta: Partial<WorldState>) => void;
}

export const BabelNode: React.FC<BabelNodeProps> = ({
    worldState,
    onPhysicsUpdate
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { isCompanionActive, toggleCompanion } = useAstraCompanion();
    const {
        status,
        volume,
        isSpeaking,
        start,
        stop,
        interrupt,
        speakLocal
    } = useLiveAudio({
        onPhysicsUpdate,
        initialWorldState: worldState
    });


    // Keyboard Shortcut (Spacebar to Toggle Astra Link)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && !e.repeat) {
                if (status === 'connected' && isSpeaking) {
                    interrupt(); // Interrupt Astra if she's talking
                } else if (status === 'idle' || status === 'disconnected') {
                    if (typeof navigator !== 'undefined' && !navigator.onLine) {
                        speakLocal("Sovereign Mode active. Cloud link offline, but I am still here.");
                        return;
                    }
                    e.preventDefault();
                    start();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [status, isSpeaking, start, interrupt, speakLocal]);

    return (
        <div ref={containerRef} className="fixed bottom-24 right-8 z-[100] flex flex-col items-center gap-2 pointer-events-none">
            <div className="pointer-events-auto flex flex-col items-center gap-2">
                {!isCompanionActive && (
                    <button 
                        onClick={() => toggleCompanion(containerRef)}
                        className="p-1 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 text-gray-500 hover:text-indigo-400 transition-all mb-1"
                        title="Astra Companion (PiP)"
                    >
                        <ExternalLink className="w-2.5 h-2.5" />
                    </button>
                )}
                <AstraOrb volume={volume} isSpeaking={isSpeaking} status={status as any} />
            </div>
            
            {status === 'connected' && (
                <span className="text-[8px] font-black text-blue-400/40 uppercase tracking-[0.4em] animate-pulse">
                    Live Link Active
                </span>
            )}
        </div>
    );
};
