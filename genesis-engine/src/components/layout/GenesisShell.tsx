'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { Brain, Settings, List, X, Sparkles } from 'lucide-react';
import { sfx } from '@/lib/sound/SoundManager';

// Components
import { WorldRulesList } from '@/components/ingestion/WorldRulesList';
import { GodModePanel } from '@/components/intervention/GodModePanel';
import { RealityDiff } from '@/components/simulation/RealityDiff';
import RealityLens from '@/components/simulation/RealityLens';
import { MindGarden } from '@/components/simulation/MindGarden';
import SkillTree from '@/components/ui/SkillTree';
import { OmniBar } from '@/components/ui/OmniBar';
import { SaboteurDialogue } from '@/components/ui/SaboteurDialogue';
import { QuestOverlay } from '@/components/ui/QuestOverlay';
import { MissionLog } from '@/components/ui/MissionLog';
import { DynamicController } from '@/components/ui/DynamicController';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { Holodeck } from '@/components/simulation/Holodeck';
import { PerformanceMonitor } from '@/components/common/PerformanceMonitor';

// View Modules
import { DashboardView } from '@/components/views/DashboardView';
import { SimulationView } from '@/components/views/SimulationView';
import { NavigationHeader } from '@/components/views/NavigationHeader';
import { StatusFooter } from '@/components/views/StatusFooter';

import { useGenesisEngine } from '@/hooks/useGenesisEngine';
import { useLocalInterface } from '@/hooks/useLocalInterface';
import { useBiometrics } from '@/hooks/useBiometrics';

const NeuralBackground = dynamic(() => import('@/components/ui/NeuralBackground').then(mod => mod.NeuralBackground), { ssr: false });

interface GenesisShellProps {
    engine: ReturnType<typeof useGenesisEngine>;
    ui: ReturnType<typeof useLocalInterface>;
}

/**
 * GenesisShell v6.0: The Neural Operating System
 * Features: Ambient background mode, strict unmounting, and cinematic transitions.
 */
