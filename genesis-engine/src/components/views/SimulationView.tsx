'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useGenesisEngine } from '@/hooks/useGenesisEngine';

interface SimulationViewProps {
    engine: ReturnType<typeof useGenesisEngine>;
}

export const SimulationView: React.FC<SimulationViewProps> = ({ engine }) => {
    const {
        setActiveNode,
        setWorldState,
        setError,
        worldState
    } = engine;

    return (
        <motion.div
            key="simulation-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 pointer-events-none flex flex-col"
        >
            {/* Dynamic Header Overlay */}
            <div className="p-8 md:p-12 max-w-2xl">
                <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-2"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400/60">
                            Neural Reality Compiled
                        </span>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-outfit font-black text-white tracking-tighter uppercase">
                        {worldState?.scenario || "Manifesting Reality..."}
                    </h2>
                    <p className="text-sm md:text-base text-gray-400 font-medium leading-relaxed max-w-lg">
                        {worldState?.explanation || "Establishing high-fidelity neural link to physical parameters."}
                    </p>
                </motion.div>
            </div>

            <div className="mt-auto p-12 flex justify-center pointer-events-auto">
                <button 
                    onClick={() => {
                        setActiveNode(null);
                        setWorldState(null); // Reset Physics
                        setError(null); // Clear errors
                    }}
                    className="px-6 py-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full text-[10px] uppercase font-black tracking-[0.3em] text-gray-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-3 shadow-2xl active:scale-95"
                >
                    <X className="w-4 h-4" /> Shutdown Simulation
                </button>
            </div>
            
            {/* The rest of the screen is dedicated to the Holodeck (rendered in parent) */}
        </motion.div>
    );
};
