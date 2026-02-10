import { useCallback, useEffect, useState } from 'react';
import { useSimulationState } from './useSimulationState';
import { useGamification } from './useGamification';
import { useGenesisUI } from './useGenesisUI';
import { getEmbedding } from '@/lib/ai/embeddings';
import { processMultimodalIntent } from '@/app/actions';
import { storeKnowledge } from '@/lib/db/pglite';
import { WorldRuleSchema, SkillNodeSchema, ComplexityLevel, SkillTree, WorldStateSchema as ValidationSchema } from '@/lib/genkit/schemas';
import { z } from 'genkit';
import { useGenesisStore } from '@/lib/store/GenesisContext';
import { blackboard } from '@/lib/genkit/context';
import { WorldState, WorldStateSchema } from '@/lib/simulation/schema';
import { usePersistence } from './utils/usePersistence';
import { p2p } from '@/lib/multiplayer/P2PConnector';
import { sfx } from '@/lib/sound/SoundManager';
import { applyMathOverride } from '@/lib/python/mathOverride';
import { mintMasteryTrophy } from '@/app/actions/mastery';
import { decodeWorld } from '@/lib/utils/wormhole';
import { normalizeEntities } from '@/lib/simulation/normalizer';
import { reflexPredictor } from '@/lib/simulation/reflex-predictor';
import { visualEcho } from '@/lib/vision/echo-buffer';
import { exobrain } from '@/lib/storage/exobrain';
import { MasteryLogic } from '@/lib/gamification/mastery-logic';


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

interface GhostBuffer {
    predictedPos: Record<string, { x: number, y: number, z: number }>;
}

/**
 * useGenesisEngine - The central orchestration hook for Genesis Engine.
 * 
 * @description Combines simulation state, gamification, and UI state into a unified
 * interface for the Genesis reality compiler. This is the "God Hook" that coordinates
 * all simulation lifecycle events, P2P synchronization, and mastery tracking.
 * 
 * @returns The complete API for controlling the Genesis Engine:
 * - `worldState` - Current physics simulation state
 * - `dispatch` - Redux-like action dispatcher for state updates
 * - `isProcessing` - Loading state for async operations
 * - `setWorldState` - Update the world (alias for syncWorldState)
 * - `resolveChallenge` - Process Saboteur challenge responses
 * - `handleIngest` - Ingest files for knowledge embedding
 * - `startSimulation` - Begin a simulation from a skill node
 * 
 * @example
 * ```tsx
 * const {
 *   worldState,
 *   setWorldState,
 *   dispatch,
 *   isProcessing,
 * } = useGenesisEngine();
 * 
 * // Dispatch an action
 * dispatch({ type: 'SET_PROCESSING', payload: true });
 * ```
 */
