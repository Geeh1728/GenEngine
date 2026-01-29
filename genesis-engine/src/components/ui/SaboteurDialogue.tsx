'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Send } from 'lucide-react';

interface SaboteurDialogueProps {
    question: string;
    onReply: (reply: string) => void;
    onClose: () => void;
}

export const SaboteurDialogue: React.FC<SaboteurDialogueProps> = ({ question, onReply, onClose }) => {
    const [reply, setReply] = React.useState('');

    const handleSubmit = () => {
        if (!reply.trim()) return;
        onReply(reply);
        setReply('');
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[2000] w-full max-w-lg"
        >
            <div className="bg-[#1a140a]/90 backdrop-blur-2xl border border-amber-500/30 rounded-3xl p-8 shadow-[0_0_50px_rgba(245,158,11,0.15)]">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-amber-500/20 rounded-xl">
                        <ShieldAlert className="w-5 h-5 text-amber-400" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500/70">Saboteur Challenge</span>
                </div>

                <p className="text-lg font-outfit text-amber-50 mb-8 leading-relaxed italic">
                    &quot;{question}&quot;
                </p>

                <div className="relative">
                    <input
                        autoFocus
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                        placeholder="Speak your truth..."
                        className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-white placeholder:text-gray-600 outline-none focus:border-amber-500/50 transition-all font-mono"
                    />
                    <button
                        onClick={handleSubmit}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-amber-500 text-black rounded-xl hover:scale-105 active:scale-95 transition-all"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>

                <button
                    onClick={onClose}
                    className="mt-6 w-full text-[8px] font-bold uppercase tracking-widest text-gray-500 hover:text-gray-300 transition-colors"
                >
                    Dismiss Dialogue
                </button>
            </div>
        </motion.div>
    );
};
