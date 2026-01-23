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
        setError
    } = engine;

    return (
        <motion.div
            key="simulation-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 pointer-events-none"
        >
            <div className="absolute top-8 left-0 right-0 flex justify-center pointer-events-auto">
                <button 
                    onClick={() => {
                        setActiveNode(null);
                        setWorldState(null); // Reset Physics
                        setError(null); // Clear errors
                    }}
                    className="px-4 py-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-[10px] uppercase font-bold tracking-widest text-gray-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2 shadow-lg"
                >
                    <X className="w-3 h-3" /> Exit Simulation
                </button>
            </div>
            
            {/* The rest of the screen is dedicated to the Holodeck (rendered in parent) */}
        </motion.div>
    );
};