export const GenesisShell: React.FC<GenesisShellProps> = ({ engine, ui }) => {
    useBiometrics();

    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
    const [isLogsOpen, setIsLogsOpen] = React.useState(false);

    const {
        isIngested, isProcessing, worldRules, error, godModeState,
        worldState, setComplexity, isPaused, diagnostics, resetSimulation,
        handleSimulationFailure, gardenState, skillTree, activeNode,
        completedNodeIds, startSimulation, neuralEngineProgress, setError,
        omniPrompt, setOmniPrompt, activeChallenge, selectedEntityId,
        setActiveChallenge, toggleRule, handleConstantChange, isSabotaged, mode,
        isVerifyingLogic
    } = engine;

    const {
        isListening, setIsListening, isRealityLensOpen, setIsRealityLensOpen,
        isGardenOpen, setIsGardenOpen, podcastScript, isGeneratingPodcast,
        handleStartPodcast, pythonOutput, isExecutingPython, handleRunVerification,
        handleTeleport, handleExport, handleSaboteurReply
    } = ui;

    // A world is "active" if it has entities or a custom script
    const hasActiveContent = worldState && (worldState.entities?.length || worldState.custom_canvas_code);
    const isActuallySimulating = hasActiveContent && mode !== 'IDLE' && mode !== null;
    const isPhysicsMode = mode === 'PHYSICS' || mode === 'VOXEL' || mode === 'SCIENTIFIC' || mode === 'ASSEMBLER';

    return (
        <main className="fixed inset-0 w-screen h-screen overflow-hidden font-inter text-foreground bg-[#020205] flex flex-col">
            <NeuralBackground />

            {/* --- 1. THE CINEMATIC BACKGROUND --- */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <motion.div
                    animate={{
                        filter: isActuallySimulating ? 'blur(0px)' : 'blur(15px)',
                        scale: isActuallySimulating ? 1 : 1.1,
                        opacity: isActuallySimulating ? 1 : 0.3
                    }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    className="w-full h-full"
                >
                    <ErrorBoundary componentName="Holodeck">
                        <Holodeck
                            debug={false}
                            isPaused={isPaused}
                            onCollision={(mag: number) => {
                                sfx.playCollision(mag);
                                handleSimulationFailure(`Impact detected: ${mag.toFixed(1)}`);
                            }}
                            backgroundMode={!isActuallySimulating || isProcessing}
                            gardenNodes={gardenState.nodes}
                        />
                    </ErrorBoundary>
                </motion.div>
            </div>

            {/* --- 2. THE HUD / INTERFACE LAYER --- */}
            <div className="relative z-10 w-full h-full pointer-events-none flex flex-col">
                
                {/* ADVANCED LANDING UI */}
                <AnimatePresence>
                    {!isActuallySimulating && (
                        <motion.div 
                            key="landing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-[50]"
                        >
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 0.8 }}
                                className="relative"
                            >
                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
                                <h1 className="text-7xl md:text-9xl font-outfit font-black mb-2 tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/20 drop-shadow-2xl">
                                    Genesis
                                </h1>
                                <div className="flex items-center justify-center gap-4 mb-12">
                                    <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-blue-500/50" />
                                    <p className="text-blue-400 text-xs font-black uppercase tracking-[0.8em]">
                                        Neural Operating System
                                    </p>
                                    <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-blue-500/50" />
                                </div>
                            </motion.div>

                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="flex flex-wrap justify-center gap-3 pointer-events-auto max-w-2xl"
                            >
                                {["Simulate Gravity", "Orbital Mechanics", "Car Crash Physics", "Molecular Bond"].map(chip => (
                                    <button 
                                        key={chip} 
                                        onClick={() => {
                                            sfx.playClick();
                                            setOmniPrompt?.(chip);
                                        }} 
                                        className="group relative px-6 py-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-[10px] font-black uppercase tracking-widest border border-white/5 rounded-full transition-all active:scale-95 overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                        {chip}
                                    </button>
                                ))}
                            </motion.div>

                            {error && (
                                <motion.div initial={{y: 10, opacity: 0}} animate={{y: 0, opacity: 1}} className="mt-8 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                                    <X className="w-3 h-3" /> Error: {error}
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* SIMULATION OVERLAYS */}
                <AnimatePresence>
                    {isActuallySimulating && (
                        <motion.div 
                            key="simulation-hud"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex-1 flex flex-col w-full h-full relative"
                        >
                            {!isPhysicsMode && <NavigationHeader setIsGardenOpen={setIsGardenOpen} />}
                            
                            <div className="flex-1 relative">
                                {isPhysicsMode ? (
                                    <SimulationView engine={engine} />
                                ) : (
                                    <DashboardView
                                        engine={engine}
                                        isListening={isListening}
                                        onToggleListening={() => setIsListening(!isListening)}
                                        handleStartPodcast={handleStartPodcast}
                                        isGeneratingPodcast={isGeneratingPodcast}
                                        podcastScript={podcastScript}
                                        handleRunVerification={handleRunVerification}
                                        isExecutingPython={isExecutingPython}
                                        pythonOutput={pythonOutput}
                                        handleExport={handleExport}
                                    />
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* THE "BRAIN" PROCESSING OVERLAY */}
                <AnimatePresence>
                    {isProcessing && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-[2000] flex flex-col items-center justify-center bg-black/40 backdrop-blur-md"
                        >
                            <div className="relative">
                                <Brain className="w-12 h-12 text-blue-500 animate-pulse" />
                                <motion.div 
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    className="absolute -inset-4 border border-dashed border-blue-500/30 rounded-full"
                                />
                            </div>
                            <h2 className="mt-8 text-[10px] font-black uppercase tracking-[1em] text-blue-400 animate-pulse ml-[1em]">
                                {isVerifyingLogic ? "Verifying Logic with Saboteur..." : "Architecting Reality"}
                            </h2>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* GLOBAL OVERLAYS (OMNIBAR & SIDEBAR) */}
                <div className="mt-auto relative z-[3000] pointer-events-none">
                    <div className="pointer-events-auto flex flex-col items-center pb-8">
                        <div className="w-full max-w-3xl px-6">
                            <OmniBar 
                                onCameraClick={() => setIsRealityLensOpen(true)} 
                                externalPrompt={omniPrompt} 
                                onPromptChange={setOmniPrompt} 
                                handleIngest={engine.handleIngest} 
                            />
                        </div>
                    </div>

                    <aside className={`
                        fixed inset-y-0 right-0 z-[3001] transition-transform duration-500 transform
                        ${isSettingsOpen ? 'translate-x-0' : 'translate-x-full'}
                        w-full md:w-80 h-full border-l border-white/5 pointer-events-auto
                    `}>
                        <div className="h-full bg-[#020205]/95 backdrop-blur-2xl">
                            <GodModePanel
                                complexity={godModeState.complexity}
                                onComplexityChange={setComplexity}
                                rules={worldRules}
                                onToggleRule={toggleRule}
                                constants={godModeState.constants}
                                onConstantChange={handleConstantChange}
                                entities={worldState?.entities}
                            />
                            <button 
                                onClick={() => setIsSettingsOpen(false)}
                                className="absolute top-8 right-8 p-2 text-white/50 hover:text-white"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </aside>
                </div>
            </div>

            {/* STATUS HUD */}
            {isActuallySimulating && !isPhysicsMode && (
                <StatusFooter overridesCount={godModeState.overrides.length} complexity={godModeState.complexity} />
            )}

            {/* FLOATING TRIGGERS */}
            {isActuallySimulating && !isSettingsOpen && (
                <button 
                    onClick={() => setIsSettingsOpen(true)}
                    className="fixed right-0 top-1/2 -translate-y-1/2 z-[3000] p-4 bg-black/40 backdrop-blur-xl border-l border-t border-b border-white/10 rounded-l-2xl text-blue-400 hover:text-white hover:bg-blue-600/20 transition-all active:scale-95 pointer-events-auto"
                >
                    <Settings className="w-6 h-6 animate-pulse" />
                </button>
            )}

            {/* MODALS */}
            <AnimatePresence>
                {activeChallenge && (
                    <SaboteurDialogue question={activeChallenge} onReply={handleSaboteurReply} onClose={() => setActiveChallenge(null)} />
                )}
                {isRealityLensOpen && <RealityLens onTeleport={handleTeleport} onClose={() => setIsRealityLensOpen(false)} />}
                {isGardenOpen && <MindGarden nodes={gardenState.nodes} onClose={() => setIsGardenOpen(false)} />}
            </AnimatePresence>

            <RealityDiff isOpen={!!diagnostics} hypothesis={diagnostics?.hypothesis || ''} outcome={diagnostics?.outcome || ''} sabotageReveal={diagnostics?.sabotageReveal} onReset={resetSimulation} />
            <DynamicController />
            <QuestOverlay />
            <PerformanceMonitor />
        </main>
    );
};