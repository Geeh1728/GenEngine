'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Search, AlertCircle, CheckCircle2, Brain, X, ChevronRight, Activity } from 'lucide-react';
import { useGenesisStore } from '@/lib/store/GenesisContext';
import { blackboard, BlackboardContext } from '@/lib/genkit/context';

/**
 * useTelemetry: Subscribes to the Blackboard's mission logs in real-time.
 */
export function useTelemetry() {
    const [logs, setLogs] = useState<BlackboardContext['missionLogs']>(blackboard.getContext().missionLogs);

    useEffect(() => {
        const unsubscribe = blackboard.subscribe((ctx) => {
            setLogs([...ctx.missionLogs]);
        });
        return () => {
            unsubscribe();
        };
    }, []);

    return logs;
}

export const MissionLog: React.FC = () => {
    const { dispatch } = useGenesisStore();
    const missionLogs = useTelemetry();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isMinimized, setIsMinimized] = useState(false);

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
                                    className="flex gap-4 items-start group/item"
                                >
                                    <div className="mt-1 shrink-0 p-1.5 rounded-lg bg-white/5 border border-white/5 group-hover/item:border-white/10 transition-colors">
                                        {getIcon(log.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[8px] font-black uppercase tracking-widest ${
                                                log.agent === 'Physicist' ? 'text-blue-400' :
                                                log.agent === 'Researcher' ? 'text-cyan-400' :
                                                log.agent === 'Aegis' ? 'text-red-400' :
                                                'text-purple-400'
                                            }`}>
                                                {log.agent}
                                            </span>
                                            <div className="w-1 h-1 rounded-full bg-white/10" />
                                            <span className="text-[7px] font-mono text-gray-600">
                                                {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-gray-300 font-mono leading-relaxed break-words selection:bg-blue-500/30">
                                            {log.message}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
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