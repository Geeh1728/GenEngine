'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Trophy, Target, ArrowRight, BookOpen } from 'lucide-react';

export interface Question {
    id: string;
    text: string;
    options: string[];
    correctOption: number;
    explanation: string;
}

interface MasteryChallengeProps {
    questions: Question[];
    onComplete: (score: number) => void;
    onClose: () => void;
}

export const MasteryChallenge: React.FC<MasteryChallengeProps> = ({ questions, onComplete, onClose }) => {
    const [currentIdx, setCurrentIdx] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [score, setScore] = useState(0);
    const [isFinished, setIsFinished] = useState(false);

    const handleSelect = (idx: number) => {
        if (isAnswered) return;
        setSelectedOption(idx);
        setIsAnswered(true);

        if (idx === questions[currentIdx].correctOption) {
            setScore(prev => prev + 1);
        }
    };

    const handleNext = () => {
        if (currentIdx < questions.length - 1) {
            setCurrentIdx(prev => prev + 1);
            setSelectedOption(null);
            setIsAnswered(false);
        } else {
            setIsFinished(true);
            onComplete(Math.round((score / questions.length) * 100));
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-xl bg-[#050510]/95 backdrop-blur-3xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
            >
                {!isFinished ? (
                    <div className="p-8">
                        {/* Header */}
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-3">
                                <Target className="w-5 h-5 text-blue-500" />
                                <span className="text-xs uppercase tracking-[0.3em] text-white font-bold">Mastery Verification</span>
                            </div>
                            <div className="text-[10px] text-gray-500 font-mono">
                                {currentIdx + 1} / {questions.length}
                            </div>
                        </div>

                        {/* Question */}
                        <h3 className="text-xl font-outfit font-bold text-white mb-8 leading-tight">
                            {questions[currentIdx].text}
                        </h3>

                        {/* Options */}
                        <div className="space-y-3 mb-8">
                            {questions[currentIdx].options.map((option, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSelect(idx)}
                                    className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between group ${isAnswered
                                            ? idx === questions[currentIdx].correctOption
                                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                                : idx === selectedOption
                                                    ? 'bg-red-500/10 border-red-500/30 text-red-400'
                                                    : 'bg-white/5 border-white/5 text-gray-500'
                                            : 'bg-white/5 border-white/5 text-gray-300 hover:bg-white/10 hover:border-white/10'
                                        }`}
                                >
                                    <span className="text-sm font-medium">{option}</span>
                                    {isAnswered && idx === questions[currentIdx].correctOption && <CheckCircle2 className="w-4 h-4" />}
                                    {isAnswered && idx === selectedOption && idx !== questions[currentIdx].correctOption && <XCircle className="w-4 h-4" />}
                                </button>
                            ))}
                        </div>

                        {/* Explanation & Next */}
                        <AnimatePresence>
                            {isAnswered && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="space-y-6"
                                >
                                    <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                                        <div className="flex items-center gap-2 mb-2">
                                            <BookOpen className="w-3 h-3 text-blue-400" />
                                            <span className="text-[8px] uppercase tracking-widest text-blue-400 font-bold">Knowledge Grounding</span>
                                        </div>
                                        <p className="text-[11px] text-gray-400 leading-relaxed italic">
                                            {questions[currentIdx].explanation}
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleNext}
                                        className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 group shadow-lg shadow-blue-500/20"
                                    >
                                        <span>{currentIdx === questions.length - 1 ? 'Verify Mastery' : 'Next Transmission'}</span>
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="p-12 text-center">
                        <div className="w-24 h-24 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                            <Trophy className="w-12 h-12 text-emerald-400" />
                        </div>
                        <h2 className="text-3xl font-outfit font-bold text-white mb-2">Mastery Confirmed</h2>
                        <p className="text-gray-400 text-sm mb-8">
                            Your neural alignment with the Source Text is at <span className="text-emerald-400 font-bold">{Math.round((score / questions.length) * 100)}%</span>.
                            The Knowledge Crystal is ready for manifestation.
                        </p>
                        <button
                            onClick={onClose}
                            className="px-8 py-3 bg-white text-black rounded-full font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
                        >
                            Enter Laboratory
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    );
};
