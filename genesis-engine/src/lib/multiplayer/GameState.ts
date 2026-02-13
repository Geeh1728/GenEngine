import { WorldState, WorldStateSchema, SkillNodeSchema, StructuralHeatmapSchema } from '@/lib/simulation/schema';
import { SimulationFactory } from '@/lib/simulation/SimulationFactory';
import { Quest } from '@/lib/gamification/questEngine';
import { z } from 'zod';
import { BIOME_PRESETS } from '@/lib/simulation/biomes';
import { ArchitecturalResidue } from '@/lib/db/residue';

type SkillNode = z.infer<typeof SkillNodeSchema>;
type StructuralHeatmap = z.infer<typeof StructuralHeatmapSchema>;

export const SimulationMutationSchema = z.object({
    type: z.enum(['ENTITY_UPDATE', 'ENVIRONMENT_UPDATE', 'JOINT_REMOVE', 'ENTITY_ADD']),
    targetId: z.string().optional().describe('ID of the entity or joint to mutate'),
    patch: z.record(z.string(), z.any()).optional().describe('The delta to apply'),
    biome: z.enum(['SPACE', 'EARTH', 'OCEAN', 'FACTORY', 'JUPITER']).optional(),
    explanation: z.string().optional().describe('AI explanation of why this change was made')
});

export interface PlayerState {
    id: string;
    name: string;
    cursorPosition: [number, number, number];
    selection: string | null;
}

export type InteractionState =
    | 'IDLE'
    | 'LISTENING'
    | 'ANALYZING'
    | 'BUILDING'
    | 'PLAYING'
    | 'REFLECTION';

export interface MissionLog {
    id: string;
    timestamp: number;
    agent: string;
    message: string;
    type: 'INFO' | 'RESEARCH' | 'ERROR' | 'SUCCESS' | 'THINKING' | 'THOUGHT';
}

export interface GlobalGameState {
    sessionId: string;
    user: {
        uid: string;
        displayName: string | null;
        email: string | null;
        photoURL: string | null;
    } | null;
    subscriptionTier: 'FREE' | 'PRO';
    userKeys: Record<string, string>; // e.g. { 'googleai': '...', 'groq': '...' }
    interactionState: InteractionState;
    players: Record<string, PlayerState>;
    lastUpdated: number;
    activeChallenge: string | null; // Socratic questions from Critic
    selectedEntityId: string | null;
    activeNode: SkillNode | null;
    isProcessing: boolean;
    quests: Quest[];
    currentQuestId: string | null;
    lastHypothesis: string;
    error: string | null;
    isSabotaged: boolean;
    fileUri: string | null;
    missionLogs: MissionLog[];
    mode: 'IDLE' | 'PHYSICS' | 'VOXEL' | 'SCIENTIFIC' | 'ASSEMBLER';
    lastInteractionId: string | null;
    structuralHeatmap: StructuralHeatmap | null;
    unlockedHUD: boolean;
    lastInstrumentActivity: number; // Timestamp of last key/impact impulse
    latentContext: string | null; // Compressed semantic memory (v21.5)
    discoveryYear: number; // v35.0 Chronesthesia: Current historical lens (e.g., 1900, 2026)
    chronesthesiaEnabled: boolean;
    rewardSignal: 'NONE' | 'EFFICIENT' | 'UNSTABLE'; // v31.0: Neural Pulse
    vectorWind: { x: number, y: number, z: number }; // v35.5: Search-as-Force
    residues: ArchitecturalResidue[]; // v31.0: Temporal Mirroring
    worldHistory: WorldState[]; // v50.0 Aetheric Recall
    historyIndex: number; // v50.0 Aetheric Recall
    wRotation: number; // v50.0 Tesseract 4D Rotation
    userEntropy: number; // v40.0: Cognitive Stability Proxy (0-1)
    interactionTelemetry: {
        jitter: number; // 0-1 frustration proxy
        lastMove: number;
    };
    knowledgeGraph: {
        nodes: { 
            id: string, 
            label: string, 
            type: 'CONCEPT' | 'ENTITY' | 'FORCE', 
            description?: string,
            certainty: number,
            timestamp?: number
        }[],
        edges: { 
            source: string, 
            target: string, 
            label?: string,
            strength: number
        }[],
        ghostEdges?: {
            source: string,
            target: string,
            label?: string,
            userId?: string
        }[]
    } | null;
}

