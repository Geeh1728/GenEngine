import { useCallback, useEffect, useState } from 'react';
import { useSimulationState } from './useSimulationState';
import { useGamification } from './useGamification';
import { useGenesisUI } from './useGenesisUI';
import { getEmbedding } from '@/lib/ai/embeddings';
import { processMultimodalIntent } from '@/app/actions';
import { storeKnowledge } from '@/lib/db/pglite';
import { WorldRuleSchema, SkillNodeSchema, ComplexityLevel, SkillTree } from '@/lib/genkit/schemas';
import { z } from 'genkit';
import { useGenesisStore } from '@/lib/store/GenesisContext';
import { blackboard } from '@/lib/genkit/context';
import { WorldState } from '@/lib/simulation/schema';
import { usePersistence } from './utils/usePersistence';
import { p2p } from '@/lib/multiplayer/P2PConnector';
import { sfx } from '@/lib/sound/SoundManager';

// (Kept for compatibility if exported, though now inferred from sub-hooks)
type WorldRule = z.infer<typeof WorldRuleSchema>;
type SkillNode = z.infer<typeof SkillNodeSchema>;

interface CommentaryState {
    text: string;
    citation: string;
    suggestedYoutubeId?: string;
}

interface DiagnosticsState {
    hypothesis: string;
    outcome: string;
    sabotageReveal?: string;
}

/**
 * useGenesisEngine: The central hook for managing the simulation lifecycle.
 * Refactored for performance, security, and cleanliness (Titan Protocol v3.5).
 * "Brain Transplant" v3: Now consumes the global Context Store.
 */
