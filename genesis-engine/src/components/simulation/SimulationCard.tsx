'use client';

import React from 'react';

interface Rule {
    name: string;
    effect: string;
    verified: boolean;
    source_citation?: string;
}

interface SimulationCardProps {
    title: string;
    description: string;
    rules: Rule[];
    actions: string[];
    onAction?: (action: string) => void;
    societalImpact?: string;
}

export const SimulationCard: React.FC<SimulationCardProps> = ({
    title,
    description,
    rules,
    actions,
    onAction,
    societalImpact,
}) => {
    return (
        <div className="max-w-md w-full p-6 rounded-3xl bg-white/5 backdrop-blur-3xl border border-white/10 shadow-2xl text-white group hover:border-blue-500/30 transition-all duration-500">
            <div className="mb-6">
                <div className="flex justify-between items-start mb-2">
                    <h2 className="text-3xl font-black font-outfit bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-white/50 tracking-tight">
                        {title}
                    </h2>
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
                </div>
                <p className="text-xs text-gray-400 font-medium leading-relaxed uppercase tracking-wider opacity-70">
                    {description}
                </p>
            </div>

            <div className="space-y-3 mb-6">
                {rules.map((rule, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-white/3 border border-white/5 hover:bg-white/5 transition-colors">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Rule Engine</span>
                            {rule.verified && (
                                <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1">
                                    <div className="w-1 h-1 rounded-full bg-emerald-400" />
                                    Validated
                                </span>
                            )}
                        </div>
                        <h4 className="text-sm font-bold text-gray-100 mb-1">{rule.name}</h4>
                        <p className="text-[11px] text-gray-500 leading-normal">{rule.effect}</p>
                    </div>
                ))}
            </div>

            {societalImpact && (
                <div className="mb-6 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 group-hover:bg-indigo-500/10 transition-all">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1 rounded-md bg-indigo-500/20">
                            <svg className="w-3 h-3 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">Societal Impact</span>
                    </div>
                    <p className="text-[11px] text-indigo-200/70 italic leading-relaxed">
                        &quot;{societalImpact}&quot;
                    </p>
                </div>
            )}

            <div className="grid grid-cols-2 gap-3">
                {actions.map((action, idx) => (
                    <button
                        key={idx}
                        onClick={() => onAction?.(action)}
                        className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/40 text-[10px] font-black uppercase tracking-widest transition-all duration-300 active:scale-95"
                    >
                        {action}
                    </button>
                ))}
            </div>
        </div>
    );
};