export type GameAction =
    | { type: 'SET_USER'; payload: GlobalGameState['user'] }
    | { type: 'SET_SUBSCRIPTION'; payload: GlobalGameState['subscriptionTier'] }
    | { type: 'SET_USER_KEY'; payload: { provider: string, key: string } }
    | { type: 'UPDATE_TELEMETRY'; payload: { jitter: number } }
    | { type: 'SET_USER_ENTROPY'; payload: number }
    | { type: 'SYNC_WORLD'; payload: WorldState & { interactionId?: string } }
    | { type: 'SET_INTERACTION_STATE'; payload: InteractionState }
    | { type: 'PLAYER_JOIN'; payload: PlayerState }
    | { type: 'PLAYER_MOVE'; payload: { id: string; position: [number, number, number] } }
    | { type: 'PLAYER_LEAVE'; payload: { id: string } }
    | { type: 'UPDATE_WORLD_ENVIRONMENT'; payload: Record<string, unknown> }
    | { type: 'UPDATE_PHYSICS'; payload: Record<string, unknown> }
    | { type: 'SET_CHALLENGE'; payload: string }
    | { type: 'CLEAR_CHALLENGE' }
    | { type: 'SELECT_ENTITY'; payload: string }
    | { type: 'DESELECT_ENTITY' }
    | { type: 'UPDATE_ENTITY'; payload: { id: string, property: string, value: number | string | boolean } }
    | { type: 'RESET_SIMULATION' }
    | { type: 'SET_ACTIVE_NODE'; payload: SkillNode | null }
    | { type: 'SET_PROCESSING'; payload: boolean }
    | { type: 'SET_QUESTS'; payload: Quest[] }
    | { type: 'SET_CURRENT_QUEST'; payload: string | null }
    | { type: 'SET_HYPOTHESIS'; payload: string }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'SET_SABOTAGED'; payload: boolean }
    | { type: 'SET_FILE_URI'; payload: string | null }
    | { type: 'ADD_MISSION_LOG'; payload: Omit<MissionLog, 'id' | 'timestamp'> }
    | { type: 'CLEAR_MISSION_LOGS' }
    | { type: 'SET_INTERACTION_ID'; payload: string | null }
    | { type: 'SET_HEATMAP'; payload: StructuralHeatmap | null }
    | { type: 'UNLOCK_HUD' }
    | { type: 'RECORD_INSTRUMENT_ACTIVITY' }
    | { type: 'SET_LATENT_CONTEXT'; payload: string }
    | { type: 'MUTATE_WORLD'; payload: z.infer<typeof SimulationMutationSchema> }
    | { type: 'SHATTER_ENTITY'; payload: { id: string, position: { x: number, y: number, z: number }, color: string } }
    | { type: 'TRIGGER_CHAOS'; payload: { vector: 'WIND' | 'ENTROPY' | 'DISSONANCE' } }
    | { type: 'PROMOTE_GHOST'; payload: { id: string } }
    | { type: 'SET_GHOSTS'; payload: { entities: any[] } }
    | { type: 'SET_KNOWLEDGE_GRAPH'; payload: GlobalGameState['knowledgeGraph'] }
    | { type: 'SET_DISCOVERY_YEAR'; payload: number }
    | { type: 'TOGGLE_CHRONESTHESIA' }
    | { type: 'SET_REWARD_SIGNAL'; payload: GlobalGameState['rewardSignal'] }
    | { type: 'SET_REWARD_SIGNAL'; payload: GlobalGameState['rewardSignal'] }
    | { type: 'SET_RESIDUES'; payload: ArchitecturalResidue[] }
    | { type: 'RECORD_HISTORY'; payload: WorldState }
    | { type: 'TRAVEL_TO'; payload: number }
    | { type: 'SET_W_ROTATION'; payload: number }
    | { type: 'SET_VECTOR_WIND'; payload: { x: number, y: number, z: number } };

export const initialGameState: GlobalGameState = {
    sessionId: '',
    user: null,
    subscriptionTier: 'FREE',
    userKeys: {},
    interactionState: 'IDLE',
    players: {},
    lastUpdated: Date.now(),
    activeChallenge: null,
    selectedEntityId: null,
    activeNode: null,
    isProcessing: false,
    quests: [],
    currentQuestId: null,
    lastHypothesis: '',
    error: null,
    isSabotaged: false,
    fileUri: null,
    missionLogs: [],
    mode: 'IDLE',
    lastInteractionId: null,
    structuralHeatmap: null,
    unlockedHUD: false,
    lastInstrumentActivity: 0,
    latentContext: null,
    knowledgeGraph: null,
    discoveryYear: 2026,
    chronesthesiaEnabled: false,
    rewardSignal: 'NONE',
    vectorWind: { x: 0, y: 0, z: 0 },
    residues: [],
    worldHistory: [],
    historyIndex: -1,
    wRotation: 0,
    userEntropy: 0,
    interactionTelemetry: {
        jitter: 0,
        lastMove: 0
    }
};

