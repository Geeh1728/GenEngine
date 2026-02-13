import { useCallback, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useSimulationState } from './useSimulationState';
import { useGamification } from './useGamification';
import { useGenesisUI } from './useGenesisUI';
import { getEmbedding } from '@/lib/ai/embeddings';
import { processMultimodalIntent } from '@/app/actions';
import { storeKnowledge } from '@/lib/db/pglite';
import { useGenesisStore } from '@/lib/store/GenesisContext';
import { blackboard } from '@/lib/genkit/context';
import { WorldState } from '@/lib/simulation/schema';
import { usePersistence } from './utils/usePersistence';
import { p2p } from '@/lib/multiplayer/P2PConnector';
import { sfx } from '@/lib/sound/SoundManager';
import { applyMathOverride } from '@/lib/python/mathOverride';
import { mintMasteryTrophy } from '@/app/actions/mastery';
import { decodeWorld } from '@/lib/utils/wormhole';
import { normalizeEntities } from '@/lib/simulation/normalizer';
import { reflexPredictor } from '@/lib/simulation/reflex-predictor';
import { visualEcho } from '@/lib/vision/echo-buffer';
import { useTimeline } from './useTimeline';
import { exobrain } from '@/lib/storage/exobrain';
import { neuralMap } from '@/lib/storage/neural-map';
import { MasteryLogic } from '@/lib/gamification/mastery-logic';
import { synestheticAudio } from '@/lib/audio/synesthetic-audio';
import { generateSessionReport } from '@/app/actions/reporting';
import { useLiveAudio } from './useLiveAudio';
import { SecondOrderDynamics } from '@/lib/multiplayer/SecondOrderDynamics';
import { useIntentionMonitor } from './useIntentionMonitor';
import { useDreamingScientist } from './useDreamingScientist';
import { semanticUndo } from '@/app/actions/temporal';
import { graftOntologies } from '@/lib/simulation/ontology-graft';
import { useAstraGlobalContext } from './useAstraGlobalContext';


// (Local types to avoid server-side schema imports)
interface WorldRule {
    id: string;
    rule: string;
    description: string;
    grounding_source?: string;
    isActive: boolean;
}

interface SkillNode {
    id: string;
    label: string;
    description: string;
    difficulty: number;
    completed?: boolean;
}

interface SkillTree {
    nodes: SkillNode[];
    goal: string;
    knowledgeGraph?: any;
}

