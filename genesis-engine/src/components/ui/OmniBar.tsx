'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Mic, 
    Camera, 
    Paperclip, 
    Send, 
    Brain, 
    Zap, 
    Loader2, 
    X,
    Terminal,
    Cpu,
    ShieldAlert
} from 'lucide-react';
import { useGenesisEngine } from '@/hooks/useGenesisEngine';
import { routeIntentLocally, executeLocalTool } from '@/lib/ai/edgeRouter';
import { generateSimulationLogic, getEmbedding } from '@/app/actions';
import { queryKnowledge } from '@/lib/db/pglite';

interface OmniBarProps {
    onCameraClick: () => void;
    onFileSelect: (file: File) => void;
}

export const OmniBar: React.FC<OmniBarProps> = ({ onCameraClick, onFileSelect }) => {
    const [prompt, setPrompt] = useState('');
    const [status, setStatus] = useState<'idle' | 'compiling' | 'error'>('idle');
    const [isListening, setIsListening] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const { 
        setWorldState, 
        setError, 
        setLastHypothesis, 
        setIsSabotaged,
        interactionState,
        handleIngest
    } = useGenesisEngine();

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [prompt]);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!prompt.trim() || status === 'compiling') return;

        // 1. Local Edge Routing (FunctionGemma Protocol)
        const localTool = await routeIntentLocally(prompt);
        if (localTool) {
            executeLocalTool(localTool, (action) => {
                console.log("[OmniBar] Local Action:", action);
            });
            setPrompt('');
            return;
        }

        setStatus('compiling');
        setError(null);

        try {
            // 2. Context Retrieval (RAG)
            const embResult = await getEmbedding(prompt);
            let contextText = "";
            if (embResult.success && embResult.embedding) {
                const contextResults = await queryKnowledge(embResult.embedding);
                contextText = contextResults.map((r) => (r as { content: string }).content).join('\n---\n');
            }

            // 3. Orchestrator Flow
            const result = await generateSimulationLogic(prompt, contextText);

            if (result.success && result.worldState) {
                setWorldState(result.worldState);
                setIsSabotaged(result.isSabotaged || false);
                setLastHypothesis(prompt);
                setPrompt('');
                setStatus('idle');
            } else {
                throw new Error(result.error || 'Logic compilation failed');
            }
        } catch (err) {
            console.error('[OmniBar] Error:', err);
            setStatus('error');
            setError(err instanceof Error ? err.message : 'Unknown error');
            setTimeout(() => setStatus('idle'), 2000);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onFileSelect(file);
            // Optionally trigger ingestion directly
            // handleIngest(file.name, 'pdf');
        }
    };

    return (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-3xl px-6 z-[1000]">
            {/* Interaction Badges */}
            <div className="absolute -top-10 left-8 flex gap-3">
                <AnimatePresence>
                    {interactionState === 'BUILDING' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 px-3 py-1 bg-blue-600 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                            <Brain className="w-3 h-3 text-white animate-pulse" />
                            <span className="text-[10px] font-black uppercase text-white tracking-widest">Thinking...</span>
                        </motion.div>
                    )}
                    {interactionState === 'REFLECTION' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 px-3 py-1 bg-red-600 rounded-full shadow-[0_0_20px_rgba(220,38,38,0.4)]">
                            <ShieldAlert className="w-3 h-3 text-white animate-bounce" />
                            <span className="text-[10px] font-black uppercase text-white tracking-widest">Anomaly Detected</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <motion.div
                layout
                animate={{
                    borderColor: status === 'error' ? 'rgba(239, 68, 68, 0.5)' : 
                                status === 'compiling' ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.1)'
                }}
                className="relative bg-black/40 backdrop-blur-3xl rounded-[32px] border border-white/10 shadow-2xl overflow-hidden p-2 transition-all duration-500"
            >
                <div className="flex items-end gap-2 px-2 py-1">
                    {/* Tool Buttons */}
                    <div className="flex items-center gap-1 pb-1">
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="p-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all"
                        >
                            <Paperclip className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={onCameraClick}
                            className="p-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all"
                        >
                            <Camera className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Hidden Inputs */}
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={onFileChange} 
                        className="hidden" 
                        accept=".pdf"
                    />

                    {/* Text Input */}
                    <textarea
                        ref={textareaRef}
                        rows={1}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask Genesis anything..."
                        disabled={status === 'compiling'}
                        className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-gray-500 text-base font-medium py-3 px-2 resize-none max-h-48 scrollbar-none"
                    />

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pb-1 pr-1">
                        <button 
                            onClick={() => setIsListening(!isListening)}
                            className={`p-3 rounded-2xl transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <Mic className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => handleSubmit()}
                            disabled={!prompt.trim() || status === 'compiling'}
                            className={`
                                p-3 rounded-2xl transition-all
                                ${!prompt.trim() ? 'text-gray-700 bg-white/5 cursor-not-allowed' : 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:scale-105 active:scale-95'}
                            `}
                        >
                            {status === 'compiling' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Cyber-Zen Progress Bar */}
                {status === 'compiling' && (
                    <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 2, ease: "easeInOut" }}
                        className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 origin-left"
                    />
                )}
            </motion.div>
        </div>
    );
};
