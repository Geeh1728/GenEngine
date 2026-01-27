'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useGenesisStore } from '@/lib/store/GenesisContext';
import { Activity, Gauge, Zap } from 'lucide-react';

/**
 * THE GENERATIVE UI (Module Stitch)
 * Objective: AI-generated HUD components based on simulation context.
 * Logic: Analyzes WorldState scenario and 'Stitches' together a custom controller.
 */
export const DynamicController: React.FC = () => {
    const { state } = useGenesisStore();
    const { worldState } = state;

    const hudLayout = useMemo(() => {
        if (!worldState?.scenario) return null;

        const scenario = worldState.scenario.toLowerCase();
        
        // 1. RADIATION SCENARIO (Geiger Counter)
        if (scenario.includes('nuclear') || scenario.includes('radiation') || scenario.includes('atom')) {
            return (
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-400" />
                        <span className="text-[10px] font-black uppercase text-emerald-400">Radiation Intensity</span>
                    </div>
                    <div className="relative h-2 w-full bg-emerald-950 rounded-full overflow-hidden border border-emerald-500/20">
                        <motion.div 
                            animate={{ width: ['10%', '80%', '30%', '90%', '50%'] }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                            className="h-full bg-emerald-500 shadow-[0_0_15px_#10b981]" 
                        />
                    </div>
                    <p className="text-[8px] text-emerald-200/60 font-mono">STITCH: GEIGER_UNIT_v1.0 ACTIVE</p>
                </div>
            );
        }

        // 2. POWER SCENARIO (Voltage Meter)
        if (scenario.includes('electric') || scenario.includes('circuit') || scenario.includes('power')) {
            return (
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        <span className="text-[10px] font-black uppercase text-yellow-400">Voltage Potential</span>
                    </div>
                    <div className="flex gap-1 h-8 items-end">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <motion.div 
                                key={i}
                                animate={{ height: [`${Math.random() * 100}%`, `${Math.random() * 100}%`] }}
                                transition={{ duration: 0.2, repeat: Infinity }}
                                className="w-2 bg-yellow-500 rounded-t-sm"
                            />
                        ))}
                    </div>
                    <p className="text-[8px] text-yellow-200/60 font-mono">STITCH: VOLT_STREAMS_v2.1 ACTIVE</p>
                </div>
            );
        }

        // 3. MOTION SCENARIO (Velocity Gauge)
        if (scenario.includes('orbit') || scenario.includes('speed') || scenario.includes('acceleration') || scenario.includes('planetary')) {
            const isPlanetary = scenario.includes('planetary') || scenario.includes('moon') || scenario.includes('gravity');
            return (
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                        {isPlanetary ? <Zap className="w-4 h-4 text-indigo-400" /> : <Gauge className="w-4 h-4 text-blue-400" />}
                        <span className={`text-[10px] font-black uppercase ${isPlanetary ? 'text-indigo-400' : 'text-blue-400'}`}>
                            {isPlanetary ? 'Local Gravity Constant' : 'Orbital Velocity'}
                        </span>
                    </div>
                    {isPlanetary ? (
                        <div className="flex items-center justify-center py-4">
                            <motion.div 
                                animate={{ scale: [1, 1.2, 1], rotate: 360 }}
                                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-[0_0_30px_rgba(99,102,241,0.4)] flex items-center justify-center"
                            >
                                <span className="text-white font-black text-xs">G</span>
                            </motion.div>
                        </div>
                    ) : (
                        <div className="text-4xl font-black text-white tabular-nums">
                            {Math.floor(Math.random() * 7000 + 27000).toLocaleString()}<span className="text-xs ml-1 opacity-50">km/h</span>
                        </div>
                    )}
                    <p className={`text-[8px] font-mono ${isPlanetary ? 'text-indigo-200/60' : 'text-blue-200/60'}`}>
                        STITCH: {isPlanetary ? 'GRAVITY_FLOATER_v1.2' : 'TELEMENTRY_HOOK_v4.5'} ACTIVE
                    </p>
                </div>
            );
        }

        // 4. THERMAL SCENARIO (Lava Meter)
        if (scenario.includes('volcano') || scenario.includes('lava') || scenario.includes('heat') || scenario.includes('magma')) {
            return (
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-orange-500" />
                        <span className="text-[10px] font-black uppercase text-orange-500">Magmatic Pressure</span>
                    </div>
                    <div className="relative h-12 w-full bg-orange-950/30 rounded-xl overflow-hidden border border-orange-500/20 flex items-center justify-center">
                        <motion.div 
                            animate={{ 
                                background: ['rgba(249, 115, 22, 0.2)', 'rgba(249, 115, 22, 0.6)', 'rgba(249, 115, 22, 0.2)'],
                                scale: [1, 1.05, 1]
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 bg-orange-500/20" 
                        />
                        <span className="text-orange-500 font-black text-xl z-10 tabular-nums">CRITICAL</span>
                    </div>
                    <p className="text-[8px] text-orange-200/60 font-mono">STITCH: LAVA_SENTINEL_v0.9 ACTIVE</p>
                </div>
            );
        }

        return null;
    }, [worldState?.scenario]);

    if (!hudLayout) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="fixed bottom-36 right-6 w-64 p-6 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl z-[100]"
        >
            <div className="absolute top-0 right-0 p-2 opacity-20">
                <span className="text-[6px] font-black uppercase tracking-widest text-white">Generative HUD Layer</span>
            </div>
            {hudLayout}
        </motion.div>
    );
};
