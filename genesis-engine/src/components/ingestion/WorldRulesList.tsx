'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Shield } from 'lucide-react';

interface WorldRule {
    id: string;
    rule: string;
    description: string;
    grounding_source: string;
}

interface WorldRulesListProps {
    rules: WorldRule[];
}

export const WorldRulesList: React.FC<WorldRulesListProps> = ({ rules }) => {
    return (
        <div className="w-80 h-full flex flex-col bg-black/20 backdrop-blur-3xl border-l border-white/5 p-6 animate-in slide-in-from-right duration-700">
            <div className="mb-8">
                <h2 className="text-xs uppercase tracking-[0.3em] font-bold text-gray-500 mb-2">Extraction Results</h2>
                <h3 className="text-xl font-outfit font-bold text-white">World Rules</h3>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
                {rules.map((rule, idx) => (
                    <motion.div
                        key={rule.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="group"
                    >
                        <div className="flex items-start gap-3 mb-2">
                            <div className="mt-1 p-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                                <Shield className="w-3 h-3 text-blue-400" />
                            </div>
                            <h4 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
                                {rule.rule}
                            </h4>
                        </div>

                        <p className="text-xs text-gray-400 leading-relaxed pl-7 mb-3">
                            {rule.description}
                        </p>

                        <div className="pl-7 flex items-center gap-2">
                            <span className="text-[10px] text-gray-600 font-medium uppercase tracking-tighter">Source:</span>
                            <span className="text-[10px] text-blue-500/60 font-mono bg-blue-500/5 px-1.5 py-0.5 rounded border border-blue-500/10">
                                {rule.grounding_source}
                            </span>
                        </div>

                        <div className="mt-4 border-b border-white/5" />
                    </motion.div>
                ))}
            </div>

            <div className="mt-8 p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20">
                <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <div>
                        <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Verified Origin</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">Grounding complete via File Search API</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