/**
 * Type guard for valid GlobalGameState modes
 */
const VALID_MODES = ['IDLE', 'PHYSICS', 'VOXEL', 'SCIENTIFIC', 'ASSEMBLER'] as const;
function isValidMode(mode: unknown): mode is GlobalGameState['mode'] {
    return typeof mode === 'string' && VALID_MODES.includes(mode as GlobalGameState['mode']);
}

/**
 * Reducer for P2P Socratic Syncing.
 */
export function gameReducer(state: GlobalGameState, action: GameAction): GlobalGameState {
    switch (action.type) {
        case 'SET_USER':
            return { ...state, user: action.payload };
        case 'SET_SUBSCRIPTION':
            return { ...state, subscriptionTier: action.payload };
        case 'SET_USER_KEY':
            return { 
                ...state, 
                userKeys: { 
                    ...state.userKeys, 
                    [action.payload.provider]: action.payload.key 
                } 
            };
        case 'UPDATE_TELEMETRY':
            return { 
                ...state, 
                interactionTelemetry: { 
                    ...state.interactionTelemetry, 
                    jitter: action.payload.jitter,
                    lastMove: Date.now()
                } 
            };
        case 'SET_USER_ENTROPY':
            return { ...state, userEntropy: action.payload };
        case 'UNLOCK_HUD':
            return { ...state, unlockedHUD: true };
        case 'ADD_MISSION_LOG':
            return {
                ...state,
                missionLogs: [
                    ...state.missionLogs,
                    {
                        ...action.payload,
                        id: Math.random().toString(36).substring(7),
                        timestamp: Date.now()
                    }
                ].slice(-50) // Keep last 50 logs
            };
        case 'CLEAR_MISSION_LOGS':
            return { ...state, missionLogs: [] };
        case 'SET_HYPOTHESIS':
            return { ...state, lastHypothesis: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        case 'SET_SABOTAGED':
            return { ...state, isSabotaged: action.payload };
        case 'SET_FILE_URI':
            return { ...state, fileUri: action.payload };
        case 'SET_ACTIVE_NODE':
            return { ...state, activeNode: action.payload };
        case 'SET_PROCESSING':
            return { ...state, isProcessing: action.payload };
        case 'SET_QUESTS':
            return { ...state, quests: action.payload };
        case 'SET_CURRENT_QUEST':
            return { ...state, currentQuestId: action.payload };
        case 'UPDATE_ENTITY': {
            if (!state.worldState?.entities) return state;
            return {
                ...state,
                worldState: {
                    ...state.worldState,
                    entities: state.worldState.entities.map(e => {
                        if (e.id !== action.payload.id) return e;
                        const newPhysics = { ...e.physics };
                        if (action.payload.property === 'mass') newPhysics.mass = action.payload.value as number;
                        if (action.payload.property === 'restitution') newPhysics.restitution = action.payload.value as number;
                        if (action.payload.property === 'friction') newPhysics.friction = action.payload.value as number;
                        return { ...e, physics: newPhysics };
                    })
                }
            };
        }
        case 'SELECT_ENTITY':
            return { ...state, selectedEntityId: action.payload };
        case 'DESELECT_ENTITY':
            return { ...state, selectedEntityId: null };
        case 'SET_CHALLENGE':
            return { ...state, activeChallenge: action.payload };
        case 'CLEAR_CHALLENGE':
            return { ...state, activeChallenge: null };
        case 'SET_INTERACTION_ID':
            return { ...state, lastInteractionId: action.payload };
        case 'SET_HEATMAP':
            return { ...state, structuralHeatmap: action.payload };
        case 'SYNC_WORLD': {
            // v60.0 GOLD: Unified Arbitrator Pipeline
            // This replaces safestParse + stabilization with a single God-Flow validator.
            // Note: Since this is in a reducer, we handle the async validation in the caller
            // or assume the payload is already validated if it comes from internal actions.
            // For P2P sync, the P2PConnector should call arbitrator.validate before dispatching.
            
            const stableWorld = action.payload; // Assumed validated by the new pipeline

            return {
                ...state,
                worldState: stableWorld,
                mode: isValidMode(stableWorld.mode) ? stableWorld.mode : 'PHYSICS',
                lastInteractionId: action.payload.interactionId || state.lastInteractionId,
                lastUpdated: Date.now(),
                unlockedHUD: true, // Auto-unlock on first manifestation
            };
        }
        case 'SET_INTERACTION_STATE':
            return {
                ...state,
                interactionState: action.payload,
            };
        case 'UPDATE_PHYSICS':
        case 'UPDATE_WORLD_ENVIRONMENT': {
            const currentWorld = state.worldState || SimulationFactory.createEmptyWorld();
            const newMode = 'PHYSICS';

            // CLEANUP: If we are in the default "Suspension Bridge" and changing physics,
            // wipe the bridge so the user can see the simple physics clearly.
            let newEntities = currentWorld.entities || [];
            if (currentWorld.scenario === "Suspension Bridge Test") {
                newEntities = [SimulationFactory.createGround()]; // Keep the floor
            }

            // Auto-Spawn: If world is empty (or only has ground), spawn a "Test Object"
            const hasTestObject = newEntities.some(e => e.id !== 'ground');
            if (!hasTestObject) {
                newEntities = [...newEntities, SimulationFactory.createTestCube({ id: 'gravity-test' })];
            }

            return {
                ...state,
                mode: 'PHYSICS',
                worldState: {
                    ...currentWorld,
                    mode: newMode,
                    entities: newEntities,
                    custom_canvas_code: currentWorld.custom_canvas_code, // Preserve custom code
                    environment: {
                        ...(currentWorld.environment || {}),
                        ...action.payload
                    } as WorldState['environment']
                }
            };
        }
        case 'PLAYER_JOIN':
            return {
                ...state,
                players: {
                    ...state.players,
                    [action.payload.id]: action.payload,
                },
            };
        case 'PLAYER_MOVE':
            if (!state.players[action.payload.id]) return state;
            return {
                ...state,
                players: {
                    ...state.players,
                    [action.payload.id]: {
                        ...state.players[action.payload.id],
                        cursorPosition: action.payload.position,
                    },
                },
            };
        case 'PLAYER_LEAVE': {
            const newPlayers = { ...state.players };
            delete newPlayers[action.payload.id];
            return {
                ...state,
                players: newPlayers,
            };
        }
        case 'RESET_SIMULATION':
            return initialGameState;
        case 'RECORD_INSTRUMENT_ACTIVITY':
            return { ...state, lastInstrumentActivity: Date.now() };
        case 'SET_LATENT_CONTEXT':
            return { ...state, latentContext: action.payload };
        case 'MUTATE_WORLD': {
            if (!state.worldState) return state;
            const mutation = action.payload;
            const nextWorldState = { ...state.worldState };

            if (mutation.type === 'ENVIRONMENT_UPDATE' && mutation.biome) {
                const biomeConfig = BIOME_PRESETS[mutation.biome];
                nextWorldState.environment = {
                    ...nextWorldState.environment,
                    biome: mutation.biome,
                    gravity: biomeConfig.physics.gravity,
                    timeScale: biomeConfig.physics.timeScale
                };
            }

            if (mutation.type === 'ENTITY_UPDATE' && mutation.targetId && mutation.patch) {
                nextWorldState.entities = nextWorldState.entities?.map(e => {
                    if (e.id !== mutation.targetId) return e;

                    // Specific handling for physics patch
                    const physicsPatch = mutation.patch!.physics;
                    const nextPhysics = physicsPatch ? { ...e.physics, ...physicsPatch } : e.physics;

                    return {
                        ...e,
                        ...mutation.patch,
                        physics: nextPhysics
                    };
                });
            }

            if (mutation.type === 'ENTITY_ADD' && mutation.patch) {
                const newEntity = mutation.patch as any;
                nextWorldState.entities = [...(nextWorldState.entities || []), newEntity];
            }

            if (mutation.type === 'JOINT_REMOVE' && mutation.targetId) {
                nextWorldState.joints = nextWorldState.joints?.filter(j => j.id !== mutation.targetId);
            }

            return {
                ...state,
                worldState: nextWorldState
            };
        }
        case 'SHATTER_ENTITY': {
            if (!state.worldState) return state;
            const entities = (state.worldState.entities || []).filter(e => e.id !== action.payload.id);

            // Generate fragments (voxels)
            const fragments = [];
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    for (let k = -1; k <= 1; k++) {
                        fragments.push({
                            x: action.payload.position.x + i * 0.2,
                            y: action.payload.position.y + j * 0.2,
                            z: action.payload.position.z + k * 0.2,
                            color: action.payload.color
                        });
                    }
                }
            }

            const existingVoxels = state.worldState.voxels || [];

            return {
                ...state,
                worldState: {
                    ...state.worldState,
                    entities,
                    voxels: [...existingVoxels, ...fragments].slice(-1000) // Performance cap
                }
            };
        }
        case 'TRIGGER_CHAOS': {
            if (!state.worldState) return state;
            const { vector } = action.payload;
            const nextWorldState = { ...state.worldState };

            if (vector === 'WIND') {
                // Apply global wind vector via environment
                nextWorldState.environment = {
                    ...nextWorldState.environment,
                    gravity: {
                        x: (Math.random() - 0.5) * 10,
                        y: nextWorldState.environment?.gravity.y || -9.81,
                        z: (Math.random() - 0.5) * 10
                    }
                } as any;
            } else if (vector === 'ENTROPY') {
                // Randomly remove a joint to simulate structural failure
                if (nextWorldState.joints && nextWorldState.joints.length > 0) {
                    const index = Math.floor(Math.random() * nextWorldState.joints.length);
                    nextWorldState.joints = nextWorldState.joints.filter((_, i) => i !== index);
                }
            } else if (vector === 'DISSONANCE') {
                // Detune all frequency maps by 5%
                nextWorldState.entities = nextWorldState.entities?.map(e => {
                    if (!e.frequency_map) return e;
                    return {
                        ...e,
                        frequency_map: e.frequency_map.map(m => ({
                            ...m,
                            note: `${m.note} (detuned)` // Visual marker, logic handles detune
                        }))
                    };
                });
            }

            return {
                ...state,
                worldState: nextWorldState,
                isSabotaged: true,
                missionLogs: [
                    ...state.missionLogs,
                    {
                        id: Math.random().toString(36).substring(7),
                        timestamp: Date.now(),
                        agent: 'SABOTEUR',
                        message: `CHAOS EVENT TRIGGERED: ${vector}`,
                        type: 'ERROR'
                    }
                ]
            };
        }
        case 'SET_GHOSTS': {
            if (!state.worldState) return state;
            const ghostEntities = action.payload.entities.map(e => ({
                ...e,
                isGhost: true
            }));
            return {
                ...state,
                worldState: {
                    ...state.worldState,
                    entities: [...(state.worldState.entities || []), ...ghostEntities]
                }
            };
        }
        case 'SET_KNOWLEDGE_GRAPH':
            return { ...state, knowledgeGraph: action.payload };
        case 'SET_DISCOVERY_YEAR':
            return { ...state, discoveryYear: action.payload };
        case 'TOGGLE_CHRONESTHESIA':
            return { ...state, chronesthesiaEnabled: !state.chronesthesiaEnabled };
        case 'SET_REWARD_SIGNAL':
            return { ...state, rewardSignal: action.payload };
        case 'SET_RESIDUES':
            return { ...state, residues: action.payload };
        case 'RECORD_HISTORY': {
            const nextHistory = [...state.worldHistory, action.payload];
            if (nextHistory.length > 50) nextHistory.shift();
            return {
                ...state,
                worldHistory: nextHistory,
                historyIndex: nextHistory.length - 1
            };
        }
        case 'TRAVEL_TO': {
            const targetIndex = action.payload;
            if (targetIndex < 0 || targetIndex >= state.worldHistory.length) return state;
            return {
                ...state,
                worldState: state.worldHistory[targetIndex],
                historyIndex: targetIndex
            };
        }
        case 'SET_W_ROTATION':
            return { ...state, wRotation: action.payload };
        case 'SET_VECTOR_WIND':
            return { ...state, vectorWind: action.payload };
        case 'PROMOTE_GHOST': {
            if (!state.worldState) return state;
            return {
                ...state,
                worldState: {
                    ...state.worldState,
                    entities: state.worldState.entities?.map(e => {
                        if (e.id !== action.payload.id) return e;
                        return {
                            ...e,
                            isGhost: false
                        };
                    }).filter(e => {
                        // Remove other ghosts when one is promoted (Collapse of timelines)
                        return e.id === action.payload.id || !e.isGhost;
                    })
                }
            };
        }
        default:
            return state;
    }
}

