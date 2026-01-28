'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { Brain, Settings, List, X } from 'lucide-react';
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
        setActiveChallenge, toggleRule, handleConstantChange, isSabotaged, mode
    } = engine;

    const {
        isListening, setIsListening, isRealityLensOpen, setIsRealityLensOpen,
        isGardenOpen, setIsGardenOpen, podcastScript, isGeneratingPodcast,
        handleStartPodcast, pythonOutput, isExecutingPython, handleRunVerification,
        handleTeleport, handleExport, handleSaboteurReply
    } = ui;

    const showSimulation = mode !== 'IDLE' && mode !== null;
    const isPhysicsMode = mode === 'PHYSICS' || mode === 'VOXEL' || mode === 'SCIENTIFIC' || mode === 'ASSEMBLER';

    return (
        <main className="fixed inset-0 w-screen h-screen overflow-hidden font-inter text-foreground bg-[#020205] flex flex-col">
            <NeuralBackground />

            {/* Top Bar Controls (Mobile Only) */}
            <div className="fixed top-6 left-0 right-0 px-6 z-[1001] flex justify-between items-center md:hidden pointer-events-none">
                <button 
                    onClick={() => setIsLogsOpen(!isLogsOpen)}
                    className="p-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl text-blue-400 pointer-events-auto active:scale-95 transition-all"
                >
                    <List className="w-5 h-5" />
                </button>
                <button 
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    className="p-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl text-red-500 pointer-events-auto active:scale-95 transition-all"
                >
                    <Settings className="w-5 h-5" />
                </button>
            </div>

            {/* CORE CONTENT AREA */}
            <div className="relative flex-1 w-full h-full">
                <AnimatePresence mode="wait">
                    {!showSimulation ? (
                        <motion.div 
                            key="landing"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 text-center"
                        >
                            <h1 className="text-6xl md:text-8xl font-outfit font-black mb-4 tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
                                Genesis
                            </h1>
                            <p className="text-gray-500 text-sm md:text-base uppercase tracking-[0.5em] mb-12">
                                The Ultimate Aggregator
                            </p>
                            <div className="flex flex-wrap justify-center gap-3">
                                {["Show me Gravity", "Scan Homework", "Simulate Inflation"].map(chip => (
                                    <button 
                                        key={chip} 
                                        onClick={() => setOmniPrompt?.(chip)} 
                                        className="px-6 py-3 bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-mono border border-white/10 rounded-full transition-all active:scale-95"
                                    >
                                        [{chip}]
                                    </button>
                                ))}
                            </div>
                            {error && (
                                <motion.p initial={{y: 20, opacity: 0}} animate={{y: 0, opacity: 1}} className="mt-8 text-red-400 text-xs font-medium uppercase tracking-widest px-6 py-3 bg-red-400/5 rounded-full border border-red-400/10">
                                    Error: {error}
                                </motion.p>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="active-engine"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-0 flex flex-col"
                        >
                            {/* Processing Overlay */}
                            <AnimatePresence>
                                {isProcessing && (
                                    <motion.div 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/60 backdrop-blur-3xl"
                                    >
                                        <div className="relative">
                                            <Brain className="w-16 h-16 text-blue-500 animate-pulse" />
                                            <motion.div 
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                                className="absolute -inset-4 border-2 border-dashed border-blue-500/20 rounded-full"
                                            />
                                        </div>
                                        <h2 className="mt-12 text-sm font-black uppercase tracking-[1em] text-blue-400 animate-pulse">
                                            {isPhysicsMode ? "Architecting Reality" : "Synthesizing Neural Path"}
                                        </h2>
                                        <p className="mt-4 text-[10px] font-mono text-blue-900 uppercase tracking-widest">
                                            Executing kinetic compilation...
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* The 3D Layer (Fixed to Fill) */}
                            <div className="absolute inset-0 z-0">
                                <ErrorBoundary componentName="Holodeck">
                                    <Holodeck
                                        debug={false}
                                        isPaused={isPaused}
                                        onCollision={(mag: number) => {
                                            sfx.playCollision(mag);
                                            handleSimulationFailure(`Impact detected: ${mag.toFixed(1)}`);
                                        }}
                                        backgroundMode={isProcessing}
                                        gardenNodes={gardenState.nodes}
                                    />
                                </ErrorBoundary>
                            </div>

                            {/* UI Overlays Layer */}
                            <div className="relative z-10 flex-1 flex flex-col pointer-events-none">
                                {!isPhysicsMode && <NavigationHeader setIsGardenOpen={setIsGardenOpen} />}
                                
                                <div className="flex-1 relative">
                                    <div className="absolute inset-0 pointer-events-none">
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
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* PERMANENT HUD ELEMENTS */}
            <div className="relative z-[1000] pointer-events-none">
                {/* OmniBar is always at the bottom center */}
                <div className="pointer-events-auto">
                    <OmniBar 
                        onCameraClick={() => setIsRealityLensOpen(true)} 
                        externalPrompt={omniPrompt} 
                        onPromptChange={setOmniPrompt} 
                        handleIngest={engine.handleIngest} 
                    />
                </div>

                {/* Right Sidebar (God Mode) */}
                <div className={`
                    fixed inset-y-0 right-0 md:relative z-[1005] transition-transform duration-500 transform
                    ${isSettingsOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
                    w-full md:w-auto h-full border-l border-white/5 pointer-events-auto
                `}>
                    <AnimatePresence>
                        {isSettingsOpen && (
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
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* FOOTER */}
            {!isPhysicsMode && <StatusFooter overridesCount={godModeState.overrides.length} complexity={godModeState.complexity} />}

            {/* MODALS & POPUPS */}
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