export function useGenesisEngine() {
    const { state, dispatch } = useGenesisStore();
    const {
        worldState,
        selectedEntityId,
        isProcessing,
        error,
        lastHypothesis,
        isSabotaged,
        fileUri,
        activeNode,
        activeChallenge,
        interactionState,
        mode
    } = state;

    // --- Ingestion & Local Logic ---
    const [isIngested, setIsIngested] = useState(false);
    const [neuralEngineProgress, setNeuralEngineProgress] = useState(0);
    const [worldRules, setWorldRules] = useState<WorldRule[]>([]);
    const [sourceTitle, setSourceTitle] = useState('');
    const [isObserved, setIsObserved] = useState(false);

    // --- Mastery OS / Skill Tree ---
    const [skillTree, setSkillTree] = useState<SkillTree | null>(null);
    const [completedNodeIds, setCompletedNodeIds] = useState<string[]>([]);

    // --- God Mode Configuration ---
    const [godModeState, setGodModeState] = useState({
        complexity: 'standard' as ComplexityLevel,
        constants: { gravity: 9.8, planck: 1, timeScale: 1 },
        overrides: [] as string[],
    });

    // --- Dialogue & Mastery Features ---
    const [commentary, setCommentary] = useState<CommentaryState | null>(null);
    const [masteryState, setMasteryState] = useState({
        questions: [],
        isChallengeOpen: false,
        isCrystalUnlocked: false,
        score: 0,
        isGenerating: false,
    });

    // --- Simulation Controls ---
    const [isPaused, setIsPaused] = useState(false);
    const [diagnostics, setDiagnostics] = useState<DiagnosticsState | null>(null);
    const [omniPrompt, setOmniPrompt] = useState('');

        const [ gardenState, setGardenState ] = useState({ nodes: [] });

        const [isVerifyingLogic, setIsVerifyingLogic] = useState(false);

    

        // --- Setters mapped to Dispatch ---
    const setIsProcessing = useCallback((val: boolean) => dispatch({ type: 'SET_PROCESSING', payload: val }), [dispatch]);
    const setError = useCallback((val: string | null) => dispatch({ type: 'SET_ERROR', payload: val }), [dispatch]);
    const setIsSabotaged = useCallback((val: boolean) => dispatch({ type: 'SET_SABOTAGED', payload: val }), [dispatch]);
    const setLastHypothesis = useCallback((val: string) => dispatch({ type: 'SET_HYPOTHESIS', payload: val }), [dispatch]);
    const setActiveNode = useCallback((val: SkillNode | null) => dispatch({ type: 'SET_ACTIVE_NODE', payload: val }), [dispatch]);
    const setInteractionId = useCallback((val: string | null) => dispatch({ type: 'SET_INTERACTION_ID', payload: val }), [dispatch]);
    const setActiveChallenge = useCallback((val: string | null) => {
        if (val) dispatch({ type: 'SET_CHALLENGE', payload: val });
        else dispatch({ type: 'CLEAR_CHALLENGE' });
    }, [dispatch]);

    // --- IMMERSION: PERSISTENCE LAYER ---
    usePersistence(worldState, (state) => {
        if (state) dispatch({ type: 'SYNC_WORLD', payload: state });
    }, state.lastInteractionId, setInteractionId);

    // --- Quantum Bridge Sync ---
    useEffect(() => {
        if (worldState && Object.keys(worldState).length > 0) {
            blackboard.updateFromWorldState(worldState);
        }
    }, [worldState]);

    // --- Ghost Mesh Connectivity ---
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const params = new URLSearchParams(window.location.search);
        const roomId = params.get('s');

        if (roomId) {
            p2p.connect(roomId);
        }
    }, []);

    const syncWorldState = useCallback((newState: WorldState | null) => {
        if (!newState) {
            dispatch({ type: 'RESET_SIMULATION' });
        } else {
            dispatch({ type: 'SYNC_WORLD', payload: newState });
        }
    }, [dispatch]);

    const fetchWorldState = useCallback(async (rules: WorldRule[]) => {
        try {
            const response = await fetch('/api/world-state', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic: sourceTitle || 'Quantum Physics',
                    rules,
                    complexity: godModeState.complexity,
                    fileUri: state.fileUri,
                    previousInteractionId: state.lastInteractionId
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
    }, [sourceTitle, godModeState.complexity, state.fileUri, state.lastInteractionId, dispatch]);

    const handleIngest = useCallback(async (file: File) => {
        setIsProcessing(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const response = await fetch('/api/ingest', { method: 'POST', body: formData });
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

            const rulesWithIds: WorldRule[] = (data.rules || []).map((r: WorldRule, i: number) => ({
                id: r.id || `rule-${i}`,
                rule: r.rule || 'Unknown Rule',
                description: r.description || '',
                grounding_source: r.grounding_source || '',
                isActive: true
            }));

            setWorldRules(rulesWithIds);
            setSourceTitle(data.metadata?.title || 'Unknown Source');
            setIsIngested(true);
            if (data.fileUri) {
                dispatch({ type: 'SET_FILE_URI', payload: data.fileUri });
            }

            await fetchWorldState(rulesWithIds);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ingestion failed');
        } finally {
            setIsProcessing(false);
        }
    }, [fetchWorldState, setError, setIsProcessing, dispatch]);

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
                    complexity: godModeState.complexity,
                    fileUri: state.fileUri,
                    previousInteractionId: state.lastInteractionId
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
    }, [godModeState.complexity, state.fileUri, state.lastInteractionId, dispatch, setActiveNode, setIsProcessing]);

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

    const handleSimulationFailure = useCallback((outcome: string) => {
        if (!worldState) return;
        setIsPaused(true);
        setDiagnostics({
            hypothesis: lastHypothesis,
            outcome,
            sabotageReveal: worldState.sabotage_reveal
        });
    }, [worldState, lastHypothesis]);

    const resetSimulation = useCallback(() => {
        setIsPaused(false);
        setDiagnostics(null);
        dispatch({ type: 'RESET_SIMULATION' });
    }, [dispatch]);

    const resolveChallenge = useCallback(async (userAnswer: string) => {
        setIsProcessing(true);
        setIsVerifyingLogic(true);
        setError(null);
        setActiveChallenge(null);

        try {
            const result = await processMultimodalIntent({
                text: userAnswer,
                isSaboteurReply: true,
                previousInteractionId: state.lastInteractionId || undefined
            });

            if (result.success) {
                sfx.playSuccess();
                dispatch({ 
                    type: 'SYNC_WORLD', 
                    payload: { 
                        ...result.worldState, 
                        interactionId: result.interactionId 
                    } 
                });
                dispatch({ type: 'SET_SABOTAGED', payload: !!result.worldState.sabotage_reveal });
                dispatch({ type: 'SET_HYPOTHESIS', payload: userAnswer });
                
                if (result.logs) {
                    result.logs.forEach((log: any) => dispatch({ type: 'ADD_MISSION_LOG', payload: log }));
                }
            } else {
                if (result.isBlocked) {
                    setActiveChallenge(result.message || result.nativeReply);
                } else {
                    throw new Error(result.error || 'Failed to verify logic');
                }
            }
        } catch (err) {
            console.error('[Engine] Resolve Challenge Error:', err);
            setError(err instanceof Error ? err.message : 'Connection failed during verification');
        } finally {
            setIsProcessing(false);
            setIsVerifyingLogic(false);
        }
    }, [state.lastInteractionId, dispatch, setError, setIsProcessing, setActiveChallenge]);

    const handleMasteryComplete = useCallback((score: number) => {
        setMasteryState(prev => ({ ...prev, score, isCrystalUnlocked: true }));
    }, []);

    const startMasteryChallenge = useCallback(async () => {
        if (!worldRules.length) return;
        
        setMasteryState(prev => ({ ...prev, isGenerating: true }));
        try {
            const response = await fetch('/api/mastery/challenge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rules: worldRules,
                    complexity: godModeState.complexity
                }),
            });
            
            if (response.ok) {
                const data = await response.json();
                setMasteryState({
                    questions: data.questions,
                    isChallengeOpen: true,
                    isCrystalUnlocked: false,
                    score: 0,
                    isGenerating: false,
                });
            }
        } catch (err) {
            console.error('Failed to start mastery challenge', err);
        } finally {
            setMasteryState(prev => ({ ...prev, isGenerating: false }));
        }
    }, [worldRules, godModeState.complexity]);

    return {
        isIngested,
        isProcessing,
        worldRules,
        sourceTitle,
        error,
        isObserved,
        godModeState,
        worldState,
        dispatch,
        commentary,
        masteryState,
        isPaused,
        diagnostics,
        isSabotaged,
        skillTree,
        activeNode,
        completedNodeIds,
        neuralEngineProgress,
        selectedEntityId,
        fileUri,
        interactionState,

        handleIngest,
        toggleRule,
        handleConstantChange,
        setComplexity,
        setIsObserved,
        setMasteryState,
        handleMasteryComplete,
        startMasteryChallenge,
        setWorldState: syncWorldState,
        setError,
        setIsSabotaged,
        handleSimulationFailure,
        resetSimulation,
        resolveChallenge,
        setLastHypothesis,
        gardenState,
        setGardenState,
        startSimulation,
        setCompletedNodeIds,
        setActiveNode,
        omniPrompt,
        setOmniPrompt,
        activeChallenge,
        setActiveChallenge,
        isVerifyingLogic,
        mode
    };
}
