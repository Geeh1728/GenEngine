'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateSimulationLogic, getEmbedding } from '@/app/actions';
import { queryKnowledge } from '@/lib/db/pglite';
import { useGenesisEngine } from '@/hooks/useGenesisEngine';
import { Terminal, Cpu, AlertCircle, Zap, Brain, ShieldAlert } from 'lucide-react';
import { routeIntentLocally, executeLocalTool } from '@/lib/ai/edgeRouter';
import { GameAction } from '@/lib/multiplayer/GameState';

export const GodInput: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [status, setStatus] = useState<'idle' | 'compiling' | 'error'>('idle');
    const {
        setWorldState,
        setError,
        setLastHypothesis,
        setIsSabotaged,
        interactionState,
        fileUri,
        dispatch
    } = useGenesisEngine();
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim() || status === 'compiling') return;

        // 100% Potential: THE EDGE ROUTER (FunctionGemma Protocol)
        const localTool = await routeIntentLocally(prompt);
        if (localTool) {
            // Instant Local Execution
            executeLocalTool(localTool, (action) => {
                // Here you would normally use a dispatch, but we update engine state directly
                console.log("Local Action Dispatched:", action);
                dispatch(action as GameAction);
            });
            setPrompt('');
            return;
        }

        setStatus('compiling');
        setError(null);

        try {
            // 1. Get Embedding for search context
            const embResult = await getEmbedding(prompt);
            if (!embResult.success) {
                throw new Error(embResult.error || 'Neural link failed');
            }

            const embedding = embResult.embedding;

            // 2. Query Local Knowledge (PGLite)
            const contextResults = await queryKnowledge(embedding);
            const contextText = contextResults.map((r) => (r as { content: string }).content).join('\n---\n');

            // 3. Trigger Compiler Agent
            const result = await generateSimulationLogic(prompt, contextText, null, fileUri || undefined, undefined, interactionState);

            if (result.success) {
                // ADD MISSION LOGS
                if (result.logs) {
                    result.logs.forEach((log: any) => dispatch({ type: 'ADD_MISSION_LOG', payload: log }));
                }

                if ('worldState' in result && result.worldState) {
                    setWorldState(result.worldState);
                    setIsSabotaged(result.isSabotaged || false); // Trigger Glitch if sabotaged
                } else if ('mutation' in result && result.mutation) {
                    dispatch({ type: 'MUTATE_WORLD', payload: result.mutation });
                }

                setLastHypothesis(prompt);
                setPrompt('');
                setStatus('idle');
            } else {

                // ADD MISSION LOGS on failure

                if (result.logs) {

                    result.logs.forEach((log: any) => dispatch({ type: 'ADD_MISSION_LOG', payload: log }));

                }

                // eslint-disable-next-line @typescript-eslint/no-explicit-any

                throw new Error('error' in result ? result.error : 'Logic compilation failed');

            }
        } catch (err) {
            console.error('[GodInput] Error:', err);
            setStatus('error');
            setError(err instanceof Error ? err.message : 'Unknown error');
            setTimeout(() => setStatus('idle'), 2000);
        }
    };

    return (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 z-[1000]">
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{
                    y: 0,
                    opacity: 1,
                    x: status === 'error' ? [0, -10, 10, -10, 10, 0] : 0,
                    borderColor:
                        interactionState === 'BUILDING' ? 'rgba(59, 130, 246, 0.5)' :
                            interactionState === 'ANALYZING' ? 'rgba(168, 85, 247, 0.5)' :
                                interactionState === 'REFLECTION' ? 'rgba(239, 68, 68, 0.5)' :
                                    'rgba(255, 255, 255, 0.1)'
                }}
                className={`
                    relative backdrop-blur-2xl rounded-2xl border transition-all duration-500
                    ${status === 'compiling' ? 'bg-blue-500/10' : 'bg-white/5'}
                    ${status === 'error' ? 'bg-red-500/10 border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.2)]' : 'shadow-2xl'}
                `}
            >
                <div className="absolute -top-6 left-4 flex gap-2">
                    <AnimatePresence>
                        {interactionState === 'BUILDING' && (
                            <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-1 px-2 py-0.5 bg-blue-500 text-white text-[8px] font-black uppercase rounded-full">
                                <Brain className="w-2 h-2" /> Thinking
                            </motion.span>
                        )}
                        {interactionState === 'REFLECTION' && (
                            <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-1 px-2 py-0.5 bg-red-500 text-white text-[8px] font-black uppercase rounded-full">
                                <ShieldAlert className="w-2 h-2" /> Anomaly Detected
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>

                <form onSubmit={handleSubmit} className="flex items-center gap-4 p-3 px-4">
                    <div className="flex-shrink-0">
                        {status === 'compiling' ? (
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                            >
                                <Cpu className="w-5 h-5 text-blue-400" />
                            </motion.div>
                        ) : status === 'error' ? (
                            <AlertCircle className="w-5 h-5 text-red-500" />
                        ) : (
                            <Terminal className="w-5 h-5 text-gray-500" />
                        )}
                    </div>

                    <input
                        ref={inputRef}
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Explain how this system works..."
                        disabled={status === 'compiling'}
                        className="flex-1 bg-transparent border-none outline-none text-sm text-gray-100 placeholder:text-gray-600 font-inter py-2"
                    />

                    <div className="flex items-center gap-3">
                        <AnimatePresence mode="wait">
                            {status === 'compiling' && (
                                <motion.span
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400 whitespace-nowrap"
                                >
                                    Compiling Reality...
                                </motion.span>
                            )}
                        </AnimatePresence>

                        <button
                            type="submit"
                            disabled={!prompt.trim() || status === 'compiling'}
                            className={`
                                p-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                                ${!prompt.trim() ? 'bg-white/5 text-gray-700' : 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'}
                            `}
                        >
                            Execute
                        </button>
                    </div>
                </form>

                {/* Subtle Progress Bar for Compiling */}
                {status === 'compiling' && (
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 2, ease: "easeInOut" }}
                        className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                    />
                )}
            </motion.div>
        </div>
    );
};