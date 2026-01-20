'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, Globe, Loader2 } from 'lucide-react';
import { translatePhysicsIntent, BabelOutput } from '@/app/actions/babel';
import { WorldState } from '@/lib/simulation/schema';

interface BabelNodeProps {
    worldState: WorldState;
    onPhysicsUpdate: (delta: Partial<WorldState>) => void;
    targetLang?: string;
}

export const BabelNode: React.FC<BabelNodeProps> = ({
    worldState,
    onPhysicsUpdate,
    targetLang = 'English'
}) => {
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [lastResponse, setLastResponse] = useState<BabelOutput | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognitionRef = useRef<any>(null);
    const transcriptRef = useRef('');

    // Update transcript ref whenever state changes
    useEffect(() => {
        transcriptRef.current = transcript;
    }, [transcript]);

    const speak = useRef((text: string) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US'; 
            window.speechSynthesis.speak(utterance);
        }
    }).current;

    const handleProcessSpeech = useRef(async (text: string) => {
        setIsProcessing(true);
        try {
            const result = await translatePhysicsIntent(text, worldState, targetLang);
            if (result.success) {
                const babelResult = result as unknown as BabelOutput;
                setLastResponse(babelResult);

                // 1. Apply Physics Update
                if (Object.keys(babelResult.physicsDelta).length > 0) {
                    onPhysicsUpdate(babelResult.physicsDelta);
                }

                // 2. Speak Commentary
                speak(babelResult.translatedCommentary);
            }
        } catch (error) {
            console.error("Babel processing error:", error);
        } finally {
            setIsProcessing(false);
        }
    }).current;

    // Initialize Speech Recognition
    useEffect(() => {
        if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = true;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            recognitionRef.current.onresult = (event: any) => {
                const current = event.resultIndex;
                const transcriptText = event.results[current][0].transcript;
                setTranscript(transcriptText);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
                if (transcriptRef.current) {
                    handleProcessSpeech(transcriptRef.current);
                }
            };
        }
    }, [handleProcessSpeech]);

    const startListening = () => {
        if (recognitionRef.current) {
            setTranscript('');
            setIsListening(true);
            recognitionRef.current.start();
        } else {
            alert('Speech Recognition not supported in this browser.');
        }
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    };

    return (
        <div className="flex flex-col items-center gap-4 p-6 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl">
            <div className="flex items-center gap-4">
                <button
                    onMouseDown={startListening}
                    onMouseUp={stopListening}
                    onTouchStart={startListening}
                    onTouchEnd={stopListening}
                    className={`relative p-6 rounded-full transition-all duration-300 ${isListening
                            ? 'bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)]'
                            : 'bg-indigo-600 hover:bg-indigo-500 shadow-lg'
                        }`}
                >
                    {isProcessing ? (
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                    ) : isListening ? (
                        <Mic className="w-8 h-8 text-white" />
                    ) : (
                        <MicOff className="w-8 h-8 text-white/70" />
                    )}

                    {isListening && (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0.5 }}
                            animate={{ scale: 1.5, opacity: 0 }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="absolute inset-0 rounded-full bg-red-400 -z-10"
                        />
                    )}
                </button>

                <div className="flex flex-col">
                    <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest flex items-center gap-1">
                        <Globe className="w-3 h-3" /> Babel Node
                    </span>
                    <h3 className="text-lg font-medium text-white italic">
                        {isListening ? 'Listening...' : isProcessing ? 'Translating Intent...' : 'Hold to Speak Physics'}
                    </h3>
                </div>
            </div>

            <AnimatePresence>
                {(transcript || lastResponse) && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="w-full max-w-md p-4 bg-black/30 rounded-2xl border border-white/5 space-y-2"
                    >
                        {transcript && (
                            <div className="text-white/60 text-sm italic">
                                &quot;{transcript}&quot;
                            </div>
                        )}

                        {lastResponse && (
                            <div className="flex items-start gap-2 pt-2 border-t border-white/10">
                                <Volume2 className="w-4 h-4 text-indigo-400 mt-1 shrink-0" />
                                <div className="text-indigo-100 text-sm font-medium">
                                    {lastResponse.translatedCommentary}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
