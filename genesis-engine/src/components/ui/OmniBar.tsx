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
    Search,
    Loader2,
    X,
    ShieldAlert,
    MessageCircle
} from 'lucide-react';
import { useGenesisStore } from '@/lib/store/GenesisContext';
import { routeIntentLocally, executeLocalTool } from '@/lib/ai/edgeRouter';
import { generateSimulationLogic, getEmbedding } from '@/app/actions';
import { queryKnowledge } from '@/lib/db/pglite';
import { sfx } from '@/lib/sound/SoundManager';

interface OmniBarProps {
    onCameraClick: () => void;
    initialPrompt?: string; // Optional prompt from parent
    externalPrompt?: string; // Controlled prop
    onPromptChange?: (val: string) => void; // Controlled prop handler
    handleIngest: (file: File) => Promise<void>; // Logical function remains for now or move to action
}

export const OmniBar: React.FC<OmniBarProps> = React.memo(({ onCameraClick, externalPrompt, onPromptChange, handleIngest }) => {
    const { state, dispatch } = useGenesisStore();
    const { worldState, isSabotaged, isProcessing, fileUri } = state;

    // Internal state is fallback if no external control provided
    const [internalPrompt, setInternalPrompt] = useState('');

    // Use controlled or uncontrolled state
    const prompt = externalPrompt !== undefined ? externalPrompt : internalPrompt;
    const setPrompt = onPromptChange || setInternalPrompt;

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [status, setStatus] = useState<'idle' | 'compiling' | 'error'>('idle');
    const [isListening, setIsListening] = useState(false);
    const [isLongRunning, setIsLongRunning] = useState(false);
    const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isYouTube = /youtube\.com|youtu\.be/.test(prompt);
    const isThinking = isProcessing; // Simplified logic without interactionState

    // Track Online Status
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    }, [prompt]);

    // Handle Long Running State
    useEffect(() => {
        let timeout: NodeJS.Timeout;
        if (isThinking) {
            setIsLongRunning(false);
            timeout = setTimeout(() => {
                setIsLongRunning(true);
            }, 5000);
        } else {
            setIsLongRunning(false);
        }
        return () => clearTimeout(timeout);
    }, [isThinking]);

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
                sfx.playSuccess();
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                dispatch(action as any);
            });
            setPrompt('');
            return;
        }

        setStatus('compiling');
        dispatch({ type: 'SET_PROCESSING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });

        try {
            // 3. Context Retrieval (RAG)
            const embResult = await getEmbedding(prompt);
            let contextText = "";
            if (embResult.success) {
                const contextResults = await queryKnowledge(embResult.embedding);
                contextText = contextResults.map((r) => (r as { content: string }).content).join('\n---\n');
            }

            // 4. Orchestrator Flow via Server Action
            const currentState = worldState; 
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Neural Link Timeout")), 45000)
            );

            const result: any = await Promise.race([
                generateSimulationLogic(prompt, contextText, currentState, fileUri || undefined),
                timeoutPromise
            ]);

            if (result.success) {
                sfx.playSuccess();
                dispatch({ type: 'SYNC_WORLD', payload: result.worldState });
                dispatch({ type: 'SET_SABOTAGED', payload: result.isSabotaged || false });
                dispatch({ type: 'SET_HYPOTHESIS', payload: prompt });
                
                if (result.logs) {
                    result.logs.forEach((log: any) => dispatch({ type: 'ADD_MISSION_LOG', payload: log }));
                }

                setPrompt('');
                setSelectedFile(null);
                setStatus('idle');
            } else {
                if (result.logs) {
                    result.logs.forEach((log: any) => dispatch({ type: 'ADD_MISSION_LOG', payload: log }));
                }
                throw new Error(result.error || 'Logic compilation failed');
            }
        } catch (err) {
            console.error('[OmniBar] Error:', err);
            const msg = err instanceof Error ? err.message : 'Unknown error';
            
            // FAILOVER: Trigger Resilience Voxel Mode on API failure
            dispatch({ 
                type: 'SYNC_WORLD', 
                payload: {
                    scenario: "Resilience Voxel Grid",
                    mode: "VOXEL",
                    voxels: [
                        { x: 0, y: 0, z: 0, color: '#3b82f6' },
                        { x: 1, y: 0, z: 0, color: '#3b82f6' },
                        { x: 0, y: 1, z: 0, color: '#3b82f6' }
                    ],
                    constraints: ["Emergency Voxel Rendering Active"],
                    successCondition: "Observe geometry",
                    description: "The primary physics link failed. Initiating low-level voxel visualization.",
                    explanation: "System Error Detected. Falling back to primitive geometry to maintain visual feed."
                } as any
            });

            if (msg.includes('?') || msg.toLowerCase().includes('considering')) {
                dispatch({ type: 'SET_CHALLENGE', payload: msg });
                setStatus('idle');
            } else {
                setStatus('error');
                dispatch({ type: 'SET_ERROR', payload: `Link Error: ${msg}. Voxel failover active.` });
                setTimeout(() => setStatus('idle'), 5000);
            }
        } finally {
            dispatch({ type: 'SET_PROCESSING', payload: false });
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

    const handleWhatsAppShare = () => {
        if (!worldState) return;
        // Use a persistent room ID for the session if possible, or generate a new one
        const roomId = Math.random().toString(36).substring(7);
        const url = `${window.location.origin}${window.location.pathname}?s=${roomId}`;
        const text = `I built a "${worldState.scenario}" in Genesis. Can you beat it? Check it out here: ${url}`;
        const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(waUrl, '_blank');
        sfx.playSuccess();
    };

    return (
        <div className="fixed bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 w-full max-w-full md:max-w-3xl px-4 md:px-6 z-[1000]">
            {/* 1. File Preview Pill */}
            <AnimatePresence>
                {selectedFile && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        className="absolute -top-14 left-4 md:left-8 flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full text-white text-[10px] font-bold shadow-2xl"
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
            <div className="absolute -top-10 left-4 md:left-8 flex flex-wrap gap-2 md:gap-3">
                <AnimatePresence>
                    {!isOnline && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 px-3 py-1 bg-amber-600 rounded-full shadow-[0_0_20px_rgba(217,119,6,0.4)] border border-amber-400/50">
                            <ShieldAlert className="w-3 h-3 text-white animate-pulse" />
                            <span className="text-[10px] font-black uppercase text-white tracking-widest">Genesis: Offline Mode</span>
                        </motion.div>
                    )}
                    {isThinking && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 px-3 py-1 bg-blue-600 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                            <Brain className="w-3 h-3 text-white animate-pulse" />
                            <span className="text-[10px] font-black uppercase text-white tracking-widest">
                                {isLongRunning ? "Architecting Complex Reality..." : "Thinking..."}
                            </span>
                        </motion.div>
                    )}
                    {isSabotaged && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 px-3 py-1 bg-red-600 rounded-full shadow-[0_0_20px_rgba(220,38,38,0.4)]">
                            <ShieldAlert className="w-3 h-3 text-white animate-bounce" />
                            <span className="text-[10px] font-black uppercase text-white tracking-widest">Anomaly Detected</span>
                        </motion.div>
                    )}
                    {isOnline && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 px-3 py-1 bg-cyan-600/20 border border-cyan-500/30 rounded-full">
                            <Search className="w-3 h-3 text-cyan-400" />
                            <span className="text-[10px] font-black uppercase text-cyan-400 tracking-widest">Deep Research Active</span>
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
                className="relative bg-black/40 backdrop-blur-3xl rounded-[24px] md:rounded-[32px] border border-white/10 overflow-hidden p-2 md:p-2 transition-all duration-500"
            >
                <div className="flex flex-col md:flex-row items-stretch md:items-end gap-2 md:gap-2 px-1 md:px-2">
                    {/* Mobile: Top Action Bar / Desktop: Left Tools */}
                    <div className="flex items-center justify-between md:justify-start gap-2 pb-2 md:pb-0 border-b border-white/5 md:border-none mb-1 md:mb-0 w-full md:w-auto">
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2 md:p-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl md:rounded-2xl transition-all"
                            >
                                <Paperclip className="w-4 h-4 md:w-5 md:h-5" />
                            </button>
                            <button
                                onClick={() => onCameraClick()}
                                className="p-2 md:p-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl md:rounded-2xl transition-all"
                            >
                                <Camera className="w-4 h-4 md:w-5 md:h-5" />
                            </button>
                        </div>
                        
                        {/* Mobile Right Actions */}
                        <div className="md:hidden flex items-center gap-1">
                             <button
                                onClick={() => setIsListening(!isListening)}
                                className={`p-2 rounded-xl transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                            >
                                <Mic className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleSubmit()}
                                disabled={(!prompt.trim() && !selectedFile) || isThinking}
                                className={`
                                    p-2 rounded-xl transition-all
                                    ${(!prompt.trim() && !selectedFile) ? 'text-gray-700 bg-white/5' : 'bg-white text-black'}
                                `}
                            >
                                {status === 'compiling' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={onFileChange}
                        className="hidden"
                        accept="image/*,.pdf"
                    />

                    <textarea
                        ref={textareaRef}
                        rows={1}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isThinking ? "Consulting the Council..." : "Ask Genesis..."}
                        disabled={isThinking}
                        className="flex-1 w-full bg-transparent border-none outline-none text-white placeholder:text-gray-500 text-sm md:text-base font-medium py-2 md:py-3 px-2 resize-none max-h-32 md:max-h-48 scrollbar-none font-mono"
                    />

                    <div className="hidden md:flex items-center gap-2 pb-1 pr-1">
                        {worldState && (
                            <button
                                onClick={handleWhatsAppShare}
                                className="p-3 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/5 rounded-2xl transition-all"
                                title="Share to WhatsApp"
                            >
                                <MessageCircle className="w-5 h-5" />
                            </button>
                        )}
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
});

OmniBar.displayName = 'OmniBar';
