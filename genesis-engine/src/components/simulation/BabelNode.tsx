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

    // Headless Component: No visible UI, just logic hook
    return null;
};
