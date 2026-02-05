'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Rewind, FastForward, Play, Pause } from 'lucide-react';

interface TemporalHUDProps {
    historyLength: number;
    currentIndex: number;
    onScrub: (index: number) => void;
    onTogglePlayback: () => void;
    isPlaying: boolean;
}

/**
 * THE TIME-TURNER (Module T - Temporal Scrubber)
 * Objective: Control the Ghost Kernel's history buffer for time-travel interaction.
 */
export const TemporalHUD: React.FC<TemporalHUDProps> = ({ 
    historyLength, 
    currentIndex, 
    onScrub,
    onTogglePlayback,
    isPlaying
}) => {
    if (historyLength <= 1) return null;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[200] w-full max-w-xl px-6"
        >
            <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 flex items-center gap-6 shadow-2xl">
                <button 
                    onClick={onTogglePlayback}
                    className="p-3 bg-indigo-500 rounded-2xl text-white shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 pl-0.5" />}
                </button>

                <div className="flex-1 flex flex-col gap-2">
                    <div className="flex justify-between items-center px-1">
                        <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3 text-indigo-400" />
                            <span className="text-[9px] font-black uppercase text-indigo-400 tracking-widest">Time-Turner</span>
                        </div>
                        <span className="text-[10px] font-mono text-white/50">{currentIndex} / {historyLength - 1}</span>
                    </div>

                    <input 
                        type="range"
                        min="0"
                        max={historyLength - 1}
                        value={currentIndex}
                        onChange={(e) => onScrub(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-indigo-500"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <button className="p-2 text-white/30 hover:text-white transition-colors"><Rewind className="w-4 h-4"/></button>
                    <button className="p-2 text-white/30 hover:text-white transition-colors"><FastForward className="w-4 h-4"/></button>
                </div>
            </div>
        </motion.div>
    );
};
