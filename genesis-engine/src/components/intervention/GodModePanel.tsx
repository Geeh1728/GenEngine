'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Shield, AlertTriangle, Sliders } from 'lucide-react';

interface Rule {
    id: string;
    rule: string;
    isActive: boolean;
}

interface GodModePanelProps {
    complexity: 'fundamental' | 'standard' | 'expert';
    onComplexityChange: (level: 'fundamental' | 'standard' | 'expert') => void;
    rules: Rule[];
    onToggleRule: (id: string) => void;
    constants: Record<string, number>;
    onConstantChange: (name: string, value: number) => void;
}

export const GodModePanel: React.FC<GodModePanelProps> = ({
    complexity,
    onComplexityChange,
    rules,
    onToggleRule,
    constants,
    onConstantChange,
}) => {
    return (
        <div className="w-80 h-full flex flex-col bg-black/40 backdrop-blur-3xl border-r border-white/5 p-6 animate-in slide-in-from-left duration-700">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                    <Zap className="w-4 h-4 text-red-500" />
                </div>
                <div>
                    <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white">God Mode</h3>
                    <p className="text-[10px] text-red-500/60 uppercase tracking-widest font-medium">Intervention Active</p>
                </div>
            </div>

            <div className="space-y-8 overflow-y-auto pr-2 custom-scrollbar flex-1">
                {/* ELIx Complexity Slider */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <Shield className="w-3 h-3 text-blue-400" />
                        <h4 className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Cognitive Level (ELIx)</h4>
                    </div>
                    <div className="grid grid-cols-3 gap-1 bg-white/5 p-1 rounded-lg border border-white/5">
                        {(['fundamental', 'standard', 'expert'] as const).map((level) => (
                            <button
                                key={level}
                                onClick={() => onComplexityChange(level)}
                                className={`text-[9px] uppercase tracking-tighter py-1.5 rounded transition-all ${complexity === level
                                    ? 'bg-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                                    : 'text-gray-500 hover:text-gray-300'
                                    }`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                </section>

                {/* World Rule Toggles */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="w-3 h-3 text-orange-400" />
                        <h4 className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Rule Intervention</h4>
                    </div>
                    <div className="space-y-3">
                        {rules.map((rule) => (
                            <div key={rule.id} className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/5">
                                <span className="text-[10px] text-gray-300 font-medium truncate pr-2">{rule.rule}</span>
                                <button
                                    onClick={() => onToggleRule(rule.id)}
                                    className={`w-8 h-4 rounded-full relative transition-colors ${rule.isActive ? 'bg-blue-500' : 'bg-gray-800'
                                        }`}
                                >
                                    <motion.div
                                        animate={{ x: rule.isActive ? 16 : 2 }}
                                        className="w-3 h-3 rounded-full bg-white top-0.5 absolute shadow-sm"
                                    />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Dynamic Physics Constants */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <Sliders className="w-3 h-3 text-emerald-400" />
                        <h4 className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">World Variables</h4>
                    </div>
                    <div className="space-y-5">
                        {Object.keys(constants).map((name) => (
                            <div key={name} className="space-y-2">
                                <div className="flex justify-between text-[9px] uppercase tracking-tighter">
                                    <span className="text-gray-500">{name}</span>
                                    <span className="text-emerald-400 font-mono">{constants[name].toFixed(name === 'planck' ? 2 : 1)}</span>
                                </div>
                                <input
                                    type="range"
                                    min={name === 'heat' ? 0 : 0}
                                    max={name === 'heat' ? 100 : 20}
                                    step="0.1"
                                    value={constants[name]}
                                    onChange={(e) => onConstantChange(name, parseFloat(e.target.value))}
                                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                />
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            <div className="mt-auto pt-6 border-t border-white/5">
                <div className="bg-red-500/5 border border-red-500/10 p-3 rounded-lg">
                    <p className="text-[10px] text-red-400 leading-relaxed italic">
                        &quot;By disabling these rules, you may witness the butterfly effect on the simulation logic.&quot;
                    </p>
                </div>
            </div>
        </div>
    );
};
