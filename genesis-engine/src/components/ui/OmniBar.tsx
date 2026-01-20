'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Mic, 
    Camera, 
    Paperclip, 
    Send, 
    Play,
    Brain, 
    Zap, 
    Loader2, 
    X,
    ShieldAlert
} from 'lucide-react';
import { useGenesisEngine } from '@/hooks/useGenesisEngine';
import { routeIntentLocally, executeLocalTool } from '@/lib/ai/edgeRouter';
import { generateSimulationLogic, getEmbedding } from '@/app/actions';
import { queryKnowledge } from '@/lib/db/pglite';

interface OmniBarProps {
    onCameraClick: () => void;
}

export const OmniBar: React.FC<OmniBarProps> = ({ onCameraClick }) => {
    const [prompt, setPrompt] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
        handleIngest,
        isProcessing
    } = useGenesisEngine();

    const isYouTube = /youtube\.com|youtu\.be/.test(prompt);
    const isThinking = isProcessing || interactionState === 'BUILDING';

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    }, [prompt]);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if ((!prompt.trim() && !selectedFile) || status === 'compiling') return;

        // 1. Handle PDF Ingestion separately
        if (selectedFile && selectedFile.type === 'application/pdf') {
            handleIngest(selectedFile);
            setSelectedFile(null);
            setPrompt('');
            return;
        }

        // 2. Local Edge Routing (FunctionGemma Protocol)
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
            // 3. Convert Image to Base64 (if any)
            let imageBase64 = undefined;
            if (selectedFile && selectedFile.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.readAsDataURL(selectedFile);
                await new Promise(r => reader.onload = r);
                imageBase64 = reader.result as string;
            }

            // 4. Context Retrieval (RAG)
            const embResult = await getEmbedding(prompt);
            let contextText = "";
            if (embResult && embResult.success && embResult.embedding) {
                const contextResults = await queryKnowledge(embResult.embedding);
                contextText = contextResults.map((r) => (r as { content: string }).content).join('\n---\n');
            }

            // 5. Orchestrator Flow via Server Action
            const result = await generateSimulationLogic(prompt, contextText);

            if (result.success && result.worldState) {
                setWorldState(result.worldState);
                setIsSabotaged(result.isSabotaged || false);
                setLastHypothesis(prompt);
                setPrompt('');
                setSelectedFile(null);
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
            setSelectedFile(file);
        }
    };

    return (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-3xl px-6 z-[1000]">
            {/* 1. File Preview Pill */}
            <AnimatePresence>
                {selectedFile && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        className="absolute -top-14 left-8 flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full text-white text-[10px] font-bold shadow-2xl"
                    >
                        <Paperclip className="w-3 h-3 opacity-50" />
                        <span className="truncate max-w-[150px]">{selectedFile.name}</span>
                        <button 
                            onClick={() => setSelectedFile(null)}
                            className="p-1 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 2. Interaction Badges */}
            <div className="absolute -top-10 left-8 flex gap-3">
                <AnimatePresence>
                    {isThinking && (
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
                                isThinking ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.1)',
                    boxShadow: isThinking ? '0 0 30px rgba(59, 130, 246, 0.2)' : '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }}
                className="relative bg-black/40 backdrop-blur-3xl rounded-[32px] border border-white/10 overflow-hidden p-2 transition-all duration-500"
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

                    {/* Hidden Input */}
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={onFileChange} 
                        className="hidden" 
                        accept="image/*,.pdf"
                    />

                    {/* Text Input */}
                    <textarea
                        ref={textareaRef}
                        rows={1}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isThinking ? "Consulting the Council..." : "Ask Genesis / Paste YouTube URL..."}
                        disabled={isThinking}
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
                            disabled={(!prompt.trim() && !selectedFile) || isThinking}
                            className={`
                                p-3 rounded-2xl transition-all
                                ${(!prompt.trim() && !selectedFile) ? 'text-gray-700 bg-white/5 cursor-not-allowed' : 'bg-white text-black shadow-lg shadow-white/10 hover:scale-105 active:scale-95'}
                            `}
                        >
                            {status === 'compiling' ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                isYouTube ? <Play className="w-5 h-5 fill-current" /> : <Send className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Cyber-Zen Progress Bar */}
                {isThinking && (
                    <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
                        className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 origin-left"
                    />
                )}
            </motion.div>
        </div>
    );
};