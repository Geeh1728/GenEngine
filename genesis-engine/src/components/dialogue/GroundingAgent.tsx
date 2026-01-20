'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, ShieldCheck, Quote, ChevronRight } from 'lucide-react';

interface GroundingAgentProps {
    complexity: 'fundamental' | 'standard' | 'expert';
    isListening?: boolean;
    onToggleListening?: () => void;
    spatialCommentary?: {
        text: string;
        citation: string;
    };
}

export const GroundingAgent: React.FC<GroundingAgentProps> = ({
    // complexity,
    isListening,
    onToggleListening,
    spatialCommentary = {
        text: "According to the Copenhagen Interpretation, the electron exists as a probability wave until the act of measurement forces it to choose a single path.",
        citation: "Bohr, N. (1927). The Quantum Postulate and the Recent Development of Atomic Theory."
    }
}) => {
    return (
        <div className="fixed top-24 right-12 w-80 z-50">
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-black/40 backdrop-blur-3xl border border-white/5 rounded-2xl overflow-hidden shadow-2xl"
            >
                {/* Agent Header */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-white/5 bg-gradient-to-r from-blue-500/10 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
                            <div className="absolute inset-0 w-2 h-2 rounded-full bg-blue-500 animate-ping opacity-50" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white">Quantum Oracle</span>
                    </div>
                    <button
                        onClick={onToggleListening}
                        className={`p-1.5 rounded-full transition-all ${isListening ? 'bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)]' : 'bg-white/5 text-gray-400 hover:text-white'
                            }`}
                    >
                        {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    </button>
                </div>

                {/* Dynamic Commentary Content */}
                <div className="p-6 space-y-4">
                    <div className="relative">
                        <Quote className="absolute -top-2 -left-2 w-4 h-4 text-blue-500/20" />
                        <motion.p
                            key={spatialCommentary.text}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-xs text-gray-300 leading-relaxed pl-4 border-l border-blue-500/20"
                        >
                            &quot;{spatialCommentary.text}&quot;
                        </motion.p>
                    </div>

                    {/* Grounding Verification */}
                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <ShieldCheck className="w-3 h-3 text-emerald-500" />
                            <span className="text-[8px] uppercase tracking-widest text-emerald-500/80 font-bold">Grounded Accuracy</span>
                        </div>
                        <p className="text-[9px] text-emerald-400/60 leading-tight italic">
                            {spatialCommentary.citation}
                        </p>
                    </div>

                    {/* Visualization Controls / Cues */}
                    <div className="grid grid-cols-2 gap-2 mt-4">
                        <button className="flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg transition-all group">
                            <Volume2 className="w-3 h-3 text-gray-400 group-hover:text-blue-400" />
                            <span className="text-[9px] uppercase tracking-widest text-gray-400 group-hover:text-white">Read Aloud</span>
                        </button>
                        <button className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg transition-all group">
                            <span className="text-[9px] uppercase tracking-widest text-blue-400 group-hover:text-white font-bold">Deep Dive</span>
                            <ChevronRight className="w-3 h-3 text-blue-400" />
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Listening State Overlay */}
            <AnimatePresence>
                {isListening && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="mt-4 bg-red-500/10 border border-red-500/20 rounded-full py-2 px-4 flex items-center justify-center gap-3"
                    >
                        <div className="flex gap-1">
                            {[1, 2, 3].map(i => (
                                <motion.div
                                    key={i}
                                    animate={{ height: [4, 8, 4] }}
                                    transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.2 }}
                                    className="w-0.5 bg-red-500"
                                />
                            ))}
                        </div>
                        <span className="text-[9px] uppercase tracking-[0.2em] text-red-500 font-bold">Listening for &quot;Why?&quot;</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