type ComplexityLevel = 'standard' | 'advanced' | 'quantum';

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
    // MODULE P: Persistent solvers for second-order motion
    const [solvers] = useState<Map<string, SecondOrderDynamics>>(new Map());

    // MODULE B: Intention Monitoring (v28.0)
    useIntentionMonitor();

    // MODULE Δ: Dreaming Scientist (v30.0)
    useDreamingScientist();

    // MODULE Σ: Astra Global Context (v55.0)
    useAstraGlobalContext();

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
    const [chaosIntensity, setChaosIntensity] = useState(1.0); // v35.0

    // --- MODULE T: TEMPORAL HISTORY (v50.0 updated) ---
    const { recordHistory, history, currentIndex } = useTimeline();

    useEffect(() => {
        const interval = setInterval(() => {
            if (worldState && !isPaused && !isProcessing) {
                recordHistory();
            }
        }, 2000); // Snapshot every 2 seconds
        return () => clearInterval(interval);
    }, [worldState, isPaused, isProcessing, recordHistory]);

    // --- MODULE A: ASTRA LIVE ---
    const { status: astraStatus, astraVolume, isSpeaking: isAstraSpeaking } = useLiveAudio({
        initialWorldState: worldState || undefined,
        currentWorldState: worldState || undefined,
        onPhysicsUpdate: (delta) => dispatch({ type: 'SYNC_WORLD', payload: { ...worldState, ...delta } })
    });

    // MODULE Σ: BIOMETRIC FLOW CONTROL (v35.0)
    useEffect(() => {
        const vibe = blackboard.getContext().userVibe;
        
        // Inverse relationship: High intensity (frustration) = Lower chaos
        // Low intensity (boredom/calm) = Higher chaos
        const targetChaos = 1.0 - (vibe.intensity * 0.8); // Scale between 0.2 and 1.0
        setChaosIntensity(THREE.MathUtils.lerp(chaosIntensity, targetChaos, 0.05));

        // Apply to environment forces if active
        if (state.vectorWind.x !== 0 || state.vectorWind.y !== 0 || state.vectorWind.z !== 0) {
            dispatch({
                type: 'SET_WIND',
                payload: {
                    x: state.vectorWind.x * chaosIntensity,
                    y: state.vectorWind.y * chaosIntensity,
                    z: state.vectorWind.z * chaosIntensity
                }
            });
        }
    }, [state.vectorWind, state.interactionState, chaosIntensity, dispatch]);

    // MODULE N-S: NEURAL SYMPATHY (Audio -> Physics)
    useEffect(() => {
        if (!worldState || !isAstraSpeaking || astraVolume === 0) return;

        // Modulate environment based on Astra's voice energy
        const stiffness = 1.0 + (astraVolume * 2); // More voice energy = stiffer world
        const damping = 0.5 + (astraVolume * 0.5);

        dispatch({
            type: 'SYNC_WORLD',
            payload: {
                ...worldState,
                environment: {
                    ...worldState.environment!,
                    stiffness,
                    damping
                },
                _resonanceBalance: Math.max(0, 1 - astraVolume) // Astra's energy creates 'dissonance' or 'impact'
            }
        });
    }, [astraVolume, isAstraSpeaking, dispatch]);

    // MODULE S-R: SEMANTIC RESONANCE (Physics -> Audio)
    useEffect(() => {
        if (!worldState || isPaused) return;

        // Update the synesthetic audio manager with system state
        const totalKE = worldState._kineticEnergy || 0;
        const resonance = worldState._resonanceBalance || 0.5;
        const biome = worldState.environment?.biome || 'EARTH';

        synestheticAudio.updatePhysicsState(totalKE, resonance, biome);

        // v31.0: NEURAL PULSE (REWARD SIGNAL)
        if (totalKE > 500 && resonance > 0.8) {
            dispatch({ type: 'SET_REWARD_SIGNAL', payload: 'EFFICIENT' });
        } else if (resonance < 0.4) {
            dispatch({ type: 'SET_REWARD_SIGNAL', payload: 'UNSTABLE' });
        } else {
            dispatch({ type: 'SET_REWARD_SIGNAL', payload: 'NONE' });
        }

        // TRIGGER CLASH: If energy spikes suddenly
        if (totalKE > 1000) {
            synestheticAudio.triggerClash(totalKE / 100, resonance);
        }
    }, [worldState?._kineticEnergy, worldState?._resonanceBalance, isPaused]);

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

                            // v32.0 AUTONOMOUS IMMUNE SYSTEM: Auto-Repair
                            dispatch({
                                type: 'ADD_MISSION_LOG',
                                payload: { agent: 'Astra', message: "Structural weakness detected. Initiating auto-evolution.", type: 'THINKING' }
                            });

                            const repairResult = await processMultimodalIntent({
                                text: "Reinforce any unstable structures identified by the Sentinel.",
                                interactionState: 'PLAYING',
                                previousInteractionId: state.lastInteractionId || undefined
                            });

                            if (repairResult.success && 'mutation' in repairResult) {
                                dispatch({ type: 'MUTATE_WORLD', payload: repairResult.mutation });
                                sfx.playSuccess();
                            }
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

                        // MODULE P: SECOND ORDER DYNAMICS (t3ssel8r Algorithm)
                        let solver = solvers.get(e.id);
                        if (!solver) {
                            // Initialize solver with default 'Alive' personality constants
                            // Frequency: 2.0, Damping: 0.5 (expressive overshoot), Response: 2.0 (kick)
                            solver = new SecondOrderDynamics(2.0, 0.5, 2.0, e.position);
                            solvers.set(e.id, solver);
                        }

                        const evolvedPos = solver.update(1 / 15, e.position);
                        const evolvedVel = solver.getVelocity();
                        return {
                            ...e,
                            position: evolvedPos,
                            velocity: evolvedVel
                        };
                    });

                    // Trigger prediction for next frame
                    ctx.currentWorldState.entities?.forEach(async (e: any) => {
                        if (e.isRemote) {
                            const prediction = await reflexPredictor.predictTrajectory(e);
                            ghostBuffer.predictedPos[e.id] = prediction.points[0];
                        }
                        
                        // MODULE C: Probability Clouds (v30.0)
                        if (blackboard.getContext().xRayMode) {
                            e.probabilitySnapshots = reflexPredictor.predictProbabilityCloud(e, 5);
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
                const hydrate = async () => {
                    if (validState.entities) {
                        validState.entities = await normalizeEntities(validState.entities);
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
                };

                hydrate();

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

    const fetchWorldState = useCallback(async (rules: WorldRule[], simulationConfig?: any) => {
        try {
            const response = await fetch('/api/world-state', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic: sourceTitle || 'Quantum Physics',
                    rules,
                    simulationConfig, // ADDED: Pass the compiled ECS config
                    complexity: godModeState.complexity,
                    fileUri: state.fileUri,
                    previousInteractionId: state.lastInteractionId,
                    chronesthesia: { year: state.discoveryYear, enabled: state.chronesthesiaEnabled }
                }),
            });
            if (response.ok) {
                const data = await response.json();
                dispatch({ type: 'SYNC_WORLD', payload: data });
                setGodModeState(prev => ({
                    ...prev,
                    constants: { ...data.constants, timeScale: 1 }
                }));

                // MODULE N: NEURALMAP REGISTRATION
                const registryTopic = sourceTitle || "Quantum Physics";
                if (data.consensus_score && data.consensus_score >= 90) {
                    console.log(`[NeuralMap] Registering High-Consensus Reality: ${registryTopic}`);
                    neuralMap.register(registryTopic, data);
                }
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

            // REALITY COMPILER NOTIFICATION
            if (data.simulationConfig) {
                dispatch({ 
                    type: 'ADD_MISSION_LOG', 
                    payload: { 
                        agent: 'Conductor', 
                        message: `Reality Compiler: ${data.simulationConfig.entities.length} entities and ${Object.keys(data.simulationConfig.globalParameters || {}).length} physical constants extracted.`, 
                        type: 'SUCCESS' 
                    } 
                });
            }

            // v32.5 STREAMING MANIFESTATION (Scout Result)
            if (data.scoutResult && data.scoutResult.entities?.length > 0) {
                dispatch({ 
                    type: 'ADD_MISSION_LOG', 
                    payload: { 
                        agent: 'Scout', 
                        message: `LPU Scout detected ${data.scoutResult.entities.length} core entities. Manifesting instantly...`, 
                        type: 'INFO' 
                    } 
                });
                
                // Convert SimConfig to partial WorldState and sync
                const scoutWorld: WorldState = {
                    scenario: data.metadata?.title || "Streaming Reality",
                    mode: 'PHYSICS',
                    domain: 'SCIENCE',
                    entities: await normalizeEntities(data.scoutResult.entities.map((e: any) => ({
                        ...e,
                        truthSource: 'GROUNDED'
                    }))),
                    environment: {
                        gravity: data.scoutResult.globalParameters?.gravity ? { x: 0, y: -data.scoutResult.globalParameters.gravity, z: 0 } : { x: 0, y: -9.81, z: 0 },
                        timeScale: 1
                    },
                    constraints: [],
                    description: "First-pass streaming reality.",
                    explanation: "LPU-accelerated scout pass completed.",
                    _renderingStage: 'SOLID',
                    _resonanceBalance: 0.5
                };
                
                dispatch({ type: 'SYNC_WORLD', payload: scoutWorld });
                sfx.playSuccess();
            }

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
            blackboard.update({ worldRules: rulesWithIds });
            setSourceTitle(data.metadata?.title || 'Unknown Source');
            setIsIngested(true);
            if (data.fileUri) {
                dispatch({ type: 'SET_FILE_URI', payload: data.fileUri });
            }

            // Pass the compiled ECS config to the physicist
            await fetchWorldState(rulesWithIds, data.simulationConfig);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ingestion failed');
        } finally {
            setIsProcessing(false);
        }
    }, [fetchWorldState, setError, setIsProcessing, dispatch]);

    const handleGraft = useCallback(async (file: File) => {
        setIsProcessing(true);
        setError(null);
        dispatch({ type: 'ADD_MISSION_LOG', payload: { agent: 'Conductor', message: 'Initiating Semantic Grafting sequence...', type: 'THINKING' } });

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('existingRules', JSON.stringify(worldRules)); // Pass active rules for server-side grafting

            const response = await fetch('/api/ingest', { method: 'POST', body: formData });
            if (!response.ok) throw new Error('Grafting ingestion failed');
            const data = await response.json();

            // The API now returns grafted rules if existingRules were provided
            const graftedRules = data.rules || [];
            setWorldRules(graftedRules);
            blackboard.update({ worldRules: graftedRules });

            dispatch({ 
                type: 'ADD_MISSION_LOG', 
                payload: { 
                    agent: 'Conductor', 
                    message: `Ontology Grafted: "${data.metadata?.title}" merged with active reality. ${graftedRules.length} rules now active.`, 
                    type: 'SUCCESS' 
                } 
            });

            await fetchWorldState(graftedRules, data.simulationConfig);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Grafting failed');
        } finally {
            setIsProcessing(false);
        }
    }, [worldRules, fetchWorldState, setError, setIsProcessing, dispatch]);

    const startExamLevel = useCallback(async (examText: string) => {
        setIsProcessing(true);
        dispatch({ type: 'ADD_MISSION_LOG', payload: { agent: 'Mastery', message: 'Compiling interactive exam level...', type: 'THINKING' } });
        
        try {
            const response = await fetch('/api/mastery/exam', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ examText })
            });

            if (response.ok) {
                const { levelConfig } = await response.json();
                
                // Now compile this config into a WorldState
                const worldResponse = await fetch('/api/world-state', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        topic: levelConfig.levelName,
                        context: `Scenario: ${levelConfig.questionText}. Win Condition: ${levelConfig.winCondition}`,
                        simulationConfig: levelConfig.initialState,
                        complexity: godModeState.complexity
                    }),
                });

                if (worldResponse.ok) {
                    const worldData = await worldResponse.json();
                    dispatch({ type: 'SYNC_WORLD', payload: { ...worldData, scenario: levelConfig.levelName } });
                    dispatch({ type: 'ADD_MISSION_LOG', payload: { agent: 'Mastery', message: `Level Loaded: ${levelConfig.levelName}. Objective: ${levelConfig.winCondition}`, type: 'SUCCESS' } });
                }
            }
        } catch (err) {
            console.error('Failed to start exam level', err);
            setError('Failed to generate interactive exam level.');
        } finally {
            setIsProcessing(false);
        }
    }, [godModeState.complexity, dispatch, setIsProcessing, setError]);

    const startSimulation = useCallback(async (node: SkillNode) => {
        setActiveNode(node);
        setIsProcessing(true);
        try {
            // MODULE N: NEURALMAP REGISTRY LOOKUP
            const cachedReality = await neuralMap.lookup(node.label);
            if (cachedReality) {
                dispatch({ type: 'SYNC_WORLD', payload: cachedReality });
                dispatch({ type: 'ADD_MISSION_LOG', payload: { agent: 'Librarian', message: `Manifesting stabilized reality: "${node.label}" from NeuralMap.`, type: 'SUCCESS' } });
                setIsProcessing(false);
                return;
            }

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

    const generateCurriculum = useCallback(async (goal: string) => {
        setIsProcessing(true);
        dispatch({ type: 'ADD_MISSION_LOG', payload: { agent: 'Architect', message: `Manifesting Skill Tree for: ${goal}`, type: 'THINKING' } });
        try {
            const response = await fetch('/api/mastery/curriculum', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ goal, fileUri: state.fileUri }),
            });
            if (response.ok) {
                const data = await response.json();
                setSkillTree(data);
                
                // Module Spider: Dispatch Knowledge Graph if available
                if (data.knowledgeGraph) {
                    dispatch({ type: 'SET_KNOWLEDGE_GRAPH', payload: data.knowledgeGraph });
                    dispatch({ type: 'ADD_MISSION_LOG', payload: { agent: 'Librarian', message: 'Knowledge Spider has spun a 3D conceptual web. Reality is ready for navigation.', type: 'SUCCESS' } });
                    sfx.playSuccess();
                }

                dispatch({ type: 'ADD_MISSION_LOG', payload: { agent: 'Architect', message: 'Neural Curriculum manifested. What is our first milestone?', type: 'SUCCESS' } });
            }
        } catch (err) {
            console.error('Failed to generate curriculum', err);
            setError('Failed to manifest curriculum.');
        } finally {
            setIsProcessing(false);
        }
    }, [state.fileUri, dispatch, setIsProcessing, setError]);

    const toggleRule = useCallback((id: string) => {
        const nextRules = worldRules.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r);
        setWorldRules(nextRules);
        blackboard.update({ worldRules: nextRules });
        
        setGodModeState(prev => {
            const isOverridden = prev.overrides.includes(id);
            return {
                ...prev,
                overrides: isOverridden
                    ? prev.overrides.filter(o => o !== id)
                    : [...prev.overrides, id]
            };
        });
    }, [worldRules]);

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
                            finalWorldState = await applyMathOverride(
                                result.worldState, 
                                result.worldState.python_code, 
                                undefined, 
                                { year: state.discoveryYear, enabled: state.chronesthesiaEnabled }
                            );
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
            dispatch({ type: 'SET_HISTORY_INDEX', payload: index });
            dispatch({ type: 'SYNC_WORLD', payload: history[index] });
        }
    }, [history, dispatch]);

    // --- MODULE CHAOS (v28.0 - Socratic Adversary) ---
    const triggerChaosEvent = useCallback((vector: 'WIND' | 'ENTROPY' | 'DISSONANCE') => {
        dispatch({ type: 'TRIGGER_CHAOS', payload: { vector } });
        sfx.playWarning();
    }, [dispatch]);

    // --- ORACLE FUNCTIONS (v24.0) ---

    const temporalUndo = useCallback(async (intent: string) => {
        if (!worldState || history.length === 0) return;
        setIsProcessing(true);
        try {
            const result = await semanticUndo(intent, history, worldState);
            if (result.success && result.worldState) {
                dispatch({ type: 'SYNC_WORLD', payload: result.worldState });
                sfx.playSuccess();
            }
        } catch (e) {
            console.error("Temporal Undo Failed:", e);
        } finally {
            setIsProcessing(false);
        }
    }, [worldState, history, dispatch, setIsProcessing]);

    const manifestReport = useCallback(async () => {
        if (!worldState) return;

        // Collect transcript from mission logs
        const transcript = state.missionLogs.map(l => `${l.agent}: ${l.message}`);

        setIsProcessing(true);
        try {
            const result = await generateSessionReport(transcript, worldState);
            if (result.success && result.report) {
                console.log("[Author] Scientific Paper Manifested:", result.report.title);
                // Trigger download or show modal
                const blob = new Blob([result.report.markdown], { type: 'text/markdown' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${result.report.title.replace(/\s+/g, '_')}.md`;
                a.click();

                dispatch({
                    type: 'ADD_MISSION_LOG',
                    payload: {
                        agent: 'Conductor',
                        message: `Scientific Paper Manifested: "${result.report.title}". Knowledge stabilized.`,
                        type: 'SUCCESS'
                    }
                });
                sfx.playSuccess();
            }
        } catch (e) {
            console.error("Report Generation Failed:", e);
        } finally {
            setIsProcessing(false);
        }
    }, [worldState, state.missionLogs, dispatch, setIsProcessing]);

    return {
        state,
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
        historyIndex: state.historyIndex,
        unlockedHUD: state.unlockedHUD,

        handleIngest,
        handleGraft,
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
        scrubHistory,
        startExamLevel,
        generateCurriculum
    };
}
        
