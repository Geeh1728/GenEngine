'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { WorldRulesList } from '@/components/ingestion/WorldRulesList';
import { SimulationCard } from '@/components/simulation/SimulationCard';
import { GodModePanel } from '@/components/intervention/GodModePanel';
import { GroundingAgent } from '@/components/dialogue/GroundingAgent';
import { RealWorldSync } from '@/components/verification/RealWorldSync';
import { MasteryChallenge } from '@/components/mastery/MasteryChallenge';
import { KnowledgeCrystal } from '@/components/mastery/KnowledgeCrystal';
import { RealityDiff } from '@/components/simulation/RealityDiff';
import RealityLens from '@/components/simulation/RealityLens';
import { BabelNode } from '@/components/simulation/BabelNode';
import { MindGarden } from '@/components/simulation/MindGarden';
import AudioPlayer from '@/components/ui/AudioPlayer';
import SkillTree from '@/components/ui/SkillTree';
import { OmniBar } from '@/components/ui/OmniBar';
import { generatePodcastScript } from '@/app/actions/podcast';
import { runPython } from '@/lib/python/pyodide';
import { useGenesisEngine } from '@/hooks/useGenesisEngine';
import { TreePine, Radio, Calculator, Loader2, X } from 'lucide-react';
import { Entity } from '@/lib/simulation/schema';

// Dynamic imports for browser-only components
const Holodeck = dynamic(() => import('@/components/simulation/Holodeck').then(mod => mod.Holodeck), { ssr: false });
const NeuralBackground = dynamic(() => import('@/components/ui/NeuralBackground').then(mod => mod.NeuralBackground), { ssr: false });

/**
 * HOME: The primary viewport for the Genesis Engine.
 * Refactored for clean architecture, unified input (Omni-Bar), and Titan v3.5 features.
 */
