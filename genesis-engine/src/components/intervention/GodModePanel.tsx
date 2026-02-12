import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Shield, AlertTriangle, Sliders, Activity, Target, Box, Weight, Move, History, Clock } from 'lucide-react';
import { Entity } from '@/lib/simulation/schema';
import { useGenesisStore } from '@/lib/store/GenesisContext';

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
    entities?: Entity[];
}

export const GodModePanel: React.FC<GodModePanelProps> = ({
    complexity,
    onComplexityChange,
    rules,
    onToggleRule,
    constants,
    onConstantChange,
    entities = [],
}) => {
    const { state, dispatch } = useGenesisStore();
    const { selectedEntityId, discoveryYear, chronesthesiaEnabled } = state;

    const selectedEntity = entities.find(e => e.id === selectedEntityId);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onEntityPropertyChange = (id: string, property: string, value: any) => {
        dispatch({ type: 'UPDATE_ENTITY', payload: { id, property, value } });
    };

    return (
        <motion.div 
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full md:w-80 h-full flex flex-col bg-black/60 backdrop-blur-3xl border-r border-white/5 p-6 md:p-8 relative overflow-hidden"
        >
            {/* Holographic Scanline */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] overflow-hidden">
                <motion.div 
                    animate={{ y: ['0%', '100%'] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    className="w-full h-1/4 bg-white"
                />
            </div>

            <div className="flex items-center gap-4 mb-12 relative z-10">
                <div className="relative">
                    <div className="p-2.5 rounded-2xl bg-red-500/10 border border-red-500/20">
                        <Target className="w-5 h-5 text-red-500" />
                    </div>
                    <motion.div 
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="absolute inset-0 rounded-2xl bg-red-500/20 -z-10"
                    />
                </div>
                <div>
                    <h3 className="text-sm font-black font-outfit uppercase tracking-[0.3em] text-white">Intervention</h3>
                    <div className="flex items-center gap-2">
                        <span className="text-[8px] text-red-500 font-bold uppercase tracking-widest">Protocol Active</span>
                        <div className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                    </div>
                </div>
            </div>

            <div className="space-y-10 overflow-y-auto pr-2 custom-scrollbar flex-1 relative z-10">
                {/* MODULE SPIDER: Chronesthesia (v35.0) */}
                <section>
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2">
                            <History className="w-3 h-3 text-purple-400" />
                            <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Chronesthesia</h4>
                        </div>
                        <button
                            onClick={() => dispatch({ type: 'TOGGLE_CHRONESTHESIA' })}
                            className={`px-2 py-1 rounded-lg border text-[8px] font-black uppercase transition-all ${chronesthesiaEnabled ? 'bg-purple-500/20 border-purple-500/40 text-purple-400' : 'bg-white/5 border-white/5 text-gray-500'}`}
                        >
                            {chronesthesiaEnabled ? 'Active' : 'Disabled'}
                        </button>
                    </div>
                    
                    {chronesthesiaEnabled && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center px-1">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-3 h-3 text-purple-400/60" />
                                    <span className="text-[8px] font-black text-gray-500 uppercase tracking-[0.2em]">Historical Era</span>
                                </div>
                                <span className="text-xs font-black font-mono text-purple-400">{discoveryYear}</span>
                            </div>
                            <input 
                                type="range" min="1600" max="2026" step="1" 
                                value={discoveryYear}
                                onChange={(e) => dispatch({ type: 'SET_DISCOVERY_YEAR', payload: parseInt(e.target.value) })}
                                className="w-full h-1 bg-white/5 rounded-full appearance-none accent-purple-500 cursor-pointer"
                            />
                            <p className="text-[7px] text-gray-500 uppercase font-bold text-center leading-relaxed">
                                Reality is filtered by concepts discovered before {discoveryYear}.
                            </p>
                        </div>
                    )}
                </section>

                {/* v50.0 TESSERACT: AETHERIC RECALL */}
                <section>
                    <div className="flex items-center gap-2 mb-5">
                        <Move className="w-3 h-3 text-cyan-400" />
                        <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Tesseract W-Axis</h4>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center px-1">
                            <span className="text-[8px] font-black text-gray-500 uppercase tracking-[0.2em]">4D Rotation</span>
                            <span className="text-xs font-black font-mono text-cyan-400">{(state.wRotation * (180/Math.PI)).toFixed(0)}°</span>
                        </div>
                        <input 
                            type="range" min="0" max={Math.PI * 2} step="0.01" 
                            value={state.wRotation}
                            onChange={(e) => dispatch({ type: 'SET_W_ROTATION', payload: parseFloat(e.target.value) })}
                            className="w-full h-1 bg-white/5 rounded-full appearance-none accent-cyan-500 cursor-pointer"
                        />
                        <p className="text-[7px] text-gray-500 uppercase font-bold text-center leading-relaxed">
                            Rotate through the W-axis to peel back layers of time.
                        </p>
                    </div>
                </section>

                {/* Entity Inspector (New - Audit Requirement) */}
                <AnimatePresence>
                    {selectedEntity && (
                        <motion.section
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-4 mb-10 overflow-hidden"
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <Box className="w-3 h-3 text-blue-400" />
                                <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400">Inspector: {selectedEntity.name || 'Object'}</h4>
                            </div>

                            <div className="space-y-4">
                                {/* Mass */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[8px] font-bold text-gray-500 uppercase tracking-widest">
                                        <span>Mass</span>
                                        <span className="text-blue-400">{selectedEntity.physics.mass.toFixed(1)}kg</span>
                                    </div>
                                    <input 
                                        type="range" min="0.1" max="100" step="0.1" 
                                        value={selectedEntity.physics.mass}
                                        onChange={(e) => onEntityPropertyChange?.(selectedEntity.id, 'mass', parseFloat(e.target.value))}
                                        className="w-full h-1 bg-white/5 rounded-full appearance-none accent-blue-500 cursor-pointer"
                                    />
                                </div>
                                {/* Restitution */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[8px] font-bold text-gray-500 uppercase tracking-widest">
                                        <span>Bounciness</span>
                                        <span className="text-blue-400">{(selectedEntity.physics.restitution * 100).toFixed(0)}%</span>
                                    </div>
                                    <input 
                                        type="range" min="0" max="1" step="0.01" 
                                        value={selectedEntity.physics.restitution}
                                        onChange={(e) => onEntityPropertyChange?.(selectedEntity.id, 'restitution', parseFloat(e.target.value))}
                                        className="w-full h-1 bg-white/5 rounded-full appearance-none accent-blue-500 cursor-pointer"
                                    />
                                </div>
                            </div>
                        </motion.section>
                    )}
                </AnimatePresence>

                {/* ELIx Complexity Slider */}
                <section>
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2">
                            <Activity className="w-3 h-3 text-blue-400" />
                            <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Cognitive Load (ELIx)</h4>
                        </div>
                        <span className="text-[8px] font-mono text-blue-500/60 uppercase">System Set</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 bg-white/5 p-1.5 rounded-2xl border border-white/5">
                        {(['fundamental', 'standard', 'expert'] as const).map((level) => (
                            <button
                                key={level}
                                onClick={() => onComplexityChange(level)}
                                className={`text-[8px] font-black uppercase tracking-tighter py-2.5 rounded-xl transition-all ${complexity === level
                                    ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]'
                                    : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
                                    }`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                </section>

                {/* World Rule Toggles */}
                <section>
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2">
                            <Shield className="w-3 h-3 text-orange-400" />
                            <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Logic Overrides</h4>
                        </div>
                        <span className="text-[8px] font-mono text-orange-500/60 uppercase">Modified: {rules.filter(r => !r.isActive).length}</span>
                    </div>
                    <div className="space-y-2.5">
                        {rules.map((rule) => (
                            <motion.div 
                                key={rule.id} 
                                whileHover={{ x: 4 }}
                                className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:border-orange-500/20 transition-all"
                            >
                                <span className="text-[9px] font-bold text-gray-300 uppercase tracking-wide truncate pr-4">{rule.rule}</span>
                                <button
                                    onClick={() => onToggleRule(rule.id)}
                                    className={`w-10 h-5 rounded-full relative transition-all duration-500 ${rule.isActive ? 'bg-orange-500/20 border-orange-500/40' : 'bg-slate-900 border-white/5'
                                        } border`}
                                >
                                    <motion.div
                                        animate={{ 
                                            x: rule.isActive ? 22 : 4,
                                            backgroundColor: rule.isActive ? '#f97316' : '#475569'
                                        }}
                                        className="w-3 h-3 rounded-full top-0.5 absolute shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                                    />
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Dynamic Physics Constants */}
                <section>
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2">
                            <Sliders className="w-3 h-3 text-emerald-400" />
                            <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Core Variables</h4>
                        </div>
                        <span className="text-[8px] font-mono text-emerald-500/60 uppercase">Real-time</span>
                    </div>
                    <div className="space-y-6">
                        {Object.keys(constants).map((name) => (
                            <div key={name} className="space-y-3 group/var">
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-[8px] font-black text-gray-500 uppercase tracking-[0.2em] group-hover/var:text-emerald-400/60 transition-colors">{name}</span>
                                    <span className="text-xs font-black font-mono text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]">{constants[name].toFixed(name === 'planck' ? 2 : 1)}</span>
                                </div>
                                <div className="relative h-1.5 flex items-center">
                                    <div className="absolute inset-0 bg-white/5 rounded-full" />
                                    <input
                                        type="range"
                                        min={name === 'heat' ? 0 : 0}
                                        max={name === 'heat' ? 100 : 20}
                                        step="0.1"
                                        value={constants[name]}
                                        onChange={(e) => onConstantChange(name, parseFloat(e.target.value))}
                                        className="absolute inset-0 w-full h-full bg-transparent appearance-none cursor-pointer accent-emerald-500 z-10"
                                    />
                                    <motion.div 
                                        className="absolute left-0 h-full bg-emerald-500/30 rounded-full"
                                        style={{ width: `${(constants[name] / (name === 'heat' ? 100 : 20)) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            <div className="mt-auto pt-8 border-t border-white/5 relative z-10">
                <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-2xl">
                    <p className="text-[9px] text-red-400/80 leading-relaxed font-medium uppercase tracking-wider text-center">
                        Caution: High-Level Cognitive Intervention may cause logic divergence
                    </p>
                </div>
            </div>
        </motion.div>
    );
};
