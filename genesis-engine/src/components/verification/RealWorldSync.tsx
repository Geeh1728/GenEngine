'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, Minimize2, Video, Play } from 'lucide-react';

interface RealWorldSyncProps {
    // sourceType: 'pdf' | 'youtube';
    sourceTitle: string;
    youtubeId?: string;
}

export const RealWorldSync: React.FC<RealWorldSyncProps> = ({ sourceTitle, youtubeId }) => {
    const [isMinimized, setIsMinimized] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    // Default to a relevant lab video if none provided (e.g., Double Slit Lab)
    const videoId = youtubeId || "A9tKncAdlHQ"; // Veritassium Double Slit as default fallback

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{
                opacity: 1,
                y: 0,
                width: isMinimized ? 200 : 320,
                height: isMinimized ? 40 : 220
            }}
            className="fixed bottom-24 right-12 z-[60] bg-[#050510]/90 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/5">
                <div className="flex items-center gap-2">
                    <Video className="w-3 h-3 text-blue-400" />
                    <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold whitespace-nowrap">
                        Real-World Sync
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="text-gray-500 hover:text-white transition-colors"
                    >
                        {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
                    </button>
                </div>
            </div>

            {/* Video Content */}
            <AnimatePresence>
                {!isMinimized && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-1 relative group"
                    >
                        {!isPlaying ? (
                            <div
                                className="absolute inset-0 bg-black flex flex-col items-center justify-center cursor-pointer group"
                                onClick={() => setIsPlaying(true)}
                            >
                                <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/20 transition-all">
                                    <Play className="w-5 h-5 text-blue-400 fill-blue-400" />
                                </div>
                                <p className="mt-4 text-[10px] text-gray-500 uppercase tracking-widest font-medium">Verify Experiment</p>

                                {/* Overlay Text */}
                                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black to-transparent">
                                    <p className="text-[10px] text-white font-bold truncate">{sourceTitle}</p>
                                    <p className="text-[8px] text-gray-400 uppercase tracking-tighter mt-1">Grounded Evidence Pipeline</p>
                                </div>
                            </div>
                        ) : (
                            <iframe
                                className="w-full h-full"
                                src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                                title="YouTube video player"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                            />
                        )}

                        {/* Verification Badge */}
                        <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 rounded text-[7px] text-emerald-400 font-bold uppercase tracking-widest">
                            Verified Source
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Footer (Minimized state only) */}
            {isMinimized && (
                <div className="flex-1 px-4 flex items-center">
                    <p className="text-[10px] text-blue-400 font-bold truncate">Syncing with Lab Evidence...</p>
                </div>
            )}
        </motion.div>
    );
};