export default function Home() {
  const engine = useGenesisEngine();
  
  // Destructure for local cleaner usage in the JSX, 
  // but keep 'engine' intact for passing to children.
  const {
    isIngested,
    isProcessing,
    worldRules,
    sourceTitle,
    error,
    isObserved,
    godModeState,
    worldState,
    commentary,
    masteryState, 
    handleIngest,
    toggleRule,
    handleConstantChange,
    setComplexity,
    setIsObserved,
    startMasteryChallenge,
    setMasteryState,
    handleMasteryComplete,
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
    neuralEngineProgress
  } = engine;

  const [isListening, setIsListening] = useState(false);
  const [isRealityLensOpen, setIsRealityLensOpen] = useState(false);
  const [isGardenOpen, setIsGardenOpen] = useState(false);
  const [omniPrompt, setOmniPrompt] = useState(''); // Lifted state for OmniBar
  
  // Module A-2: Genesis Radio
  const [podcastScript, setPodcastScript] = useState<{host: 'A' | 'B', text: string}[] | null>(null);
  const [isGeneratingPodcast, setIsGeneratingPodcast] = useState(false);

  // Module P-2: Python Engine
  const [pythonOutput, setPythonOutput] = useState<{ stdout: string | null; result: any; error: string | null } | null>(null);
  const [isExecutingPython, setIsExecutingPython] = useState(false);

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
    setWorldState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        entities: [...(prev.entities || []), ...newEntities]
      };
    });
  };

  const handleExport = () => {
    alert("Knowledge Crystal Manifested! Study bundle exported to your workspace.");
  };

  // View Logic: "Nuclear Option" - If Physics Mode is active, hide EVERYTHING else.
  const isPhysicsMode = worldState?.mode === 'PHYSICS';

  return (
    <main className="min-h-screen relative overflow-hidden font-inter text-foreground bg-[#020205]">
      <NeuralBackground />

      {/* Module A: Neural Engine Progress */}
      <AnimatePresence>
        {neuralEngineProgress > 0 && neuralEngineProgress < 100 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] w-64 bg-black/80 backdrop-blur-xl border border-blue-500/30 p-4 rounded-2xl shadow-[0_0_30px_rgba(59,130,246,0.2)]"
          >
            <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-blue-400 mb-2">
              <span>Downloading Neural Engine</span>
              <span>{Math.round(neuralEngineProgress)}%</span>
            </div>
            <div className="h-1 bg-blue-950 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-blue-500"
                initial={{ width: 0 }}
                animate={{ width: `${neuralEngineProgress}%` }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Module D: The Glitch (Saboteur Visual) */}
      <AnimatePresence>
        {isSabotaged && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0.3, 0.1, 0.4, 0.2],
              x: [0, -10, 10, -5, 5, 0],
              y: [0, 2, -2, 1, -1, 0],
              filter: [
                "contrast(1.2) brightness(1.2) hue-rotate(0deg)",
                "contrast(2) brightness(1.5) hue-rotate(180deg)",
                "contrast(1.2) brightness(1.2) hue-rotate(0deg)"
              ]
            }}
            exit={{ opacity: 0 }}
            transition={{ repeat: Infinity, duration: 0.15, ease: "linear" }}
            className="fixed inset-0 z-[9999] pointer-events-none bg-red-900/10 mix-blend-difference shadow-[inset_0_0_100px_rgba(255,0,0,0.2)]"
          />
        )}
      </AnimatePresence>

      {/* Navigation / Header - Hide in Physics Mode */}
      {!isPhysicsMode && (
      <nav className="relative z-50 flex justify-between items-center px-12 py-6 border-b border-white/5 backdrop-blur-md bg-black/20">
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.5)]"
          >
            <span className="font-outfit font-black text-xs text-white">GE</span>
          </motion.div>
          <span className="text-sm font-outfit font-bold uppercase tracking-[0.4em] text-gray-400">Genesis Engine</span>
        </div>
        <div className="flex items-center gap-8">
          <button
            onClick={() => setIsGardenOpen(true)}
            className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-emerald-500/20 transition-all flex items-center gap-2 pointer-events-auto shadow-[0_0_15px_rgba(16,185,129,0.1)]"
          >
            <TreePine className="w-3 h-3" />
            Mind Garden
          </button>
          <span className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">Node: Alpha-7</span>
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
        </div>
      </nav>
      )}

      <div className="relative z-10 flex h-[calc(100vh-100px)]">
        {/* God Mode Panel */}
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

        {/* Main Interaction Area */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          {/* Always render the Holodeck in the background or main view */}
          <motion.div 
            animate={{ 
                filter: (!skillTree && !isIngested) || isProcessing ? 'blur(8px)' : 'blur(0px)',
                opacity: (!skillTree && !isIngested) ? 0.4 : 1,
                scale: isProcessing ? 1.05 : 1
            }}
            transition={{ duration: 1, ease: "easeInOut" }}
            className="absolute inset-0 z-0"
          >
            <Holodeck
              worldState={worldState}
              activeNode={activeNode}
              debug={true}
              isPaused={isPaused}
              onCollision={(mag) => handleSimulationFailure(`High-impact collision detected (Magnitude: ${mag.toFixed(1)})`)}
              backgroundMode={(!skillTree && !isIngested) || isProcessing}
              gardenNodes={gardenState.nodes}
            />
          </motion.div>

          <AnimatePresence mode="wait">
            {/* VIEW CONTROLLER: Determines which "Screen" to show based on state */}
            
            {/* 1. EMPTY STATE: No content, no active physics mode */}
            {!skillTree && !isIngested && !isPhysicsMode ? (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none"
              >
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-center"
                >
                  <h1 className="text-6xl font-outfit font-black mb-4 tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
                    Genesis
                  </h1>
                  <p className="text-gray-500 text-sm uppercase tracking-[0.5em]">The Ultimate Aggregator</p>
                  
                  {/* Starter Chips */}
                  <div className="mt-8 flex gap-3 flex-wrap justify-center pointer-events-auto">
                    {[
                      "Show me Gravity",
                      "Scan Homework", 
                      "Simulate Inflation"
                    ].map((chip) => (
                      <button
                        key={chip}
                        onClick={() => setOmniPrompt(chip)}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-mono border border-white/10 hover:border-blue-500/50 rounded-full transition-all backdrop-blur-sm"
                      >
                        [{chip}]
                      </button>
                    ))}
                  </div>

                  {error && (
                    <p className="mt-8 text-red-400 text-xs font-medium uppercase tracking-widest bg-red-400/5 px-4 py-2 rounded-full border border-red-400/10 pointer-events-auto">
                      Error: {error}
                    </p>
                  )}
                </motion.div>
              </motion.div>
            ) : isProcessing && !activeNode ? (
              <motion.div
                key="architecting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black backdrop-blur-3xl"
              >
                <div className="relative">
                  <div className="w-32 h-32 border-4 border-blue-500/20 rounded-full animate-pulse" />
                  <div className="absolute inset-0 w-32 h-32 border-t-4 border-blue-500 rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 bg-white rounded-full animate-ping" />
                  </div>
                </div>
                <h2 className="mt-12 text-sm font-black uppercase tracking-[0.5em] text-blue-400 animate-pulse">Architecting Curriculum...</h2>
                <p className="mt-4 text-[10px] text-gray-500 uppercase tracking-widest">Compiling Skill Tree // Node: Alpha-7</p>
              </motion.div>
            ) : skillTree && !activeNode ? (
               <motion.div
                 key="skill-tree-view"
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="absolute inset-0 z-40 overflow-y-auto bg-[#020205] p-12 custom-scrollbar"
               >
                 <div className="max-w-4xl mx-auto">
                   <div className="text-center mb-16">
                     <h2 className="text-4xl font-black tracking-tighter mb-2 text-white">{skillTree.goal}</h2>
                     <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.4em]">Mastery Path Generated</p>
                   </div>
                   <SkillTree 
                     nodes={skillTree.nodes}
                     recommendedPath={skillTree.recommendedPath}
                     completedNodeIds={completedNodeIds}
                     onNodeClick={startSimulation}
                   />
                 </div>
               </motion.div>
            ) : (
              <motion.div
                key="simulation-stage"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 w-full h-full flex flex-col items-center gap-8 py-8 pointer-events-none"
              >
                <div className="text-center pointer-events-auto">
                  {/* Clean UI: Hide Title in Physics Mode */}
                  {!isPhysicsMode && (
                  <>
                  <h2 className="text-4xl font-outfit font-bold mb-2 tracking-tight text-white">{activeNode?.label || sourceTitle}</h2>
                  <p className="text-blue-400 text-[10px] uppercase tracking-[0.8em]">{activeNode?.engineMode || 'Laboratory'} Sandbox</p>
                  </>
                  )}
                  
                  {(activeNode || isPhysicsMode) && (
                    <button 
                      onClick={() => {
                        setActiveNode(null);
                        setWorldState(null); // Reset Physics
                      }}
                      className="mt-4 text-[8px] uppercase font-bold tracking-widest text-gray-500 hover:text-white transition-all flex items-center gap-2 mx-auto"
                    >
                      <X className="w-3 h-3" /> Exit Simulation
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start w-full max-w-6xl px-12 pointer-events-auto">
                  {/* HIDE ALL CARDS IN PHYSICS MODE */}
                  {!isPhysicsMode && (
                  <div className="flex flex-col gap-6">
                    <SimulationCard
                      title={worldState?.scenario || activeNode?.label || "Simulation"}
                      description={worldState?.explanation || activeNode?.description || `[ELIx: ${godModeState.complexity.toUpperCase()}] Observation collapses the quantum state logic.`}
                      societalImpact={worldState?.societalImpact}
                      rules={worldRules.slice(0, 2).map(r => ({
                        name: r.rule,
                        effect: r.description,
                        verified: true,
                        source_citation: r.grounding_source
                      }))}
                      actions={["Inject Photon", isObserved ? "Remove Detector" : "Activate Detector", masteryState.isGenerating ? "Synthesizing..." : "Start Mastery Challenge"]}
                      onAction={(a) => {
                        if (a === "Activate Detector") setIsObserved(true);
                        if (a === "Remove Detector") setIsObserved(false);
                        if (a === "Start Mastery Challenge") startMasteryChallenge();
                      }}
                    />

                    {/* Module A-2: Genesis Radio */}
                    <div className="flex flex-col gap-4">
                      {!podcastScript ? (
                        <button
                          onClick={handleStartPodcast}
                          disabled={isGeneratingPodcast}
                          className="w-full py-4 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-2xl border border-blue-500/30 flex items-center justify-center gap-3 font-bold transition-all disabled:opacity-50"
                        >
                          {isGeneratingPodcast ? <Loader2 className="animate-spin" /> : <Radio className="w-5 h-5" />}
                          {isGeneratingPodcast ? "Generating Podcast..." : "Listen to Genesis Radio (Podcast)"}
                        </button>
                      ) : (
                        <AudioPlayer script={podcastScript} />
                      )}
                    </div>

                    {/* Module P-2: Python Engine */}
                    {worldState?.python_code && (
                      <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 p-6 rounded-2xl">
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center gap-2">
                            <Calculator className="w-4 h-4 text-purple-400" />
                            <h3 className="text-xs font-bold uppercase tracking-widest text-purple-400">Mathematical Verification</h3>
                          </div>
                          <button
                            onClick={handleRunVerification}
                            disabled={isExecutingPython}
                            className="text-[10px] bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 px-3 py-1 rounded-full border border-purple-500/20 transition disabled:opacity-50"
                          >
                            {isExecutingPython ? "Executing..." : "Run Python Proof"}
                          </button>
                        </div>
                        <pre className="text-[10px] font-mono text-slate-400 bg-black/40 p-3 rounded-lg overflow-x-auto mb-4 border border-white/5">
                          {worldState.python_code}
                        </pre>
                        {pythonOutput && (
                          <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                            <p className="text-[10px] text-emerald-400 font-bold mb-1 uppercase">Output:</p>
                            <p className="text-sm font-mono text-emerald-100">{pythonOutput.stdout || pythonOutput.result}</p>
                            {pythonOutput.error && <p className="text-red-400 text-[10px] mt-2">{pythonOutput.error}</p>}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  )}

                  {/* Empty space for the Holodeck which is in the background */}
                  <div className="min-h-[400px]" />
                </div>

                {/* Grounding Agent - Phase 4 */}
                <div className="w-full max-w-4xl mt-auto pointer-events-auto">
                  {!isPhysicsMode && commentary && (
                    <GroundingAgent
                      complexity={godModeState.complexity}
                      isListening={isListening}
                      onToggleListening={() => setIsListening(!isListening)}
                      spatialCommentary={commentary}
                    />
                  )}
                </div>

                {/* Real-World Sync - Phase 4 */}
                <div className="pointer-events-auto">
                  {!isPhysicsMode && commentary && (
                    <RealWorldSync
                      sourceTitle={sourceTitle}
                      youtubeId={commentary.suggestedYoutubeId}
                    />
                  )}
                </div>

                {/* Mastery Challenge Modal - Phase 5 */}
                <div className="pointer-events-auto">
                  {!isPhysicsMode && masteryState.isChallengeOpen && (
                    <MasteryChallenge
                      questions={masteryState.questions}
                      onComplete={handleMasteryComplete}
                      onClose={() => setMasteryState(prev => ({ ...prev, isChallengeOpen: false }))}
                    />
                  )}
                </div>

                {/* Knowledge Crystal Export - Phase 5 */}
                <div className="pointer-events-auto">
                  {!isPhysicsMode && (
                  <KnowledgeCrystal
                    isUnlocked={masteryState.isCrystalUnlocked}
                    score={masteryState.score}
                    onExport={handleExport}
                  />
                  )}
                </div>

                {/* Babel Node - Phase 6 - INVISIBLE IN PHYSICS MODE */}
                {!isPhysicsMode && (
                <div className="absolute bottom-10 left-10 z-[60] pointer-events-auto">
                  {worldState && (
                    <BabelNode
                      worldState={worldState}
                      onPhysicsUpdate={(delta) => {
                        setWorldState(prev => prev ? ({ ...prev, ...delta }) : null);
                      }}
                    />
                  )}
                </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Global Constraints / Rules Sidebar */}
        <AnimatePresence>
          {isIngested && !isPhysicsMode && (
            <WorldRulesList rules={worldRules} />
          )}
        </AnimatePresence>
      </div>

      {/* Footer Status */}
      {!isPhysicsMode && (
      <footer className="fixed bottom-0 left-0 right-0 px-12 py-4 flex justify-between items-center text-[8px] uppercase tracking-[0.5em] text-gray-700 font-bold border-t border-white/5 bg-[#020205]/95 backdrop-blur-xl z-[100]">
        <span>Genesis Engine // INTERVENTION MODE</span>
        <div className="flex gap-12">
          <span className={godModeState.overrides.length > 0 ? "text-red-500 animate-pulse" : ""}>
            Rules Overridden: {godModeState.overrides.length}
          </span>
          <span>Holographic Feed: {godModeState.complexity.toUpperCase()}</span>
          <span className="text-blue-900">Quantum Link: Stable</span>
        </div>
      </footer>
      )}

      {/* The Universal Interface */}
      <OmniBar 
        onCameraClick={() => setIsRealityLensOpen(true)}
        engine={engine}
        externalPrompt={omniPrompt}
        onPromptChange={setOmniPrompt}
      />

      {/* Reality Diff / Diagnostics Panel */}
      <RealityDiff
        isOpen={!!diagnostics}
        hypothesis={diagnostics?.hypothesis || ''}
        outcome={diagnostics?.outcome || ''}
        sabotageReveal={diagnostics?.sabotageReveal}
        onReset={resetSimulation}
      />

      <AnimatePresence>
        {isRealityLensOpen && (
          <RealityLens
            onTeleport={handleTeleport}
            onClose={() => setIsRealityLensOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isGardenOpen && (
          <MindGarden
            nodes={gardenState.nodes}
            onClose={() => setIsGardenOpen(false)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}