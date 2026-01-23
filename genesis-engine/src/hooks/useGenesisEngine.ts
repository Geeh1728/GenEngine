import { useCallback, useEffect } from 'react';
import { useSimulationState } from './useSimulationState';
import { useGamification } from './useGamification';
import { useGenesisUI } from './useGenesisUI';
import { getEmbedding } from '@/lib/ai/embeddings';
import { storeKnowledge } from '@/lib/db/pglite';
import { WorldRuleSchema } from '@/lib/genkit/schemas';
import { z } from 'genkit';

type WorldRule = z.infer<typeof WorldRuleSchema>;
// Type Definitions
// (Kept for compatibility if exported, though now inferred from sub-hooks)

/**
 * useGenesisEngine: The central hook for managing the simulation lifecycle.
 * Refactored for TITAN PROTOCOL v4: Composition over Inheritance.
 * Now acts as a facade over atomic hooks.
 */
export function useGenesisEngine() {
    // 1. Core Physics & Logic
    const simulation = useSimulationState();
    const {
        gameState,
        worldState,
        selectedEntityId,
        dispatch,
        fetchWorldState,
        syncWorldState
    } = simulation;

    // 2. UI & Interaction State
    const ui = useGenesisUI();
    const {
        isIngested, setIsIngested,
        isProcessing, setIsProcessing,
        neuralEngineProgress, setNeuralEngineProgress,
        worldRules, setWorldRules,
        sourceTitle, setSourceTitle,
        error, setError,
        isObserved, setIsObserved,
        godModeState, setGodModeState,
        commentary,
        isPaused, setIsPaused,
        diagnostics, setDiagnostics,
        lastHypothesis, setLastHypothesis,
        isSabotaged, setIsSabotaged,
        omniPrompt, setOmniPrompt,
        activeChallenge, setActiveChallenge,
        updateCommentary,
        setComplexity
    } = ui;

    // 3. Gamification & Mastery
    const gamification = useGamification();
    const {
        skillTree,
        activeNode, setActiveNode,
        completedNodeIds, setCompletedNodeIds,
        activeQuest, setActiveQuest,
        isQuestVisible, setIsQuestVisible,
        masteryState, setMasteryState,
        gardenState, setGardenState,
        updateGardenHealth,
        generateSkillTree,
        trackFailure
    } = gamification;

    // --- AGGREGATED ACTIONS (GLUE LOGIC) ---

    // Ingestion touches UI, DB, and Simulation
    const handleIngest = useCallback(async (file: File) => {
        setIsProcessing(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/ingest', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Ingestion failed');

            const data = await response.json();

            if (data.chunks) {
                const vectors = await Promise.all(
                    data.chunks.map(async (chunk: string) => ({
                        text: chunk,
                        vector: await getEmbedding(chunk, setNeuralEngineProgress)
                    }))
                );
                await storeKnowledge(vectors);
            }

            const rulesWithIds: WorldRule[] = (data.rules || []).map((r: any, i: number) => ({
                id: r.id || `rule-${i}`,
                rule: r.rule || 'Unknown Rule',
                description: r.description || '',
                grounding_source: r.grounding_source || '',
                isActive: true
            }));

            setWorldRules(rulesWithIds);
            setSourceTitle(data.metadata?.title || 'Unknown Source');
            setIsIngested(true);

            // Trigger Simulation Update
            await fetchWorldState(rulesWithIds, godModeState.complexity);

            // Trigger Gamification Update
            await generateSkillTree(data.metadata?.title || 'Physics');

            setGardenState(prev => ({
                nodes: [
                    ...prev.nodes,
                    {
                        id: `garden-${Date.now()}`,
                        topic: data.metadata?.title || 'Physics',
                        lastReviewDate: Date.now(),
                        health: 1.0
                    }
                ]
            }));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ingestion failed');
        } finally {
            setIsProcessing(false);
        }
    }, [fetchWorldState, generateSkillTree, godModeState.complexity, setGardenState, setSourceTitle, setWorldRules, setIsIngested, setIsProcessing, setError, setNeuralEngineProgress]);

    // Mastery Challenge touches UI and Gamification
    const startMasteryChallenge = useCallback(async () => {
        setMasteryState(prev => ({ ...prev, isGenerating: true }));
        try {
            const response = await fetch('/api/mastery', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rules: worldRules,
                    complexity: godModeState.complexity
                }),
            });
            if (response.ok) {
                const data = await response.json();
                setMasteryState(prev => ({
                    ...prev,
                    questions: data.questions,
                    isChallengeOpen: true,
                    isGenerating: false
                }));
            }
        } catch (err) {
            console.error('Failed to start mastery challenge', err);
            setMasteryState(prev => ({ ...prev, isGenerating: false }));
        }
    }, [worldRules, godModeState.complexity, setMasteryState]);

    const handleMasteryComplete = useCallback((score: number) => {
        setMasteryState(prev => ({
            ...prev,
            score,
            isCrystalUnlocked: true
        }));
    }, [setMasteryState]);

    // Simulation Failure touches Simulation, UI, and Gamification
    const handleSimulationFailure = useCallback((outcome: string) => {
        if (!worldState) return;

        trackFailure(); // Updates failure count and toggles Quest visibility internally if needed

        setIsPaused(true);
        setDiagnostics({
            hypothesis: lastHypothesis,
            outcome,
            sabotageReveal: worldState.sabotage_reveal
        });
    }, [worldState, lastHypothesis, trackFailure, setIsPaused, setDiagnostics]);

    // Start Simulation from Skill Node
    const startSimulation = useCallback(async (node: typeof activeNode) => {
        if (!node) return;
        setActiveNode(node);
        setIsProcessing(true);
        try {
            await fetchWorldState(node.label, godModeState.complexity);
        } catch (err) {
            console.error('Failed to start simulation', err);
        } finally {
            setIsProcessing(false);
        }
    }, [godModeState.complexity, setActiveNode, setIsProcessing, fetchWorldState]);

    const resetSimulationAll = useCallback(() => {
        simulation.resetSimulation();
        setIsPaused(false);
        setDiagnostics(null);
        setIsQuestVisible(false);
    }, [simulation, setIsPaused, setDiagnostics, setIsQuestVisible]);

    // Garden Health Loop
    useEffect(() => {
        const interval = setInterval(updateGardenHealth, 1000 * 60 * 60);
        return () => clearInterval(interval);
    }, [updateGardenHealth]);

    return {
        // ...simulation
        worldState,
        selectedEntityId,
        dispatch,
        setWorldState: syncWorldState,

        // ...ui
        isIngested,
        isProcessing,
        worldRules,
        sourceTitle,
        error,
        isObserved,
        godModeState,
        commentary,
        isPaused,
        diagnostics,
        lastHypothesis,
        isSabotaged,
        omniPrompt,
        activeChallenge,
        neuralEngineProgress,

        // ...gamification
        skillTree,
        activeNode,
        completedNodeIds,
        activeQuest,
        isQuestVisible,
        masteryState,
        gardenState,

        // ...actions
        handleIngest,
        toggleRule: ui.toggleRule,
        handleConstantChange: ui.handleConstantChange,
        setComplexity,
        setIsObserved,
        startMasteryChallenge,
        setMasteryState,
        handleMasteryComplete,
        updateCommentary,
        setError,
        setIsSabotaged,
        handleSimulationFailure,
        resetSimulation: resetSimulationAll,
        setLastHypothesis,
        setGardenState,
        updateGardenHealth,
        setIsQuestVisible,
        setActiveQuest,
        generateSkillTree,
        startSimulation,
        setCompletedNodeIds,
        setActiveNode,
        setOmniPrompt,
        setActiveChallenge
    };
}