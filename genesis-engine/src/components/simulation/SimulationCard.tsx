import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Activity, Globe, Zap } from 'lucide-react';

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
        <motion.div 
            initial={{ opacity: 0, x: -20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            className="relative max-w-md w-full group"
        >
            {/* Holographic Border Glow */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur opacity-30 group-hover:opacity-100 transition duration-1000" />
            
            <div className="relative p-8 rounded-3xl bg-black/40 backdrop-blur-3xl border border-white/10 shadow-2xl text-white overflow-hidden">
                {/* Scanning Line Effect */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <motion.div 
                        animate={{ y: ['0%', '100%'] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="w-full h-1/2 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent"
                    />
                </div>

                <div className="mb-8">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <span className="text-[8px] font-black uppercase tracking-[0.5em] text-blue-400/60 mb-1 block">Tactical Analysis</span>
                            <h2 className="text-4xl font-black font-outfit bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-white/40 tracking-tighter">
                                {title}
                            </h2>
                        </div>
                        <motion.div 
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20"
                        >
                            <Activity className="w-4 h-4 text-blue-400" />
                        </motion.div>
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold leading-relaxed uppercase tracking-widest opacity-80 border-l-2 border-blue-500/30 pl-3">
                        {description}
                    </p>
                </div>

                <div className="space-y-4 mb-8">
                    {rules.map((rule, idx) => (
                        <motion.div 
                            key={idx}
                            whileHover={{ x: 5 }}
                            className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group/rule"
                        >
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                    <Zap className="w-3 h-3 text-amber-400" />
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Parameter Set</span>
                                </div>
                                {rule.verified && (
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                                        <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                                        <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400">Ground Truth</span>
                                    </div>
                                )}
                            </div>
                            <h4 className="text-xs font-black text-gray-100 mb-1 tracking-wide uppercase">{rule.name}</h4>
                            <p className="text-[10px] text-gray-500 leading-normal font-medium">{rule.effect}</p>
                        </motion.div>
                    ))}
                </div>

                {societalImpact && (
                    <div className="mb-8 p-5 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-white/5 relative group/impact">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/20">
                                <Globe className="w-4 h-4 text-indigo-400" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300">Macro Impact</span>
                        </div>
                        <p className="text-xs text-indigo-100/80 font-medium italic leading-relaxed">
                            &quot;{societalImpact}&quot;
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    {actions.map((action, idx) => (
                        <button
                            key={idx}
                            onClick={() => onAction?.(action)}
                            className="group/btn relative p-4 rounded-2xl bg-white/5 border border-white/10 overflow-hidden transition-all duration-300 active:scale-95"
                        >
                            <div className="absolute inset-0 bg-blue-500/0 group-hover/btn:bg-blue-500/10 transition-colors" />
                            <span className="relative text-[9px] font-black uppercase tracking-[0.2em] text-gray-300 group-hover/btn:text-white transition-colors">
                                {action}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};
