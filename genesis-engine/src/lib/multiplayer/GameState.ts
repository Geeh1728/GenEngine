import { WorldState, WorldStateSchema } from '@/lib/simulation/schema';
import { SimulationFactory } from '@/lib/simulation/SimulationFactory';
import { SkillNodeSchema, StructuralHeatmapSchema } from '@/lib/genkit/schemas';
import { Quest } from '@/lib/gamification/questEngine';
import { z } from 'zod';
import { sentinel } from '@/lib/simulation/sentinel';

type SkillNode = z.infer<typeof SkillNodeSchema>;
type StructuralHeatmap = z.infer<typeof StructuralHeatmapSchema>;

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
    worldState: WorldState;
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
}

export type GameAction =
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
    | { type: 'SET_LATENT_CONTEXT'; payload: string };

export const initialGameState: GlobalGameState = {
    sessionId: '',
    worldState: null as unknown as WorldState,
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
            // DATA INTEGRITY CHECK: Validate incoming world state against schema
            const validation = WorldStateSchema.safeParse(action.payload);
            if (!validation.success) {
                console.error("[GameState] Data Integrity Failure:", validation.error);
                return state; // Reject corrupt data
            }

            // UNBREAKABLE SENTINEL: Apply collision process stabilization
            const stableWorld = sentinel.stabilize(validation.data as WorldState);

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
        default:
            return state;
    }
}

