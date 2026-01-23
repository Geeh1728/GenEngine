'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TreePine } from 'lucide-react';

interface NavigationHeaderProps {
    setIsGardenOpen: (open: boolean) => void;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({ setIsGardenOpen }) => {
    return (
        <nav className="relative z-50 flex justify-between items-center px-12 py-6 border-b border-white/5 backdrop-blur-md bg-black/20">
            <div className="flex items-center gap-3">
                <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                >
                    <span className="font-outfit font-black text-xs text-white">GE</span>
                </motion.div>
                <span className="text-sm font-outfit font-bold uppercase tracking-[0.4em] text-gray-400">Genesis Engine</span>
            </div>
            <div className="flex items-center gap-8">
                <button
                    onClick={() => setIsGardenOpen(true)}
                    className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-emerald-500/20 transition-all flex items-center gap-2 pointer-events-auto shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                >
                    <TreePine className="w-3 h-3" />
                    Mind Garden
                </button>
                <span className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">Node: Alpha-7</span>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
            </div>
        </nav>
    );
};
