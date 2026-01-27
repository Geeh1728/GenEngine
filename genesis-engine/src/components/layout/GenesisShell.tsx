'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { Brain } from 'lucide-react';
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
import { Settings, List, X } from 'lucide-react';

// View Modules
import { DashboardView } from '@/components/views/DashboardView';
import { SimulationView } from '@/components/views/SimulationView';
import { NavigationHeader } from '@/components/views/NavigationHeader';
import { StatusFooter } from '@/components/views/StatusFooter';
// ...
import { useGenesisEngine } from '@/hooks/useGenesisEngine';
import { useLocalInterface } from '@/hooks/useLocalInterface';
import { useBiometrics } from '@/hooks/useBiometrics';

// Dynamic Imports

const NeuralBackground = dynamic(() => import('@/components/ui/NeuralBackground').then(mod => mod.NeuralBackground), { ssr: false });

interface GenesisShellProps {
    engine: ReturnType<typeof useGenesisEngine>;
    ui: ReturnType<typeof useLocalInterface>;
}

/**
 * GenesisShell: The Visual Chassis
 * Handles layout, overlays, and view switching. Decoupled from logic.
 */
export const GenesisShell: React.FC<GenesisShellProps> = ({ engine, ui }) => {
    // Initialize Biometrics (Cognitive Sentinel)
    useBiometrics();

    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
    const [isLogsOpen, setIsLogsOpen] = React.useState(false);

    const {
        isIngested,
        isProcessing,
        worldRules,
        error,
        godModeState,
        worldState,
        setComplexity,
        isPaused,
        diagnostics,
        resetSimulation,
        handleSimulationFailure,
        gardenState,
        skillTree,
        activeNode,
        completedNodeIds,
        startSimulation,
        neuralEngineProgress,
        setError,
        omniPrompt,
        setOmniPrompt,
        activeChallenge,
        selectedEntityId,
        setActiveChallenge,
        toggleRule,
        handleConstantChange,
        isSabotaged,
        mode
    } = engine;

    const {
        isListening, setIsListening,
        isRealityLensOpen, setIsRealityLensOpen,
        isGardenOpen, setIsGardenOpen,
        podcastScript,
        isGeneratingPodcast,
        handleStartPodcast,
        pythonOutput,
        isExecutingPython,
        handleRunVerification,
        handleTeleport,
        handleExport,
        handleSaboteurReply
    } = ui;

    const showSimulation = mode !== 'IDLE' && mode !== null;
    const isPhysicsMode = mode === 'PHYSICS' || mode === 'VOXEL' || mode === 'SCIENTIFIC' || mode === 'ASSEMBLER';

    return (
        <main className="min-h-screen relative overflow-hidden font-inter text-foreground bg-[#020205]">
            <NeuralBackground />

            {/* Foreground Layer: Views */}
            <div className="relative z-10 h-full w-full">
                <AnimatePresence mode="wait">
                    {!showSimulation ? (
                        <motion.div 
                            key="landing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none"
                        >
                            <h1 className="text-6xl font-outfit font-black mb-4 tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">Genesis</h1>
                            <p className="text-gray-500 text-sm uppercase tracking-[0.5em]">The Ultimate Aggregator</p>
                            <div className="mt-8 flex gap-3 pointer-events-auto">
                                {["Show me Gravity", "Scan Homework", "Simulate Inflation"].map(chip => (
                                    <button key={chip} onClick={() => setOmniPrompt?.(chip)} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-mono border border-white/10 rounded-full transition-all">
                                        [{chip}]
                                    </button>
                                ))}
                            </div>
                            {error && <p className="mt-8 text-red-400 text-xs font-medium uppercase tracking-widest px-4 py-2 bg-red-400/5 rounded-full border border-red-400/10 pointer-events-auto">Error: {error}</p>}
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="simulation-layer"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-0 h-full w-full"
                        >
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
                            
                            {/* Simulation Overlays */}
                            <div className="relative z-40 pointer-events-none h-full w-full">
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
            </div>

            {/* Global Overlays */}
            <div className="relative z-[1000]">
                <OmniBar onCameraClick={() => setIsRealityLensOpen(true)} externalPrompt={omniPrompt} onPromptChange={setOmniPrompt} handleIngest={engine.handleIngest} />
                
                <div className={`
                    fixed inset-y-0 right-0 md:relative z-[1005] md:z-10 transition-transform duration-500 transform
                    ${isSettingsOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
                    w-full md:w-auto h-full border-l border-white/5
                `}>
                    <AnimatePresence>
                        {isIngested && isSettingsOpen && (
                            <GodModePanel
                                complexity={godModeState.complexity}
                                onComplexityChange={setComplexity}
                                rules={worldRules}
                                onToggleRule={toggleRule}
                                constants={godModeState.constants}
                                onConstantChange={handleConstantChange}
                                entities={worldState?.entities}
                            />
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {!isPhysicsMode && <StatusFooter overridesCount={godModeState.overrides.length} complexity={godModeState.complexity} />}

            <OmniBar onCameraClick={() => setIsRealityLensOpen(true)} externalPrompt={omniPrompt} onPromptChange={setOmniPrompt} handleIngest={engine.handleIngest} />

            <RealityDiff isOpen={!!diagnostics} hypothesis={diagnostics?.hypothesis || ''} outcome={diagnostics?.outcome || ''} sabotageReveal={diagnostics?.sabotageReveal} onReset={resetSimulation} />

            <AnimatePresence>
                {isRealityLensOpen && <RealityLens onTeleport={handleTeleport} onClose={() => setIsRealityLensOpen(false)} />}
            </AnimatePresence>

            <AnimatePresence>
                {isGardenOpen && <MindGarden nodes={gardenState.nodes} onClose={() => setIsGardenOpen(false)} />}
            </AnimatePresence>

            <DynamicController />

            <QuestOverlay />

            <PerformanceMonitor />
        </main>
    );
};
