'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Volume2, Globe, Activity } from 'lucide-react';
import { translatePhysicsIntent } from '@/app/actions/babel';
import { WorldState } from '@/lib/simulation/schema';

interface BabelNodeProps {
    worldState?: WorldState;
    onPhysicsUpdate: (delta: any) => void;
}

export function BabelNode({ worldState, onPhysicsUpdate }: BabelNodeProps) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [translation, setTranslation] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Web Speech API Refs
    const recognitionRef = useRef<any>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            // Initialize Speech Recognition
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = false;
                recognition.interimResults = true;
                recognition.lang = 'en-US'; // Default to auto-detect behavior ideally, but explicit for now

                recognition.onstart = () => setIsListening(true);
                recognition.onend = () => setIsListening(false);
                recognition.onresult = (event: any) => {
                    const current = event.resultIndex;
                    const transcriptText = event.results[current][0].transcript;
                    setTranscript(transcriptText);
                };

                recognitionRef.current = recognition;
            }

            // Initialize TTS
            synthRef.current = window.speechSynthesis;
        }
    }, []);

    const startListening = () => {
        setTranscript('');
        setTranslation('');
        recognitionRef.current?.start();
    };

    const stopListening = async () => {
        recognitionRef.current?.stop();
        if (!transcript) return;

        setIsProcessing(true);
        
        // Call the Brain
        const result = await translatePhysicsIntent(transcript, worldState, 'English'); // Default target
        
        setIsProcessing(false);

        if (result.success && result.data) {
            const { physicsDelta, translatedCommentary } = result.data as any;
            
            // The Hand: Apply Physics
            if (physicsDelta) {
                onPhysicsUpdate(physicsDelta);
            }

            // The Mouth: Speak Translation
            if (translatedCommentary && synthRef.current) {
                setTranslation(translatedCommentary);
                const utterance = new SpeechSynthesisUtterance(translatedCommentary);
                synthRef.current.speak(utterance);
            }
        }
    };

    return (
        <div className="flex flex-col items-center gap-2 p-4 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl w-64">
            {/* Header */}
            <div className="flex items-center justify-between w-full text-xs text-cyan-400 font-mono tracking-widest uppercase mb-2">
                <span className="flex items-center gap-1"><Globe size={12} /> Babel Node</span>
                <span className={isListening ? "animate-pulse text-red-400" : "text-gray-600"}>
                    {isListening ? "REC" : "IDLE"}
                </span>
            </div>

            {/* Visualization */}
            <div className="relative w-full h-12 bg-black/50 rounded-lg overflow-hidden border border-white/5 flex items-center justify-center">
                {isProcessing ? (
                    <Activity className="text-cyan-400 animate-spin" size={20} />
                ) : (
                    <div className="flex gap-1 items-center h-full">
                         {/* Fake waveform */}
                        {[...Array(5)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="w-1 bg-cyan-500/50 rounded-full"
                                animate={{ height: isListening ? [10, 30, 10] : 4 }}
                                transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Subtitles */}
            <AnimatePresence>
                {(transcript || translation) && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="w-full text-center space-y-1"
                    >
                        {transcript && <p className="text-[10px] text-gray-400 italic">"{transcript}"</p>}
                        {translation && <p className="text-xs text-white font-bold text-shadow-glow">"{translation}"</p>}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Controls */}
            <button
                onMouseDown={startListening}
                onMouseUp={stopListening}
                onTouchStart={startListening}
                onTouchEnd={stopListening}
                className={`
                    mt-2 w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200
                    ${isListening ? 'bg-red-500/20 border-red-500 text-red-400 scale-110' : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20'}
                    border-2 shadow-[0_0_15px_rgba(0,0,0,0.3)]
                `}
            >
                <Mic size={24} />
            </button>
            
            <p className="text-[9px] text-gray-600 mt-1">HOLD TO SPEAK</p>
        </div>
    );
}
