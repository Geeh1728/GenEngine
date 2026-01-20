'use client';

import React from 'react';
import { motion } from 'framer-motion';

export const NeuralMap: React.FC = () => {
    return (
        <div className="relative w-full h-[300px] flex items-center justify-center overflow-hidden">
            {/* Central Node */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-4 h-4 rounded-full bg-blue-500 shadow-[0_0_20px_white]"
            />

            {/* Dynamic connections */}
            {[...Array(12)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                        opacity: [0, 0.3, 0],
                        scale: [0, 1.5, 0],
                        rotate: i * 30,
                        x: [0, Math.cos(i * 30 * (Math.PI / 180)) * 150, 0],
                        y: [0, Math.sin(i * 30 * (Math.PI / 180)) * 150, 0],
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        delay: i * 0.2,
                        ease: "easeInOut",
                    }}
                    className="absolute w-1 h-1 bg-purple-400 rounded-full"
                >
                    <div className="absolute inset-0 bg-blue-400 blur-[2px]" />
                </motion.div>
            ))}

            {/* Connecting Lines (svg) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                <defs>
                    <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                </defs>
                {[...Array(6)].map((_, i) => (
                    <motion.line
                        key={i}
                        x1="50%"
                        y1="50%"
                        x2={`${50 + Math.cos(i * 60 * (Math.PI / 180)) * 40}%`}
                        y2={`${50 + Math.sin(i * 60 * (Math.PI / 180)) * 40}%`}
                        stroke="url(#line-gradient)"
                        strokeWidth="1"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: [0, 1, 0] }}
                        transition={{ duration: 4, repeat: Infinity, delay: i * 0.5 }}
                    />
                ))}
            </svg>

            <div className="absolute bottom-4 left-0 right-0 text-center">
                <p className="text-[10px] uppercase tracking-[0.4em] text-blue-400/50 font-medium">
                    Mapping Neural Pathways
                </p>
            </div>
        </div>
    );
};
