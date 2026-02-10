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
    MessageCircle,
    Eye,
    Share2
} from 'lucide-react';
import { useGenesisStore } from '@/lib/store/GenesisContext';
import { routeIntentLocally, executeLocalTool } from '@/lib/ai/edgeRouter';
import { generateSimulationLogic, getEmbedding } from '@/app/actions';
import { queryKnowledge } from '@/lib/db/pglite';
import { sfx } from '@/lib/sound/SoundManager';
import { useWormhole } from '@/hooks/useWormhole';
import { speculator } from '@/lib/ai/speculator';
import { MasteryLogic } from '@/lib/gamification/mastery-logic';
import { GameAction } from '@/lib/multiplayer/GameState';
import { WorldState } from '@/lib/simulation/schema';

interface OmniBarProps {
    onCameraClick: () => void;
    initialPrompt?: string; // Optional prompt from parent
    externalPrompt?: string; // Controlled prop
    onPromptChange?: (val: string) => void; // Controlled prop handler
    handleIngest: (file: File) => Promise<void>; // Logical function remains for now or move to action
}

export const OmniBar: React.FC<OmniBarProps> = React.memo(({ onCameraClick, externalPrompt, onPromptChange, handleIngest }) => {
    const { state, dispatch } = useGenesisStore();
    const { worldState, isSabotaged, isProcessing, fileUri, interactionState } = state;

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
    const { generateWormholeURL } = useWormhole();

    const isYouTube = /youtube\.com|youtu\.be/.test(prompt);
    const isURL = /https?:\/\/[^\s]+/.test(prompt) && !isYouTube;
    const isThinking = isProcessing; // Simplified logic without interactionState
    const showInstrumentHints = prompt.toLowerCase().startsWith('learn');

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

        // MODULE N: NEURAL SPECULATION
        if (prompt.length > 10) {
            MasteryLogic.isFeatureAuthorized('HIVE').then(isAuth => {
                if (isAuth) speculator.speculativeProcess(prompt);
            });
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

        // 1. Handle PDF Ingestion ONLY if a file is actually present
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
                dispatch(action as GameAction);
            });
            setPrompt('');
            return;
        }

        setStatus('compiling');
        dispatch({ type: 'SET_PROCESSING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });

        try {
            // MODULE N: Consume Speculative Result
            const isHiveAuth = await MasteryLogic.isFeatureAuthorized('HIVE');
            const cachedResult = isHiveAuth ? await speculator.consumeSpeculation(prompt) : null;

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
                setTimeout(() => reject(new Error("Neural Link Timeout")), 120000)
            );

            // If we have a cached result from the swarm bees, we use it to boost the Orchestrator
            const result: any = await Promise.race([
                generateSimulationLogic(
                    prompt,
                    contextText + (cachedResult ? `\nPRE-GENERATED ASSETS: ${JSON.stringify(cachedResult)}` : ""),
                    currentState,
                    fileUri || undefined,
                    state.lastInteractionId || undefined,
                    interactionState
                ),
                timeoutPromise
            ]);

            if (result.success) {
                sfx.playSuccess();

                if (result.mutation) {
                    dispatch({ type: 'MUTATE_WORLD', payload: result.mutation });
                } else if (result.worldState) {
                    dispatch({ type: 'SYNC_WORLD', payload: { ...result.worldState, interactionId: result.interactionId } });
                    dispatch({ type: 'SET_SABOTAGED', payload: result.isSabotaged || false });
                }

                dispatch({ type: 'SET_HYPOTHESIS', payload: prompt });

                if (result.logs) {
                    result.logs.forEach((log: any) => dispatch({ type: 'ADD_MISSION_LOG', payload: log }));
                }

                setPrompt('');
                setSelectedFile(null);
                setStatus('idle');
            } else {
                // HANDLE CHALLENGE: If blocked with a question, set as challenge, not error
                if (result.isBlocked && (result.message?.includes('?') || result.nativeReply?.includes('?'))) {
                    dispatch({ type: 'SET_CHALLENGE', payload: result.message || result.nativeReply });
                    setStatus('idle');
                    setPrompt('');
                    return;
                }

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
                    domain: "SCIENCE",
                    voxels: [
                        { x: 0, y: 0, z: 0, color: '#3b82f6' },
                        { x: 1, y: 0, z: 0, color: '#3b82f6' },
                        { x: 0, y: 1, z: 0, color: '#3b82f6' }
                    ],
                    constraints: ["Emergency Voxel Rendering Active"],
                    successCondition: "Observe geometry",
                    description: "The primary physics link failed. Initiating low-level voxel visualization.",
                    explanation: "System Error Detected. Falling back to primitive geometry to maintain visual feed."
                } satisfies WorldState
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
        // SECURITY: Use cryptographically secure UUID for room IDs
        const roomId = crypto.randomUUID();
        const url = `${window.location.origin}${window.location.pathname}?s=${roomId}`;
        const text = `I built a "${worldState.scenario}" in Genesis. Can you beat it? Check it out here: ${url}`;
        const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(waUrl, '_blank');
        sfx.playSuccess();
    };

    const handleWormholeShare = async () => {
        const url = await generateWormholeURL();
        if (url) {
            navigator.clipboard.writeText(url);
            dispatch({
                type: 'ADD_MISSION_LOG',
                payload: {
                    agent: 'Astra',
                    message: "🌌 Wormhole Stabilized. Share link copied.",
                    type: 'SUCCESS'
                }
            });
            sfx.playSuccess();
        }
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
                        <motion.div key="offline-badge" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 px-3 py-1 bg-amber-600 rounded-full shadow-[0_0_20px_rgba(217,119,6,0.4)] border border-amber-400/50">
                            <ShieldAlert className="w-3 h-3 text-white animate-pulse" />
                            <span className="text-[10px] font-black uppercase text-white tracking-widest">Genesis: Offline Mode</span>
                        </motion.div>
                    )}
                    {isThinking && (
                        <motion.div key="thinking-badge" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 px-3 py-1 bg-blue-600 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                            <Brain className="w-3 h-3 text-white animate-pulse" />
                            <span className="text-[10px] font-black uppercase text-white tracking-widest">
                                {isLongRunning ? "Architecting Complex Reality..." : "Thinking..."}
                            </span>
                        </motion.div>
                    )}
                    {isSabotaged && (
                        <motion.div key="sabotage-badge" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 px-3 py-1 bg-red-600 rounded-full shadow-[0_0_20_rgba(220,38,38,0.4)]">
                            <ShieldAlert className="w-3 h-3 text-white animate-bounce" />
                            <span className="text-[10px] font-black uppercase text-white tracking-widest">Anomaly Detected</span>
                        </motion.div>
                    )}
                    {isOnline && (
                        <motion.div key="research-badge" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 px-3 py-1 bg-cyan-600/20 border border-cyan-500/30 rounded-full">
                            <Search className="w-3 h-3 text-cyan-400" />
                            <span className="text-[10px] font-black uppercase text-cyan-400 tracking-widest">Deep Research Active</span>
                        </motion.div>
                    )}
                    {isURL && (
                        <motion.div key="oracle-badge" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 px-3 py-1 bg-purple-600/20 border border-purple-500/30 rounded-full">
                            <Share2 className="w-3 h-3 text-purple-400" />
                            <span className="text-[10px] font-black uppercase text-purple-400 tracking-widest">Oracle Link Active</span>
                        </motion.div>
                    )}
                    {state.worldState && (
                        <motion.div key="sentinel-badge" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 px-3 py-1 bg-indigo-600/20 border border-indigo-500/30 rounded-full">
                            <Eye className="w-3 h-3 text-indigo-400 animate-pulse" />
                            <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Sentinel: Observing</span>
                        </motion.div>
                    )}
                    {showInstrumentHints && (
                        <motion.div key="instrument-badge" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 px-3 py-1 bg-emerald-600/20 border border-emerald-500/30 rounded-full">
                            <Mic className="w-3 h-3 text-emerald-400" />
                            <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">Instrument Forge: 🎸 🥁 🎷 🎹</span>
                        </motion.div>
                    )}
                    {state.missionLogs.filter(l => l.agent === 'VibeCoder').slice(-1).map(log => (
                        <motion.div key={log.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full text-white text-[10px] font-bold shadow-2xl">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                            <span>{log.message}</span>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <motion.div
                layout
                animate={{
                    borderColor: status === 'error' ? 'rgba(239, 68, 68, 0.5)' :
                        isThinking ? 'rgba(6, 182, 212, 0.5)' : 'rgba(255, 255, 255, 0.1)',
                    boxShadow: isThinking ? '0 0 30px rgba(6, 182, 212, 0.3)' : '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)'
                }}
                className="relative backdrop-blur-xl rounded-full border border-white/10 overflow-hidden p-2 md:p-2 transition-all duration-500"
            >
                <div className="flex flex-col md:flex-row items-stretch md:items-end gap-2 md:gap-2 px-1 md:px-2">
                    {/* Mobile: Top Action Bar / Desktop: Left Tools */}
                    <div className="flex items-center justify-between md:justify-start gap-2 pb-2 md:pb-0 border-b border-white/5 md:border-none mb-1 md:mb-0 w-full md:w-auto">
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2 md:p-3 text-logic-cyan/70 hover:text-logic-cyan hover:bg-white/5 rounded-full transition-all"
                            >
                                <Paperclip className="w-4 h-4 md:w-5 md:h-5" />
                            </button>
                            <button
                                onClick={() => onCameraClick()}
                                className="p-2 md:p-3 text-logic-cyan/70 hover:text-logic-cyan hover:bg-white/5 rounded-full transition-all"
                            >
                                <Camera className="w-4 h-4 md:w-5 md:h-5" />
                            </button>
                        </div>

                        {/* Mobile Right Actions */}
                        <div className="md:hidden flex items-center gap-1">
                            <button
                                onClick={() => setIsListening(!isListening)}
                                className={`p-2 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                            >
                                <Mic className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleSubmit()}
                                disabled={(!prompt.trim() && !selectedFile) || isThinking}
                                className={`
                                    p-2 rounded-full transition-all
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
                        placeholder={isThinking ? "Consulting the Council..." : (worldState ? "Vibe with the physics..." : "Manifest Intent...")}
                        disabled={isThinking}
                        className="flex-1 w-full bg-transparent border-none outline-none text-white placeholder:text-white/30 text-sm md:text-base font-medium py-2 md:py-3 px-2 resize-none max-h-32 md:max-h-48 scrollbar-none font-inter tracking-tight"
                    />

                    <div className="hidden md:flex items-center gap-2 pb-1 pr-1">
                        {worldState && (
                            <>
                                <button
                                    onClick={handleWormholeShare}
                                    className="p-3 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-400/5 rounded-2xl transition-all"
                                    title="Stabilize Wormhole (Copy Link)"
                                >
                                    <Share2 className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={handleWhatsAppShare}
                                    className="p-3 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/5 rounded-2xl transition-all"
                                    title="Share to WhatsApp"
                                >
                                    <MessageCircle className="w-5 h-5" />
                                </button>
                            </>
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