export function useGenesisEngine() {
    const { state, dispatch } = useGenesisStore();
    const [ghostBuffer] = useState<GhostBuffer>({ predictedPos: {} });
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

    const [gardenState, setGardenState] = useState({ nodes: [] });

    const [isVerifyingLogic, setIsVerifyingLogic] = useState(false);

    // --- MODULE T: TEMPORAL HISTORY ---
    const [history, setHistory] = useState<WorldState[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // --- MODULE E: EXOBRAIN ---
    useEffect(() => {
        exobrain.load().then(profile => {
            console.log(`[Exobrain] Profile loaded. Mastery: ${profile.masteryScore}`);
            dispatch({
                type: 'ADD_MISSION_LOG',
                payload: {
                    agent: 'Astra',
                    message: `Welcome back, Architect. Your mastery level is ${profile.masteryScore}. Ready to manifest?`,
                    type: 'SUCCESS'
                }
            });
        });
    }, [dispatch]);

    // --- MODULE V: VISUAL ECHO ---
    useEffect(() => {
        if (isProcessing || isObserved) {
            visualEcho.start();
        } else {
            visualEcho.stop();
        }
        return () => visualEcho.stop();
    }, [isProcessing, isObserved]);

    // --- PROACTIVE AGENT INTERVENTION (The "Living Lab") ---
    useEffect(() => {
        if (!worldState || isPaused || isProcessing) return;

        const interval = setInterval(async () => {
            console.log("[LivingLab] Background Observer analyzing structural stability...");
            try {
                const response = await fetch('/api/simulation/proactive-check', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        worldState,
                        blackboardContext: blackboard.getContext()
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.intervention) {
                        dispatch({
                            type: 'ADD_MISSION_LOG',
                            payload: {
                                agent: 'Saboteur',
                                message: data.intervention,
                                type: 'RESEARCH'
                            }
                        });

                        // If it's a critical structural warning, trigger visual pulse
                        if (data.isCritical) {
                            sfx.playWarning();
                        }
                    }
                }
            } catch (e) {
                console.warn("[LivingLab] Background analysis skipped.");
            }
        }, 30000); // 30s frequency

        return () => clearInterval(interval);
    }, [worldState, isPaused, isProcessing, dispatch]);


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

            // Record History
            setHistory(prev => {
                const next = [...prev, JSON.parse(JSON.stringify(worldState))];
                if (next.length > 50) next.shift(); // Limit buffer
                return next;
            });
            setHistoryIndex(prev => Math.min(prev + 1, 49));
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

        // Inbound Sync: Listen for remote changes on the Blackboard
        const unsubscribe = blackboard.subscribe((ctx) => {
            if (ctx.currentWorldState) {
                // GHOST MESH INTERPOLATION (Module V)
                const hasRemote = ctx.currentWorldState.entities?.some((e: any) => e.isRemote);

                if (hasRemote) {
                    const nextEntities = ctx.currentWorldState.entities?.map((e: any) => {
                        if (!e.isRemote) return e;

                        const predicted = ghostBuffer.predictedPos[e.id];
                        if (predicted) {
                            const dx = Math.abs(e.position.x - predicted.x);
                            const dy = Math.abs(e.position.y - predicted.y);

                            // IF divergence is small (<5%), keep predicted for smoothness
                            if (dx < 0.05 && dy < 0.05) {
                                return { ...e, position: predicted };
                            }

                            // IF divergence is large, smoothly LERP to real data
                            return {
                                ...e,
                                position: {
                                    x: predicted.x * 0.5 + e.position.x * 0.5,
                                    y: predicted.y * 0.5 + e.position.y * 0.5,
                                    z: predicted.z * 0.5 + e.position.z * 0.5
                                }
                            };
                        }
                        return e;
                    });

                    // Trigger prediction for next frame
                    ctx.currentWorldState.entities?.forEach(async (e: any) => {
                        if (e.isRemote) {
                            const prediction = await reflexPredictor.predictTrajectory(e);
                            ghostBuffer.predictedPos[e.id] = prediction.points[0];
                        }
                    });

                    dispatch({ type: 'SYNC_WORLD', payload: { ...ctx.currentWorldState, entities: nextEntities } });
                }
            }
        });

        return () => {
            unsubscribe();
            p2p.disconnect();
        };
    }, [dispatch]);

    // --- MODULE Q: WORMHOLE HYDRATION ---
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const params = new URLSearchParams(window.location.search);
        const wormholeData = params.get('w');

        if (wormholeData) {
            console.log("[Wormhole] Intercepting boot sequence. Reconstituting reality...");
            const decodedState = decodeWorld(wormholeData);

            if (decodedState) {
                // SECURITY: Validate hydrated state against schema
                const validation = WorldStateSchema.safeParse(decodedState);
                if (!validation.success) {
                    console.error("[Wormhole] Invalid state detected. Hydration aborted.");
                    dispatch({
                        type: 'ADD_MISSION_LOG',
                        payload: {
                            agent: 'Astra',
                            message: "Wormhole stabilized but data was corrupted or unsafe.",
                            type: 'ERROR'
                        }
                    });
                    return;
                }

                const validState = validation.data as WorldState;

                // Ensure entities are normalized (The Rosetta Protocol)
                if (validState.entities) {
                    validState.entities = normalizeEntities(validState.entities);
                }

                // Hydrate the ECS world
                dispatch({ type: 'SYNC_WORLD', payload: validState });

                // Astra Event
                dispatch({
                    type: 'ADD_MISSION_LOG',
                    payload: {
                        agent: 'Astra',
                        message: "Reality transmission received. Reconstituting the digital twin now.",
                        type: 'SUCCESS'
                    }
                });

                sfx.playSuccess();

                // Clean up URL to avoid re-hydration on refresh if desired, 
                // but usually we keep it for bookmarking. 
                // The prompt says "Astra Event: Trigger a voice response"
            } else {
                dispatch({
                    type: 'ADD_MISSION_LOG',
                    payload: {
                        agent: 'Astra',
                        message: "Wormhole collapse detected. Transmission corrupted.",
                        type: 'ERROR'
                    }
                });
            }
        }
    }, [dispatch]);

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
                dispatch({ type: 'ADD_MISSION_LOG', payload: { agent: 'Librarian', message: 'Summarizing curriculum for high-fidelity indexing...', type: 'THINKING' } });
                const sumResponse = await fetch('/api/ingest/summarize', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chunks: data.chunks }),
                });
                const sumData = await sumResponse.json();
                const processedChunks = sumData.success ? sumData.summaries : data.chunks;

                const vectors = await Promise.all(
                    processedChunks.map(async (text: string, i: number) => ({
                        text: data.chunks[i],
                        vector: await getEmbedding(text, setNeuralEngineProgress),
                        metadata: { summary: text !== data.chunks[i] ? text : undefined }
                    }))
                );
                await storeKnowledge(vectors);
                dispatch({ type: 'ADD_MISSION_LOG', payload: { agent: 'Librarian', message: 'Neural Library updated with scientific summaries.', type: 'SUCCESS' } });
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

                if ('worldState' in result && result.worldState) {
                    let finalWorldState = result.worldState;
                    if (result.worldState.python_code) {
                        dispatch({ type: 'ADD_MISSION_LOG', payload: { agent: 'Pyodide', message: 'Executing Python verification...', type: 'THINKING' } });
                        try {
                            finalWorldState = await applyMathOverride(result.worldState, result.worldState.python_code);
                            dispatch({ type: 'ADD_MISSION_LOG', payload: { agent: 'Pyodide', message: 'Math verification applied. Computed values are now the Source of Truth.', type: 'SUCCESS' } });
                        } catch (mathErr) {
                            console.warn('[Engine] Math Override failed, using AI values:', mathErr);
                            dispatch({ type: 'ADD_MISSION_LOG', payload: { agent: 'Pyodide', message: 'Math verification failed. Using AI-generated values.', type: 'ERROR' } });
                        }
                    }

                    dispatch({
                        type: 'SYNC_WORLD',
                        payload: {
                            ...finalWorldState,
                            interactionId: result.interactionId
                        }
                    });
                    dispatch({ type: 'SET_SABOTAGED', payload: !!finalWorldState.sabotage_reveal });
                } else if ('mutation' in result && result.mutation) {
                    dispatch({ type: 'MUTATE_WORLD', payload: result.mutation });
                }

                dispatch({ type: 'SET_HYPOTHESIS', payload: userAnswer });

                if (result.logs) {
                    result.logs.forEach((log: any) => dispatch({ type: 'ADD_MISSION_LOG', payload: log }));
                }
            } else {
                if ('isBlocked' in result && result.isBlocked) {
                    setActiveChallenge(result.message || result.nativeReply);
                } else {
                    const errorMessage = 'error' in result ? result.error : 'Failed to verify logic';
                    throw new Error(errorMessage || 'Failed to verify logic');
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

    const handleMasteryComplete = useCallback(async (score: number) => {
        setMasteryState(prev => ({ ...prev, score, isCrystalUnlocked: true }));

        if (score >= 80) {
            dispatch({ type: 'ADD_MISSION_LOG', payload: { agent: 'Conductor', message: 'Mastery detected. Synthesizing unique Voxel Artifact...', type: 'THINKING' } });

            try {
                const result = await mintMasteryTrophy(sourceTitle || "Mastery", worldState?.explanation || "");
                if (result.success && result.trophy) {
                    dispatch({ type: 'ADD_MISSION_LOG', payload: { agent: 'Artist', message: 'Neural Trophy Manifested! Check your Mind Garden.', type: 'SUCCESS' } });
                }
            } catch (e) {
                console.error("Trophy synthesis failed.");
            }
        }
    }, [sourceTitle, worldState, dispatch]);

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

    const scrubHistory = useCallback((index: number) => {
        if (history[index]) {
            setHistoryIndex(index);
            dispatch({ type: 'SYNC_WORLD', payload: history[index] });
        }
    }, [history, dispatch]);

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
        history,
        historyIndex,
        unlockedHUD: state.unlockedHUD,

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
        mode,
        scrubHistory
    };
}