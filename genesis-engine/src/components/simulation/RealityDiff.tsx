'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, RotateCcw, XCircle } from 'lucide-react';

interface RealityDiffProps {
    isOpen: boolean;
    hypothesis: string;
    outcome: string;
    sabotageReveal?: string;
    onReset: () => void;
}

export const RealityDiff: React.FC<RealityDiffProps> = ({
    isOpen,
    hypothesis,
    outcome,
    sabotageReveal,
    onReset
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ x: '100%', opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: '100%', opacity: 0 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                    className="fixed top-20 right-6 w-96 z-50 overflow-hidden"
                >
                    <div className="relative p-6 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-2xl overflow-hidden group">
                        {/* Animated background pulse */}
                        <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-50 group-hover:opacity-70 transition-opacity" />

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-red-500/20 rounded-lg">
                                    <AlertCircle className="w-6 h-6 text-red-400" />
                                </div>
                                <h2 className="text-xl font-bold text-white tracking-tight">Simulation Diagnostics</h2>
                            </div>

                            <div className="space-y-6">
                                {/* Hypothesis Section */}
                                <div>
                                    <label className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-2 block">
                                        Hypothesis (What you expected)
                                    </label>
                                    <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-white/90 italic">
                                        &quot;{hypothesis}&quot;
                                    </div>
                                </div>

                                {/* Outcome Section */}
                                <div>
                                    <label className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-2 block">
                                        Physics Outcome (What happened)
                                    </label>
                                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200">
                                        {outcome}
                                    </div>
                                </div>

                                {/* Sabotage Reveal Section */}
                                {sabotageReveal && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{
                                            opacity: 1,
                                            scale: 1,
                                            textShadow: [
                                                "0 0 0px #ef4444",
                                                "2px 2px 5px #ef4444",
                                                "-2px -2px 5px #ef4444",
                                                "0 0 0px #ef4444"
                                            ]
                                        }}
                                        transition={{ duration: 0.2, repeat: Infinity, repeatType: 'reverse' }}
                                        className="p-4 rounded-lg bg-red-900/40 border-2 border-red-500/50 relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse" />
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-red-400 mb-1 block">
                                            ⚠️ SABOTAGE DETECTED ⚠️
                                        </label>
                                        <p className="text-sm font-mono text-red-100 uppercase leading-tight">
                                            {sabotageReveal}
                                        </p>
                                    </motion.div>
                                )}
                            </div>

                            <div className="mt-8 flex gap-3">
                                <button
                                    onClick={onReset}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-all border border-white/10"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    Retry Simulation
                                </button>
                                <button
                                    onClick={onReset}
                                    className="p-3 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-all shadow-lg shadow-red-500/20"
                                >
                                    <XCircle className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Scanline effect */}
                        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_4px,3px_100%]" />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
