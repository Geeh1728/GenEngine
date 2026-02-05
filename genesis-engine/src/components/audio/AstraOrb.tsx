'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface AstraOrbProps {
    volume: number;
    isSpeaking: boolean;
    status: 'connected' | 'idle' | 'connecting' | 'error' | 'disconnected';
}

export const AstraOrb: React.FC<AstraOrbProps> = ({ volume, isSpeaking, status }) => {
    // Normalize volume for visual scaling (0 to 1 -> 1 to 1.5)
    const scale = 1 + (volume * 2);
    const glowColor = status === 'connected' ? 'rgba(59, 130, 246, 0.5)' : 'rgba(239, 68, 68, 0.5)';

    return (
        <div className="relative w-32 h-32 flex items-center justify-center">
            {/* Ambient Glow */}
            <motion.div
                animate={{
                    scale: isSpeaking ? [1, 1.4, 1] : [1, 1.2, 1],
                    opacity: isSpeaking ? [0.4, 0.8, 0.4] : 0.2,
                }}
                transition={{ 
                    duration: isSpeaking ? 0.5 : 3, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                }}
                className="absolute inset-0 rounded-full blur-3xl"
                style={{ backgroundColor: glowColor }}
            />

            {/* Core Orb - Neural Glass Style */}
            <motion.div
                animate={{
                    scale: status === 'connected' ? scale : 1,
                    boxShadow: isSpeaking
                        ? `0 0 50px 15px ${glowColor}`
                        : `0 0 20px 2px ${glowColor}`,
                    borderColor: isSpeaking ? 'rgba(96, 165, 250, 0.8)' : 'rgba(255, 255, 255, 0.1)',
                }}
                className={`
                    relative w-14 h-14 rounded-full border-2 backdrop-blur-2xl transition-all duration-500
                    ${status === 'connected' ? 'bg-blue-500/10' : 'bg-white/5'}
                `}
            >
                {/* Inner Core Pulse */}
                <motion.div
                    animate={{
                        opacity: isSpeaking ? [0.2, 0.6, 0.2] : 0.1,
                    }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="absolute inset-2 rounded-full bg-blue-400 blur-sm"
                />

                {/* Status Indicator */}
                <div className={`
                    absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border border-black/50 z-10
                    ${status === 'connected' ? 'bg-emerald-500 shadow-[0_0_12px_#10b981]' : 'bg-red-500 shadow-[0_0_12px_#ef4444]'}
                `} />
            </motion.div>

            {/* Label */}
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <motion.span 
                    animate={isSpeaking ? { opacity: [0.5, 1, 0.5] } : { opacity: 0.6 }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-[9px] font-black uppercase tracking-[0.4em] text-blue-400"
                >
                    {status === 'connected' ? (isSpeaking ? 'Neural Synthesis' : 'Astra Listening') : 'Link Offline'}
                </motion.span>
            </div>
        </div>
    );
};
