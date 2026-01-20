'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Box, Cpu } from 'lucide-react';

interface KnowledgeCrystalProps {
    onExport: () => void;
    isUnlocked: boolean;
    score: number;
}

export const KnowledgeCrystal: React.FC<KnowledgeCrystalProps> = ({ onExport, isUnlocked, score }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50">
            <AnimatePresence>
                {isUnlocked && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0, y: 50 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.05 }}
                        className="flex flex-col items-center gap-4"
                    >
                        {/* The 3D-Like Crystal Button */}
                        <button
                            onMouseEnter={() => setIsHovered(true)}
                            onMouseLeave={() => setIsHovered(false)}
                            onClick={onExport}
                            className="relative w-24 h-24 group transition-all"
                        >
                            {/* Outer Glow Ring */}
                            <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl animate-pulse" />
                            <div className="absolute inset-0 rounded-full border border-blue-500/30 scale-110 group-hover:scale-125 transition-transform duration-700" />

                            {/* The Crystal (CSS 3D approximation) */}
                            <div className="absolute inset-2 bg-gradient-to-tr from-blue-600/40 via-purple-500/20 to-emerald-400/40 backdrop-blur-3xl rounded-xl shadow-2xl overflow-hidden border border-white/20 transform rotate-45 group-hover:rotate-[225deg] transition-transform duration-1000 flex items-center justify-center">
                                <div className="transform -rotate-45 group-hover:rotate-[-225deg] transition-transform duration-1000">
                                    <Sparkles className="w-8 h-8 text-white animate-pulse" />
                                </div>

                                {/* Refractions */}
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-white/40 blur-[1px]" />
                                <div className="absolute bottom-0 right-0 w-[1px] h-full bg-white/40 blur-[1px]" />
                            </div>

                            {/* Data Overlay Particles */}
                            {isHovered && (
                                <div className="absolute inset-[-40px] pointer-events-none">
                                    {[...Array(6)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, scale: 0 }}
                                            animate={{ opacity: 0.8, scale: 1, x: (i - 2.5) * 20, y: (i % 2 === 0 ? -30 : 30) }}
                                            className="absolute left-1/2 top-1/2 w-1 h-1 bg-blue-400 rounded-full"
                                        />
                                    ))}
                                </div>
                            )}
                        </button>

                        {/* Label */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center px-6 py-2 bg-black/80 backdrop-blur-md rounded-full border border-white/5 shadow-2xl"
                        >
                            <div className="flex items-center gap-2 mb-0.5">
                                <Box className="w-3 h-3 text-emerald-400" />
                                <span className="text-[9px] uppercase tracking-[0.4em] text-white font-bold">Genesis Crystal</span>
                            </div>
                            <p className="text-[7px] text-gray-500 uppercase tracking-widest">
                                Manifested with {score}% Accuracy
                            </p>
                        </motion.div>

                        {/* Floating Stats */}
                        <AnimatePresence>
                            {isHovered && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute bottom-32 w-64 bg-[#050510]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-2xl pointer-events-none"
                                >
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[8px] uppercase tracking-widest text-gray-500 font-bold">Concept Density</span>
                                            <span className="text-[8px] text-blue-400 font-mono">1.24 GB/s</span>
                                        </div>
                                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${score}%` }}
                                                className="h-full bg-gradient-to-r from-blue-500 to-emerald-500"
                                            />
                                        </div>
                                        <div className="flex justify-between items-center pt-2 border-t border-white/5">
                                            <div className="flex items-center gap-1.5">
                                                <Cpu className="w-2.5 h-2.5 text-orange-400" />
                                                <span className="text-[8px] text-gray-400 uppercase tracking-tighter">Neural Weights Verified</span>
                                            </div>
                                            <Sparkles className="w-2.5 h-2.5 text-blue-400" />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
