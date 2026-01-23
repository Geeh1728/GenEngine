import { useState, useEffect, useCallback, useReducer } from 'react';
import { WorldRuleSchema, ComplexityLevelSchema, SkillTreeSchema, SkillNodeSchema } from '@/lib/genkit/schemas';
import { storeKnowledge } from '@/lib/db/pglite';
import { z } from 'genkit';
import { Question } from '@/components/mastery/MasteryChallenge';
import { Quest } from '@/lib/gamification/questEngine';
import { getEmbedding } from '@/lib/ai/embeddings';
import { blackboard } from '@/lib/genkit/context';
import { gameReducer, initialGameState } from '@/lib/multiplayer/GameState';
import { WorldState } from '@/lib/simulation/schema';
import { usePersistence } from './utils/usePersistence';

// Type Definitions
type WorldRule = z.infer<typeof WorldRuleSchema>;
type ComplexityLevel = z.infer<typeof ComplexityLevelSchema>;
type SkillTree = z.infer<typeof SkillTreeSchema>;
type SkillNode = z.infer<typeof SkillNodeSchema>;

interface CommentaryState {
    text: string;
    citation: string;
    suggestedYoutubeId?: string;
}

interface MasteryState {
    questions: Question[];
    isChallengeOpen: boolean;
    isCrystalUnlocked: boolean;
    score: number;
    isGenerating: boolean;
}

interface GodModeState {
    complexity: ComplexityLevel;
    constants: Record<string, number>;
    overrides: string[];
}

interface DiagnosticsState {
    hypothesis: string;
    outcome: string;
    sabotageReveal?: string;
}

interface GardenNode {
    id: string;
    topic: string;
    lastReviewDate: number;
    health: number;
}

interface GardenState {
    nodes: GardenNode[];
}

/**
 * useGenesisEngine: The central hook for managing the simulation lifecycle.
 * Refactored for performance, security, and cleanliness (Titan Protocol v3.5).
 * "Brain Transplant" v2: Now powered by a unified Reducer (GameState.ts).
 */
