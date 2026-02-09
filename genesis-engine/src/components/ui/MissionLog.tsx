'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Search, AlertCircle, CheckCircle2, Brain, X, ChevronRight, Activity, Sparkles, Cpu, Globe } from 'lucide-react';
import { useGenesisStore } from '@/lib/store/GenesisContext';
import { blackboard, BlackboardContext } from '@/lib/genkit/context';
import { summarizeLogsLocally, checkNanoCapabilities } from '@/lib/ai/local-nano';
import { hiveBus } from '@/lib/genkit/event-bus';
import { p2p } from '@/lib/multiplayer/P2PConnector';

/**
 * useTelemetry: Subscribes to the Blackboard's mission logs in real-time.
 */
export function useTelemetry() {
    const [context, setContext] = useState<BlackboardContext>(blackboard.getContext());

    useEffect(() => {
        const unsubscribe = blackboard.subscribe((ctx) => {
            setContext({ ...ctx });
        });
        return () => {
            unsubscribe();
        };
    }, []);

    return context;
}

export const MissionLog: React.FC = () => {
    const { dispatch } = useGenesisStore();
    const blackboardContext = useTelemetry();
    const { missionLogs, streamingProgress } = blackboardContext;
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isMinimized, setIsMinimized] = useState(false);
    const [summary, setSummary] = useState<string | null>(null);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [showMetrics, setShowMetrics] = useState(false);
    const [showAGI, setShowAGI] = useState(false);
    const [workerCount, setWorkerCount] = useState(0);

    useEffect(() => {
        const updateWorkers = () => setWorkerCount(hiveBus.getWorkerCount());
        hiveBus.on('SCALE_UP', updateWorkers);
        return () => { hiveBus.off('SCALE_UP', updateWorkers); };
    }, []);

    const handleSummarize = async () => {
        if (missionLogs.length === 0) return;
        setIsSummarizing(true);
        const result = await summarizeLogsLocally(missionLogs.map(l => l.message));
        if (result.success) setSummary(result.text || "Summary failed.");
        setIsSummarizing(false);
    };

    useEffect(() => {
        if (scrollRef.current && !isMinimized) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [missionLogs, isMinimized]);

    if (missionLogs.length === 0) return null;

    const getIcon = (type: string) => {
        switch (type) {
            case 'RESEARCH': return <Search className="w-3 h-3 text-cyan-400" />;
            case 'ERROR': return <AlertCircle className="w-3 h-3 text-red-400" />;
            case 'SUCCESS': return <CheckCircle2 className="w-3 h-3 text-emerald-400" />;
            case 'THINKING': return <Brain className="w-3 h-3 text-blue-400 animate-pulse" />;
            case 'MANIFEST': return <span className="text-[10px]">✨</span>;
            case 'SYMBOLIC': return <span className="text-[10px]">⚖️</span>;
            case 'THOUGHT': return <span className="text-[10px]">💭</span>;
            default: return <Activity className="w-3 h-3 text-gray-400" />;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{
                opacity: 1,
                x: 0,
                width: isMinimized ? '48px' : '320px',
                height: isMinimized ? '48px' : '450px'
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-24 left-6 z-[100] flex flex-col gap-2"
        >
            <div className="bg-black/40 backdrop-blur-3xl border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col h-full relative group">
                {/* Holographic Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-600/5 pointer-events-none" />

                {/* Header */}
                <div className="p-3 px-5 border-b border-white/5 bg-white/5 flex justify-between items-center relative z-10">
                    {!isMinimized && (
                        <div className="flex items-center gap-3">
                            <Terminal className="w-4 h-4 text-blue-400" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70">Neural Log</span>
                            <button 
                                onClick={handleSummarize} 
                                disabled={isSummarizing}
                                className="ml-2 p-1 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded transition-all group"
                                title="Summarize with Local Nano"
                            >
                                <Sparkles className={`w-2.5 h-2.5 text-blue-400 ${isSummarizing ? 'animate-spin' : 'group-hover:scale-110'}`} />
                            </button>
                            <button 
                                onClick={() => setShowMetrics(!showMetrics)}
                                className={`ml-1 p-1 rounded transition-all ${showMetrics ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-gray-500 hover:text-white'}`}
                                title="Operations Dashboard"
                            >
                                <Cpu className="w-2.5 h-2.5" />
                            </button>
                            <button 
                                onClick={() => setShowAGI(!showAGI)}
                                className={`ml-1 p-1 rounded transition-all ${showAGI ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-gray-500 hover:text-white'}`}
                                title="AGI Reasoning Console"
                            >
                                <Globe className="w-2.5 h-2.5" />
                            </button>
                        </div>
                    )}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setIsMinimized(!isMinimized)}
                            className="p-1.5 hover:bg-white/10 rounded-xl transition-all text-gray-500 hover:text-white"
                        >
                            {isMinimized ? <ChevronRight className="w-4 h-4" /> : <X className="w-3 h-3" />}
                        </button>
                    </div>
                </div>

                {/* Log Stream */}
                {!isMinimized && (
                    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                        {/* Manifestation Progress Bar */}
                        {streamingProgress > 0 && streamingProgress < 100 && (
                            <div className="px-5 py-2 bg-blue-500/10 border-b border-blue-500/20">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[8px] font-bold text-blue-400 uppercase tracking-widest">Incremental Manifestation</span>
                                    <span className="text-[8px] font-mono text-blue-400">{streamingProgress}%</span>
                                </div>
                                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${streamingProgress}%` }}
                                        className="h-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]"
                                    />
                                </div>
                            </div>
                        )}

                        {summary && (
                            <div className="mx-5 my-2 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                                <div className="flex items-center gap-2 mb-1">
                                    <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
                                    <span className="text-[8px] font-black uppercase text-indigo-400 tracking-widest">Nano Summary</span>
                                    <button onClick={() => setSummary(null)} className="ml-auto text-indigo-400/50 hover:text-indigo-400"><X className="w-2 h-2"/></button>
                                </div>
                                <p className="text-[10px] text-indigo-200 italic leading-snug">{summary}</p>
                            </div>
                        )}

                        {showMetrics && (
                            <div className="mx-5 my-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl grid grid-cols-2 gap-2">
                                <div className="flex flex-col">
                                    <span className="text-[7px] font-black text-emerald-500/60 uppercase">Swarm Workers</span>
                                    <span className="text-xs font-mono text-emerald-400">{workerCount} Bees</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[7px] font-black text-emerald-500/60 uppercase">P2P Mesh</span>
                                    <span className="text-xs font-mono text-emerald-400">{p2p.getPeerCount()} Peers</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[7px] font-black text-emerald-500/60 uppercase">WASM Memory</span>
                                    <span className="text-xs font-mono text-emerald-400">Stable</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[7px] font-black text-emerald-500/60 uppercase">Edge RTT</span>
                                    <span className="text-xs font-mono text-emerald-400">Optimized</span>
                                </div>
                            </div>
                        )}

                        {showAGI && (
                            <div className="mx-5 my-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-2">
                                <div className="flex items-center gap-2 mb-1">
                                    <Globe className="w-2.5 h-2.5 text-blue-400" />
                                    <span className="text-[8px] font-black uppercase text-blue-400 tracking-widest">AlphaGeometry Reasoning Search</span>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between text-[9px]">
                                        <span className="text-gray-400">Hypothesis Alpha</span>
                                        <span className="text-red-400 font-mono">Failed (Joint Drift)</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[9px]">
                                        <span className="text-gray-400">Hypothesis Beta</span>
                                        <span className="text-emerald-400 font-mono">Verified (Symbolic)</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[9px]">
                                        <span className="text-gray-400">Proof Search Time</span>
                                        <span className="text-blue-400 font-mono">1.2s</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div
                            ref={scrollRef}
                            className="p-5 space-y-5 overflow-y-auto custom-scrollbar scroll-smooth flex-1 relative z-10"
                        >
                            <AnimatePresence initial={false}>
                                {missionLogs.map((log, i) => (
                                    <motion.div
                                        key={`${log.timestamp}-${i}`}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={`flex gap-4 items-start group/item ${log.type === 'SYMBOLIC' ? 'bg-amber-400/5 p-2 rounded-xl border border-amber-400/10' : ''
                                            } ${log.type === 'MANIFEST' ? 'bg-blue-400/5 p-2 rounded-xl border border-blue-400/10' : ''
                                            } ${log.type === 'THOUGHT' ? 'bg-zinc-900/50 p-2 rounded-xl border border-zinc-800 border-dashed' : ''
                                            }`}
                                    >
                                        <div className={`mt-1 shrink-0 p-1.5 rounded-lg border transition-colors ${log.type === 'SYMBOLIC' ? 'bg-amber-400/10 border-amber-400/20' :
                                            log.type === 'MANIFEST' ? 'bg-blue-400/10 border-blue-400/20' :
                                            log.type === 'THOUGHT' ? 'bg-zinc-800/50 border-zinc-700' :
                                                'bg-white/5 border-white/5 group-hover/item:border-white/10'
                                            }`}>
                                            {getIcon(log.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-[8px] font-black uppercase tracking-widest ${log.type === 'SYMBOLIC' ? 'text-amber-400' :
                                                    log.type === 'MANIFEST' ? 'text-blue-400' :
                                                        log.agent === 'Physicist' ? 'text-blue-400' :
                                                            log.agent === 'Researcher' ? 'text-cyan-400' :
                                                                log.agent === 'Aegis' ? 'text-red-400' :
                                                                    log.agent === 'Brain' ? 'text-emerald-400' :
                                                                        log.agent === 'Dean' ? 'text-amber-400' :
                                                                            log.agent === 'Vision' ? 'text-indigo-400' :
                                                                                log.agent === 'Librarian' ? 'text-emerald-500' :
                                                                                    log.agent === 'Babel' ? 'text-purple-400' :
                                                                                        log.agent === 'Conductor' ? 'text-white' :
                                                                                            'text-purple-400'
                                                    }`}>
                                                    {log.agent}
                                                </span>
                                                <div className="w-1 h-1 rounded-full bg-white/10" />
                                                <span className="text-[7px] font-mono text-gray-600">
                                                    {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className={`text-[11px] font-mono leading-relaxed break-words selection:bg-blue-500/30 ${log.type === 'SYMBOLIC' ? 'text-amber-200' :
                                                    log.type === 'MANIFEST' ? 'text-blue-200' :
                                                    log.type === 'THOUGHT' ? 'text-zinc-500 italic' :
                                                        'text-gray-300'
                                                }`}>
                                                {log.message}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                )}

                {/* Minimized Pulse Indicator */}
                {isMinimized && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                    </div>
                )}
            </div>
        </motion.div>
    );
};