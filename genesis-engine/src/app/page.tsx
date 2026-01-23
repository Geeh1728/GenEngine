'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

// Components
import { WorldRulesList } from '@/components/ingestion/WorldRulesList';
import { GodModePanel } from '@/components/intervention/GodModePanel';
import { RealityDiff } from '@/components/simulation/RealityDiff';
import RealityLens from '@/components/simulation/RealityLens';
import { MindGarden } from '@/components/simulation/MindGarden';
import SkillTree from '@/components/ui/SkillTree';
import { OmniBar } from '@/components/ui/OmniBar';
import { SaboteurDialogue } from '@/components/ui/SaboteurDialogue';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

// View Modules
import { DashboardView } from '@/components/views/DashboardView';
import { SimulationView } from '@/components/views/SimulationView';
import { NavigationHeader } from '@/components/views/NavigationHeader';
import { StatusFooter } from '@/components/views/StatusFooter';

// Actions & Hooks
import { generatePodcastScript } from '@/app/actions/podcast';
import { runPython } from '@/lib/python/pyodide';
import { useGenesisEngine } from '@/hooks/useGenesisEngine';
import { Brain } from 'lucide-react';
import { Entity } from '@/lib/simulation/schema';

// Dynamic imports for browser-only components
const Holodeck = dynamic(() => import('@/components/simulation/Holodeck').then(mod => mod.Holodeck), { ssr: false });
const NeuralBackground = dynamic(() => import('@/components/ui/NeuralBackground').then(mod => mod.NeuralBackground), { ssr: false });

/**
 * HOME: The primary viewport for the Genesis Engine.
 * Titan Protocol v3.6 Refactor: View Modules, Error Boundaries, and Decoupled State.
 */