export function useGenesisEngine() {
    // --- KINETIC CORE: REDUCER STATE ---
    const [gameState, dispatch] = useReducer(gameReducer, initialGameState);
    const { worldState } = gameState;

    // --- IMMERSION: PERSISTENCE LAYER ---
    usePersistence(worldState, (state) => {
        if (state) dispatch({ type: 'SYNC_WORLD', payload: state });
    });

    // --- Ingestion & Global State ---
    const [isIngested, setIsIngested] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [neuralEngineProgress, setNeuralEngineProgress] = useState(0);
    const [worldRules, setWorldRules] = useState<WorldRule[]>([]);
    const [sourceTitle, setSourceTitle] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isObserved, setIsObserved] = useState(false);

    // --- Mastery OS / Skill Tree ---
    const [skillTree, setSkillTree] = useState<SkillTree | null>(null);
    const [activeNode, setActiveNode] = useState<SkillNode | null>(null);
    const [completedNodeIds, setCompletedNodeIds] = useState<string[]>([]);

    // --- Quest & Gamification ---
    const [activeQuest, setActiveQuest] = useState<Quest | null>(null);
    const [isQuestVisible, setIsQuestVisible] = useState(false);
    const [failureCount, setFailureCount] = useState(0);

    // --- God Mode Configuration ---
    const [godModeState, setGodModeState] = useState<GodModeState>({
        complexity: 'standard',
        constants: {
            gravity: 9.8,
            planck: 1,
            timeScale: 1,
        },
        overrides: [],
    });

    // --- Dialogue & Mastery Features ---
    const [commentary, setCommentary] = useState<CommentaryState | null>(null);
    const [masteryState, setMasteryState] = useState<MasteryState>({
        questions: [],
        isChallengeOpen: false,
        isCrystalUnlocked: false,
        score: 0,
        isGenerating: false,
    });

    // --- Simulation Controls ---
    const [isPaused, setIsPaused] = useState(false);
    const [diagnostics, setDiagnostics] = useState<DiagnosticsState | null>(null);
    const [lastHypothesis, setLastHypothesis] = useState('');
    const [isSabotaged, setIsSabotaged] = useState(false);
    const [omniPrompt, setOmniPrompt] = useState('');
    const [activeChallenge, setActiveChallenge] = useState<string | null>(null);

    // --- Mind Garden ---
    const [gardenState, setGardenState] = useState<GardenState>({
        nodes: []
    });

    // --- Quantum Bridge Sync ---
    useEffect(() => {
        if (worldState && Object.keys(worldState).length > 0) {
            blackboard.updateFromWorldState(worldState);
        }
    }, [worldState]);

    // --- ACTIONS ---

    // Direct Dispatch Bridge (Use carefully)
    const syncWorldState = useCallback((newState: WorldState | null) => {
        if (!newState) {
            dispatch({ type: 'RESET_SIMULATION' });
        } else {
            dispatch({ type: 'SYNC_WORLD', payload: newState });
        }
    }, []);

    // Also expose dispatch for advanced components (like OmniBar)
    const dispatchAction = useCallback((action: any) => {
        dispatch(action);
    }, []);

    const fetchWorldState = useCallback(async (rules: WorldRule[]) => {
        try {
            const response = await fetch('/api/world-state', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic: sourceTitle || 'Quantum Physics',
                    rules,
                    complexity: godModeState.complexity
                }),
            });
            if (response.ok) {
                const data = await response.json();
                dispatch({ type: 'SYNC_WORLD', payload: data });
                setGodModeState(prev => ({
                    ...prev,
                    constants: { ...data.constants, timeScale: 1 }
                }));
            }
        } catch (err) {
            console.error('Failed to fetch world state', err);
        }
    }, [sourceTitle, godModeState.complexity]);

    const generateSkillTree = useCallback(async (goal: string) => {
        setIsProcessing(true);
        try {
            const response = await fetch('/api/mastery/curriculum', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ goal }),
            });
            if (response.ok) {
                const data = await response.json();
                setSkillTree(data);
                
                // Persistence
                await storeKnowledge([{ 
                    text: `SKILL_TREE_${data.goal}`, 
                    vector: Array(384).fill(0),
                    metadata: { type: 'SKILL_TREE', data } 
                }]);
                localStorage.setItem('GENESIS_ACTIVE_GOAL', data.goal);
            }
        } catch (err) {
            console.error('Failed to generate skill tree', err);
        } finally {
            setIsProcessing(false);
        }
    }, []);

    const startSimulation = useCallback(async (node: SkillNode) => {
        setActiveNode(node);
        setIsProcessing(true);
        try {
            const response = await fetch('/api/world-state', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic: node.label,
                    context: node.description,
                    complexity: godModeState.complexity
                }),
            });
            if (response.ok) {
                const data = await response.json();
                dispatch({ type: 'SYNC_WORLD', payload: data });
            }
        } catch (err) {
            console.error('Failed to start simulation', err);
        } finally {
            setIsProcessing(false);
        }
    }, [godModeState.complexity]);

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

            await fetchWorldState(rulesWithIds);
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
    }, [fetchWorldState, generateSkillTree]);

    const updateCommentary = useCallback(async (intent?: string) => {
        try {
            const response = await fetch('/api/commentary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    complexity: godModeState.complexity,
                    activeRules: worldRules.filter(r => r.isActive),
                    overriddenRules: godModeState.overrides,
                    constants: godModeState.constants,
                    userIntent: intent
                }),
            });
            if (response.ok) {
                const data = await response.json();
                setCommentary(data);
            }
        } catch (err) {
            console.error('Failed to update commentary', err);
        }
    }, [godModeState, worldRules]);

    const updateGardenHealth = useCallback(() => {
        setGardenState(prev => ({
            nodes: prev.nodes.map(node => {
                const daysSinceReview = (Date.now() - node.lastReviewDate) / (1000 * 60 * 60 * 24);
                const health = Math.max(0, 1.0 - (daysSinceReview * 0.1));
                return { ...node, health };
            })
        }));
    }, []);

    useEffect(() => {
        const interval = setInterval(updateGardenHealth, 1000 * 60 * 60);
        return () => clearInterval(interval);
    }, [updateGardenHealth]);

    const toggleRule = useCallback((id: string) => {
        setWorldRules(prev => prev.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
        setGodModeState(prev => {
            const isOverridden = prev.overrides.includes(id);
            return {
                ...prev,
                overrides: isOverridden
                    ? prev.overrides.filter(o => o !== id)
                    : [...prev.overrides, id]
            };
        });
    }, []);

    const handleConstantChange = useCallback((name: string, value: number) => {
        setGodModeState(prev => ({
            ...prev,
            constants: { ...prev.constants, [name]: value }
        }));
    }, []);

    const setComplexity = useCallback((complexity: ComplexityLevel) => {
        setGodModeState(prev => ({ ...prev, complexity }));
    }, []);

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
    }, [worldRules, godModeState.complexity]);

    const handleMasteryComplete = useCallback((score: number) => {
        setMasteryState(prev => ({
            ...prev,
            score,
            isCrystalUnlocked: true
        }));
    }, []);

    const handleSimulationFailure = useCallback((outcome: string) => {
        if (!worldState) return;
        
        const newFailureCount = failureCount + 1;
        setFailureCount(newFailureCount);
        
        setIsPaused(true);
        setDiagnostics({
            hypothesis: lastHypothesis,
            outcome,
            sabotageReveal: worldState.sabotage_reveal
        });

        if (newFailureCount >= 3) {
            setIsQuestVisible(true);
            setFailureCount(0);
        }
    }, [worldState, lastHypothesis, failureCount]);

    const resetSimulation = useCallback(() => {
        setIsPaused(false);
        setDiagnostics(null);
        setIsQuestVisible(false);
        dispatch({ type: 'RESET_SIMULATION' });
    }, []);

    useEffect(() => {
        if (isIngested) {
            updateCommentary();
        }
    }, [isIngested, isObserved, godModeState.complexity, godModeState.overrides, updateCommentary]);

    return {
        isIngested,
        isProcessing,
        worldRules,
        sourceTitle,
        error,
        isObserved,
        godModeState,
        worldState, // Now comes from Reducer
        dispatch,   // Expose dispatch for cleaner updates
        commentary,
        masteryState,
        isPaused,
        diagnostics,
        isSabotaged,
        activeQuest,
        isQuestVisible,
        skillTree,
        activeNode,
        completedNodeIds,
        neuralEngineProgress,

        handleIngest,
        toggleRule,
        handleConstantChange,
        setComplexity,
        setIsObserved,
        startMasteryChallenge,
        setMasteryState,
        handleMasteryComplete,
        updateCommentary,
        setWorldState: syncWorldState, // Bridge for backward compat
        setError,
        setIsSabotaged,
        handleSimulationFailure,
        resetSimulation,
        setLastHypothesis,
        gardenState,
        setGardenState,
        updateGardenHealth,
        setIsQuestVisible,
        setActiveQuest,
        generateSkillTree,
        startSimulation,
        setCompletedNodeIds,
        setActiveNode,
        omniPrompt,
        setOmniPrompt,
        activeChallenge,
        setActiveChallenge
    };
}