'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Particle {
    id: number;
    x: number;
    y: number;
    size: number;
    duration: number;
    delay: number;
    deltaX: number;
    deltaY: number;
}

export const NeuralBackground: React.FC = () => {
    // Use state to hold particles, ensuring generation happens only on client-side mount
    const [particles, setParticles] = useState<Particle[]>([]);

    useEffect(() => {
        const generatedParticles = Array.from({ length: 40 }).map((_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 4 + 1,
            duration: Math.random() * 20 + 10,
            delay: Math.random() * 5,
            deltaX: (Math.random() - 0.5) * 5,
            deltaY: (Math.random() - 0.5) * 5,
        }));
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setParticles(generatedParticles);
    }, []);

    return (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-[#020205]">
            {/* Base Gradients */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-[120px] animate-pulse delay-700" />
            <div className="absolute top-1/4 left-1/3 w-[40%] h-[40%] bg-emerald-900/5 rounded-full blur-[150px] animate-pulse delay-1000" />

            {/* Neural Web Particles */}
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                        opacity: [0.1, 0.4, 0.1],
                        scale: [1, 1.2, 1],
                        x: [`${p.x}%`, `${p.x + p.deltaX}%`, `${p.x}%`],
                        y: [`${p.y}%`, `${p.y + p.deltaY}%`, `${p.y}%`],
                    }}
                    transition={{
                        duration: p.duration,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: p.delay,
                    }}
                    style={{
                        position: 'absolute',
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: p.size,
                        height: p.size,
                        background: p.id % 3 === 0 ? '#3b82f6' : p.id % 3 === 1 ? '#8b5cf6' : '#10b981',
                        borderRadius: '50%',
                        boxShadow: `0 0 10px ${p.id % 3 === 0 ? '#3b82f6' : p.id % 3 === 1 ? '#8b5cf6' : '#10b981'}`,
                    }}
                />
            ))}

            {/* Holographic Data Streams */}
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none">
                {Array.from({ length: 10 }).map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ y: '-100%' }}
                        animate={{ y: '200%' }}
                        transition={{
                            duration: Math.random() * 5 + 5,
                            repeat: Infinity,
                            ease: "linear",
                            delay: Math.random() * 5
                        }}
                        className="absolute w-[1px] h-[40%] bg-gradient-to-b from-transparent via-blue-500 to-transparent"
                        style={{ left: `${Math.random() * 100}%` }}
                    />
                ))}
            </div>

            {/* Grid Overlay */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
                    backgroundSize: '40px 40px',
                }}
            />
        </div>
    );
};
