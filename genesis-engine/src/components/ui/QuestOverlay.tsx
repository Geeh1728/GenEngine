'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Target, Star, X } from 'lucide-react';
import { Quest } from '@/lib/gamification/questEngine';

import { useGenesisStore } from '@/lib/store/GenesisContext';

/**
 * Module I: The Quest Board UI
 * A cyberpunk-styled overlay that displays the current learning mission.
 * Refactored: Consumes GenesisStore directly.
 */
export function QuestOverlay() {
    const { state, dispatch } = useGenesisStore();
    const { quests, currentQuestId } = state;

    // Find active quest
    const quest = quests.find(q => q.id === currentQuestId);
    const isVisible = !!quest;

    if (!quest) return null;

    const onClose = () => {
        dispatch({ type: 'SET_CURRENT_QUEST', payload: null });
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ x: 400, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 400, opacity: 0 }}
                    className="fixed top-24 right-6 w-80 z-50"
                >
                    <div className="bg-black/80 backdrop-blur-md border border-cyan-500/50 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(34,211,238,0.3)]">
                        {/* Header */}
                        <div className="bg-cyan-500/20 px-4 py-3 border-b border-cyan-500/30 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Trophy className="text-cyan-400" size={18} />
                                <span className="text-cyan-400 font-bold uppercase tracking-widest text-sm">Active Quest</span>
                            </div>
                            <button onClick={onClose} className="text-cyan-400 hover:text-white transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4 space-y-4">
                            <div>
                                <h3 className="text-white font-black text-lg leading-tight">{quest.title}</h3>
                                <p className="text-cyan-200/60 text-xs mt-1 italic">{quest.description}</p>
                            </div>

                            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                                <div className="flex items-center gap-2 mb-2">
                                    <Target className="text-pink-500" size={14} />
                                    <span className="text-pink-500 font-bold uppercase text-[10px] tracking-wider">Objective</span>
                                </div>
                                <p className="text-white text-sm">{quest.objective}</p>
                            </div>

                            <div className="flex justify-between items-center pt-2">
                                <div className="flex items-center gap-1.5">
                                    <Star className="text-yellow-400" size={14} fill="currentColor" />
                                    <span className="text-yellow-400 font-bold text-sm">{quest.xpReward} XP</span>
                                </div>
                                <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${quest.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                                        quest.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                            'bg-red-500/20 text-red-400'
                                    }`}>
                                    {quest.difficulty}
                                </div>
                            </div>
                        </div>

                        {/* Progress Bar (Static for now) */}
                        <div className="h-1 w-full bg-white/10">
                            <motion.div
                                className="h-full bg-cyan-500"
                                initial={{ width: 0 }}
                                animate={{ width: '30%' }}
                                transition={{ duration: 1 }}
                            />
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}