'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Youtube, Loader2 } from 'lucide-react';

interface NexusCircleProps {
    onIngest: (source: string, type: 'pdf' | 'youtube') => void;
    isProcessing: boolean;
}

export const NexusCircle: React.FC<NexusCircleProps> = ({ onIngest, isProcessing }) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const [youtubeUrl, setYoutubeUrl] = useState('');

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        // For now, we'll assume PDF text is dropped or just simulate the trigger
        // Real PDF parsing would involve a file reader here.
        onIngest("Sample PDF Content Dropped", "pdf");
    };

    const handleYoutubeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (youtubeUrl.trim()) {
            onIngest(youtubeUrl, "youtube");
            setYoutubeUrl('');
        }
    };

    return (
        <div className="relative flex flex-col items-center justify-center">
            <motion.div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                animate={{
                    scale: isDragOver ? 1.1 : 1,
                    boxShadow: isDragOver
                        ? "0 0 100px 20px rgba(59, 130, 246, 0.5)"
                        : "0 0 60px 10px rgba(59, 130, 246, 0.2)",
                }}
                className={`relative w-80 h-80 rounded-full border-2 border-dashed transition-colors duration-500 flex flex-col items-center justify-center backdrop-blur-3xl overflow-hidden
          ${isDragOver ? 'border-blue-400 bg-blue-500/10' : 'border-white/10 bg-white/5'}
          ${isProcessing ? 'border-purple-500/50' : ''}
        `}
            >
                {/* Inner Glow */}
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 via-transparent to-purple-600/10 animate-spin-slow" />

                <AnimatePresence mode="wait">
                    {isProcessing ? (
                        <motion.div
                            key="loader"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="z-10 flex flex-col items-center"
                        >
                            <Loader2 className="w-12 h-12 text-blue-400 animate-spin mb-4" />
                            <p className="text-blue-300 font-medium tracking-widest text-xs uppercase animate-pulse">
                                Synchronizing Theory
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="idle"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="z-10 flex flex-col items-center text-center px-8"
                        >
                            <FileText className="w-12 h-12 text-white/40 mb-4" />
                            <h3 className="text-white font-semibold text-lg mb-2">The Nexus</h3>
                            <p className="text-gray-400 text-xs leading-relaxed">
                                Drop PDF or paste YouTube URL to manifest reality
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Orbiting Particles (Visual Only) */}
                {!isProcessing && (
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-blue-400 rounded-full animate-ping" />
                        <div className="absolute bottom-1/4 right-1/4 w-1 h-1 bg-purple-400 rounded-full animate-ping delay-700" />
                    </div>
                )}
            </motion.div>

            {/* YouTube Entry */}
            <AnimatePresence>
                {!isProcessing && (
                    <motion.form
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        onSubmit={handleYoutubeSubmit}
                        className="mt-12 w-full max-w-sm flex gap-2"
                    >
                        <div className="relative flex-1">
                            <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                            <input
                                type="text"
                                placeholder="https://youtube.com/watch?v=..."
                                value={youtubeUrl}
                                onChange={(e) => setYoutubeUrl(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-full py-2.5 pl-10 pr-4 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-600"
                            />
                        </div>
                        <button
                            type="submit"
                            className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-6 text-xs font-bold text-white transition-all uppercase tracking-widest"
                        >
                            Link
                        </button>
                    </motion.form>
                )}
            </AnimatePresence>
        </div>
    );
};
