'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Music, Shield, Globe, ChevronRight, X } from 'lucide-react';

/**
 * MISSION BRIEFING (v60.0 GOLD Onboarding)
 * Objective: Introduce users to the 'Music Theory of Reality' and 'Neural Hegemony'.
 */
export const MissionBriefing: React.FC = () => {
    const [step, setStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const hasSeen = localStorage.getItem('genesis_briefing_v60');
        if (!hasSeen) {
            setIsVisible(true);
        }
    }, []);

    const complete = () => {
        localStorage.setItem('genesis_briefing_v60', 'true');
        setIsVisible(false);
    };

    const steps = [
        {
            title: "The Music of Reality",
            description: "You are not just a user; you are an Architect. In this engine, physics IS music. Bridges are strings, and truth is a harmonic frequency.",
            icon: <Music className="w-12 h-12 text-blue-400" />
        },
        {
            title: "The Neural Hive",
            description: "Your world is powered by a Swarm of AI Giants. Gemini discovers, DeepSeek reasons, and Groq LPU weaves it all together in real-time.",
            icon: <Globe className="w-12 h-12 text-purple-400" />
        },
        {
            title: "Collective Resonance",
            description: "You are part of a Ghost Mesh. Your creations vibrate across the network. If your logic is dissonant, the world shatters. Tune it to perfection.",
            icon: <Shield className="w-12 h-12 text-emerald-400" />
        }
    ];

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-3xl p-6">
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="max-w-md w-full bg-zinc-900 border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden"
            >
                {/* Background Glow */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500" />
                
                <button onClick={complete} className="absolute top-6 right-6 text-white/30 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                </button>

                <AnimatePresence mode="wait">
                    <motion.div 
                        key={step}
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -20, opacity: 0 }}
                        className="flex flex-col items-center text-center space-y-6"
                    >
                        <div className="p-4 bg-white/5 rounded-3xl">
                            {steps[step].icon}
                        </div>
                        <h2 className="text-2xl font-black text-white tracking-tight">{steps[step].title}</h2>
                        <p className="text-gray-400 leading-relaxed text-sm">
                            {steps[step].description}
                        </p>
                    </motion.div>
                </AnimatePresence>

                <div className="mt-10 flex items-center justify-between">
                    <div className="flex gap-1.5">
                        {steps.map((_, i) => (
                            <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i === step ? 'w-6 bg-blue-500' : 'w-2 bg-white/10'}`} />
                        ))}
                    </div>
                    <button 
                        onClick={() => step < steps.length - 1 ? setStep(step + 1) : complete()}
                        className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                    >
                        {step === steps.length - 1 ? 'Enter the Aether' : 'Next'}
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