export default function Home() {
  const engine = useGenesisEngine();
  
  const {
    isIngested,
    isProcessing,
    worldRules,
    sourceTitle,
    error,
    godModeState,
    worldState,
    handleIngest,
    toggleRule,
    handleConstantChange,
    setComplexity,
    isPaused,
    diagnostics,
    handleSimulationFailure,
    resetSimulation,
    setWorldState,
    gardenState,
    isSabotaged,
    skillTree,
    activeNode,
    completedNodeIds,
    startSimulation,
    neuralEngineProgress,
    setActiveNode,
    setError,
    omniPrompt,
    setOmniPrompt,
    activeChallenge,
    setActiveChallenge
  } = engine;

  // Local UI State
  const [isListening, setIsListening] = useState(false);
  const [isRealityLensOpen, setIsRealityLensOpen] = useState(false);
  const [isGardenOpen, setIsGardenOpen] = useState(false);
  const [podcastScript, setPodcastScript] = useState<{host: 'A' | 'B', text: string}[] | null>(null);
  const [isGeneratingPodcast, setIsGeneratingPodcast] = useState(false);
  const [pythonOutput, setPythonOutput] = useState<{ stdout: string | null; result: any; error: string | null } | null>(null);
  const [isExecutingPython, setIsExecutingPython] = useState(false);

  // Handlers
  const handleStartPodcast = async () => {
    if (!worldRules.length) return;
    setIsGeneratingPodcast(true);
    const content = worldRules.map(r => `${r.rule}: ${r.description}`).join('\n');
    const script = await generatePodcastScript(content);
    setPodcastScript(script);
    setIsGeneratingPodcast(false);
  };

  const handleRunVerification = async () => {
    if (!worldState?.python_code) return;
    setIsExecutingPython(true);
    const result = await runPython(worldState.python_code);
    setPythonOutput(result);
    setIsExecutingPython(false);
  };

  const handleTeleport = (newEntities: Entity[]) => {
    setWorldState((prev: any) => {
      if (!prev) return null;
      return { ...prev, entities: [...(prev.entities || []), ...newEntities] };
    });
  };

  const handleExport = () => {
    alert("Knowledge Crystal Manifested! Study bundle exported to your workspace.");
  };

  const handleSaboteurReply = (reply: string) => {
    setOmniPrompt?.(reply);
    setActiveChallenge(null);
  };

  const isPhysicsMode = worldState?.mode === 'PHYSICS' || worldState?.mode === 'VOXEL' || worldState?.mode === 'SCIENTIFIC' || worldState?.mode === 'ASSEMBLER';

  return (
    <main className="min-h-screen relative overflow-hidden font-inter text-foreground bg-[#020205]">
      <NeuralBackground />

      <AnimatePresence>
        {activeChallenge && (
          <SaboteurDialogue
            question={activeChallenge}
            onReply={handleSaboteurReply}
            onClose={() => setActiveChallenge(null)}
          />
        )}
      </AnimatePresence>

      {/* Progress Overlay */}
      <AnimatePresence>
        {neuralEngineProgress > 0 && neuralEngineProgress < 100 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] w-64 bg-black/80 backdrop-blur-xl border border-blue-500/30 p-4 rounded-2xl"
          >
            <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-blue-400 mb-2">
              <span>Neural Engine Sync</span>
              <span>{Math.round(neuralEngineProgress)}%</span>
            </div>
            <div className="h-1 bg-blue-950 rounded-full overflow-hidden">
              <motion.div className="h-full bg-blue-500" initial={{ width: 0 }} animate={{ width: `${neuralEngineProgress}%` }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Glitch Effect */}
      <AnimatePresence>
        {isSabotaged && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.2, 0.1, 0.3, 0.1], x: [0, -5, 5, -2, 2, 0] }}
            exit={{ opacity: 0 }}
            transition={{ repeat: Infinity, duration: 0.2 }}
            className="fixed inset-0 z-[9999] pointer-events-none bg-red-900/5 mix-blend-difference"
          />
        )}
      </AnimatePresence>

      {!isPhysicsMode && <NavigationHeader setIsGardenOpen={setIsGardenOpen} />}

      <div className="relative z-10 flex h-[calc(100vh-100px)]">
        <AnimatePresence>
          {isIngested && !skillTree && !isPhysicsMode && (
            <GodModePanel
              complexity={godModeState.complexity}
              onComplexityChange={setComplexity}
              rules={worldRules}
              onToggleRule={toggleRule}
              constants={godModeState.constants}
              onConstantChange={handleConstantChange}
            />
          )}
        </AnimatePresence>

        <div className="flex-1 flex flex-col relative overflow-hidden">
          {/* Simulation Layer with Error Boundary */}
          <motion.div 
            animate={{
                filter: ((!skillTree && !isIngested) && !isPhysicsMode) || isProcessing ? 'blur(8px)' : 'blur(0px)',
                opacity: ((!skillTree && !isIngested) && !isPhysicsMode) ? 0.4 : 1,
            }}
            className="absolute inset-0 z-0"
          >
            <ErrorBoundary componentName="Holodeck">
              <Holodeck
                worldState={worldState}
                activeNode={activeNode}
                debug={true}
                isPaused={isPaused}
                onCollision={(mag) => handleSimulationFailure(`Impact detected: ${mag.toFixed(1)}`)}
                backgroundMode={(!skillTree && !isIngested) || isProcessing}
                gardenNodes={gardenState.nodes}
              />
            </ErrorBoundary>
          </motion.div>

          <AnimatePresence mode="wait">
            {!skillTree && !isIngested && !isPhysicsMode ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none">
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
            ) : isProcessing && !activeNode && !isPhysicsMode ? (
              <motion.div key="processing" className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-3xl">
                <Brain className="w-12 h-12 text-blue-500 animate-pulse" />
                <h2 className="mt-8 text-sm font-black uppercase tracking-[1em] text-blue-400">Architecting Reality</h2>
              </motion.div>
            ) : skillTree && !activeNode && !isPhysicsMode ? (
               <motion.div key="skill-tree" className="absolute inset-0 z-40 overflow-y-auto bg-[#020205] p-24">
                   <SkillTree nodes={skillTree.nodes} recommendedPath={skillTree.recommendedPath} completedNodeIds={completedNodeIds} onNodeClick={startSimulation} />
               </motion.div>
            ) : isPhysicsMode ? (
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
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {isIngested && !isPhysicsMode && <WorldRulesList rules={worldRules} />}
        </AnimatePresence>
      </div>

      {!isPhysicsMode && <StatusFooter overridesCount={godModeState.overrides.length} complexity={godModeState.complexity} />}

      <OmniBar onCameraClick={() => setIsRealityLensOpen(true)} engine={engine} externalPrompt={omniPrompt} onPromptChange={setOmniPrompt} />

      <RealityDiff isOpen={!!diagnostics} hypothesis={diagnostics?.hypothesis || ''} outcome={diagnostics?.outcome || ''} sabotageReveal={diagnostics?.sabotageReveal} onReset={resetSimulation} />

      <AnimatePresence>
        {isRealityLensOpen && <RealityLens onTeleport={handleTeleport} onClose={() => setIsRealityLensOpen(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {isGardenOpen && <MindGarden nodes={gardenState.nodes} onClose={() => setIsGardenOpen(false)} />}
      </AnimatePresence>
    </main>
  );
}
