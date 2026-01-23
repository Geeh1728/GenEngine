'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TreePine, Radio, Loader2, Calculator } from 'lucide-react';
import { SimulationCard } from '@/components/simulation/SimulationCard';
import { GroundingAgent } from '@/components/dialogue/GroundingAgent';
import { RealWorldSync } from '@/components/verification/RealWorldSync';
import { MasteryChallenge } from '@/components/mastery/MasteryChallenge';
import { KnowledgeCrystal } from '@/components/mastery/KnowledgeCrystal';
import { BabelNode } from '@/components/simulation/BabelNode';
import AudioPlayer from '@/components/ui/AudioPlayer';
import { useGenesisEngine } from '@/hooks/useGenesisEngine';
import { WorldState } from '@/lib/simulation/schema';

interface DashboardViewProps {
    engine: ReturnType<typeof useGenesisEngine>;
    isListening: boolean;
    onToggleListening: () => void;
    handleStartPodcast: () => void;
    isGeneratingPodcast: boolean;
    podcastScript: any;
    handleRunVerification: () => void;
    isExecutingPython: boolean;
    pythonOutput: any;
    handleExport: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
    engine,
    isListening,
    onToggleListening,
    handleStartPodcast,
    isGeneratingPodcast,
    podcastScript,
    handleRunVerification,
    isExecutingPython,
    pythonOutput,
    handleExport
}) => {
    const {
        worldState,
        activeNode,
        sourceTitle,
        godModeState,
        worldRules,
        isObserved,
        setIsObserved,
        startMasteryChallenge,
        masteryState,
        setMasteryState,
        handleMasteryComplete,
        commentary,
        setWorldState
    } = engine;

    return (
        <motion.div
            key="dashboard-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 w-full h-full flex flex-col items-center gap-8 py-8 pointer-events-none"
        >
            <div className="text-center pointer-events-auto">
                <h2 className="text-4xl font-outfit font-bold mb-2 tracking-tight text-white">{activeNode?.label || sourceTitle}</h2>
                <p className="text-blue-400 text-[10px] uppercase tracking-[0.8em]">{activeNode?.engineMode || 'Laboratory'} Sandbox</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start w-full max-w-6xl px-12 pointer-events-auto">
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

                {/* Empty space for the Holodeck which is in the background */}
                <div className="min-h-[400px]" />
            </div>

            {/* Grounding Agent - Phase 4 */}
            <div className="w-full max-w-4xl mt-auto pointer-events-auto">
                {commentary && (
                    <GroundingAgent
                        complexity={godModeState.complexity}
                        isListening={isListening}
                        onToggleListening={onToggleListening}
                        spatialCommentary={commentary}
                    />
                )}
            </div>

            {/* Real-World Sync - Phase 4 */}
            <div className="pointer-events-auto">
                {commentary && (
                    <RealWorldSync
                        sourceTitle={sourceTitle}
                        youtubeId={commentary.suggestedYoutubeId}
                    />
                )}
            </div>

            {/* Mastery Challenge Modal - Phase 5 */}
            <div className="pointer-events-auto">
                {masteryState.isChallengeOpen && (
                    <MasteryChallenge
                        questions={masteryState.questions}
                        onComplete={handleMasteryComplete}
                        onClose={() => setMasteryState(prev => ({ ...prev, isChallengeOpen: false }))}
                    />
                )}
            </div>

            {/* Knowledge Crystal Export - Phase 5 */}
            <div className="pointer-events-auto">
                <KnowledgeCrystal
                    isUnlocked={masteryState.isCrystalUnlocked}
                    score={masteryState.score}
                    onExport={handleExport}
                />
            </div>

            {/* Babel Node - Phase 6 */}
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
        </motion.div>
    );
};
