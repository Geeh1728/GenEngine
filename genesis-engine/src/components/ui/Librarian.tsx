'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, Sparkles, Zap, Cpu, FileText, ChevronRight, Download, Headphones } from 'lucide-react';
import { sfx } from '@/lib/sound/SoundManager';
import { sovereignTTS } from '@/lib/audio/sovereign-tts';

// Local type definition to avoid server-side schema imports
interface WorldRule {
    id: string;
    rule: string;
    description: string;
    grounding_source?: string;
    isActive: boolean;
}

interface LibrarianProps {
    rules: WorldRule[];
    onInjectFormula: (formula: string) => void;
    onClose: () => void;
}

/**
 * THE GRIMOIRE (v12.0 Librarian Upgrade)
 * Objective: Spatial PDF Interaction & Formula Injection.
 */
export const Librarian: React.FC<LibrarianProps> = ({ rules, onInjectFormula, onClose }) => {
    const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);

    const handleInject = (rule: WorldRule) => {
        sfx.playSuccess();
        onInjectFormula(rule.rule + ": " + rule.description);
    };

    const handleReadAloud = (text: string) => {
        sfx.playClick();
        sovereignTTS.playOffline(text);
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed inset-y-0 right-0 w-full md:w-[450px] z-[4000] flex"
        >
            {/* Backdrop Blur Sidebar */}
            <div className="flex-1 bg-black/60 backdrop-blur-3xl border-l border-white/10 shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-8 border-b border-white/5 bg-gradient-to-b from-indigo-500/10 to-transparent">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/20 rounded-lg">
                                <Book className="w-6 h-6 text-indigo-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-outfit font-black text-white tracking-tight">The Grimoire</h2>
                                <p className="text-[10px] text-indigo-400/60 uppercase font-black tracking-[0.3em]">Neural Knowledge Base</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
                            <Zap className="w-5 h-5 rotate-45" />
                        </button>
                    </div>

                    <div className="flex gap-4">
                        <div className="px-3 py-1.5 bg-white/5 rounded-full border border-white/10 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[8px] font-black text-white uppercase tracking-widest text-emerald-400">Context Live</span>
                        </div>
                        <div className="px-3 py-1.5 bg-white/5 rounded-full border border-white/10 flex items-center gap-2">
                            <span className="text-[8px] font-black text-white uppercase tracking-widest text-indigo-400">{rules.length} Rules Bound</span>
                        </div>
                    </div>
                </div>

                {/* Rules List */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
                    {rules.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                            <FileText className="w-12 h-12 mb-4" />
                            <p className="text-xs font-bold uppercase tracking-widest">No formulas extracted yet.</p>
                            <p className="text-[10px] mt-2">Ingest a PDF to fill the Grimoire.</p>
                        </div>
                    ) : (
                        rules.map((rule, idx) => (
                            <motion.div
                                key={rule.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                onClick={() => setSelectedRuleId(selectedRuleId === rule.id ? null : rule.id)}
                                className={`group relative p-6 rounded-3xl border transition-all cursor-pointer ${
                                    selectedRuleId === rule.id 
                                    ? 'bg-indigo-500/10 border-indigo-500/30 ring-1 ring-indigo-500/20' 
                                    : 'bg-white/5 border-white/5 hover:border-white/10'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <h4 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors pr-8 leading-tight">
                                        {rule.rule}
                                    </h4>
                                    <div className={`shrink-0 p-1.5 rounded-xl border transition-all ${
                                        selectedRuleId === rule.id ? 'bg-indigo-500 border-indigo-400 text-white' : 'bg-black/40 border-white/10 text-gray-500'
                                    }`}>
                                        <Sparkles className="w-3 h-3" />
                                    </div>
                                </div>

                                <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all">
                                    {rule.description}
                                </p>

                                <AnimatePresence>
                                    {selectedRuleId === rule.id && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mt-6 pt-6 border-t border-white/10"
                                        >
                                            <div className="flex flex-col gap-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[8px] font-black text-gray-500 uppercase tracking-[0.2em]">Source Page</span>
                                                    <span className="text-[10px] font-mono text-indigo-400">{rule.grounding_source}</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleReadAloud(rule.description);
                                                        }}
                                                        className="py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[8px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border border-white/10 transition-all active:scale-95"
                                                    >
                                                        <Headphones className="w-3 h-3" /> Read Aloud
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleInject(rule);
                                                        }}
                                                        className="py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl text-[8px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                                                    >
                                                        <Cpu className="w-3 h-3" /> Manifest
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Footer Footer */}
                <div className="p-8 border-t border-white/5 bg-black/40">
                    <button className="w-full py-4 border border-white/10 rounded-2xl text-[10px] font-bold text-gray-500 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2">
                        <Download className="w-3 h-3" /> Export Knowledge Crystal
                    </button>
                </div>
            </div>
        </motion.div>
    );
};
