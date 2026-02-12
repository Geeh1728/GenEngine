'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useTelemetry } from './MissionLog';
import { Activity, Brain, Globe } from 'lucide-react';

/**
 * MODULE HUD: SYSTEM VITALS (v40.0)
 * Objective: Real-time telemetry for Neural Consensus and Speculative Mode.
 */
export const SystemVitals: React.FC = () => {
    const { consensusScore, speculativeModeActive } = useTelemetry();

    return (
        <div className="fixed top-24 right-6 z-[100] flex flex-col gap-3">
            {/* NEURAL SYNC METER */}
            <div className="bg-black/40 backdrop-blur-3xl border border-white/10 rounded-2xl p-4 shadow-[0_0_30px_rgba(0,0,0,0.5)] w-48 group">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black text-white/50 uppercase tracking-widest flex items-center gap-2">
                        <Globe className="w-3 h-3 text-purple-400" /> Neural Sync
                    </span>
                    <span className={`text-xs font-mono font-bold ${consensusScore > 90 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {consensusScore}%
                    </span>
                </div>
                
                {/* Meter Bar */}
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-3">
                    <motion.div
                        animate={{ 
                            width: `${consensusScore}%`,
                            backgroundColor: consensusScore > 90 ? '#10b981' : '#f59e0b'
                        }}
                        className="h-full shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                    />
                </div>

                <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                        <motion.div
                            key={i}
                            animate={{
                                opacity: consensusScore > (i * 20) ? [0.2, 1, 0.2] : 0.1,
                                scale: consensusScore > (i * 20) ? [1, 1.1, 1] : 1
                            }}
                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                            className={`h-1 flex-1 rounded-full ${consensusScore > 90 ? 'bg-emerald-500' : 'bg-purple-500'}`}
                        />
                    ))}
                </div>
            </div>

            {/* SPECULATIVE MODE INDICATOR */}
            {speculativeModeActive && (
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="bg-blue-600/20 border border-blue-500/30 rounded-full px-4 py-1.5 backdrop-blur-md flex items-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                >
                    <Brain className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                        Speculative Reality Active
                    </span>
                </motion.div>
            )}
        </div>
    );
};
