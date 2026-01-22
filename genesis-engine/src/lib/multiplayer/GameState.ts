import { WorldState } from '@/lib/simulation/schema';

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

export interface GlobalGameState {
    sessionId: string;
    worldState: WorldState;
    interactionState: InteractionState;
    players: Record<string, PlayerState>;
    lastUpdated: number;
    activeChallenge: string | null; // Socratic questions from Critic
}

export type GameAction =
    | { type: 'SYNC_WORLD'; payload: WorldState }
    | { type: 'SET_INTERACTION_STATE'; payload: InteractionState }
    | { type: 'PLAYER_JOIN'; payload: PlayerState }
    | { type: 'PLAYER_MOVE'; payload: { id: string; position: [number, number, number] } }
    | { type: 'PLAYER_LEAVE'; payload: { id: string } }
    | { type: 'UPDATE_WORLD_ENVIRONMENT'; payload: Record<string, unknown> }
    | { type: 'UPDATE_PHYSICS'; payload: Record<string, unknown> }
    | { type: 'SET_CHALLENGE'; payload: string }
    | { type: 'CLEAR_CHALLENGE' }
    | { type: 'RESET_SIMULATION' };

export const initialGameState: GlobalGameState = {
    sessionId: '',
    worldState: {} as WorldState,
    interactionState: 'IDLE',
    players: {},
    lastUpdated: Date.now(),
    activeChallenge: null,
};

/**
 * Reducer for P2P Socratic Syncing.
 */
export function gameReducer(state: GlobalGameState, action: GameAction): GlobalGameState {
    switch (action.type) {
        case 'SET_CHALLENGE':
            return { ...state, activeChallenge: action.payload };
        case 'CLEAR_CHALLENGE':
            return { ...state, activeChallenge: null };
        case 'SYNC_WORLD':
            return {
                ...state,
                worldState: action.payload,
                lastUpdated: Date.now(),
            };
        case 'SET_INTERACTION_STATE':
            return {
                ...state,
                interactionState: action.payload,
            };
        case 'UPDATE_PHYSICS':
        case 'UPDATE_WORLD_ENVIRONMENT': {
            const currentWorld = state.worldState || { 
                entities: [], 
                mode: 'PHYSICS', 
                scenario: 'Physics Environment', 
                environment: { gravity: { x: 0, y: -9.8, z: 0 }, timeScale: 1 },
                constraints: [],
                successCondition: 'Explore the environment',
                description: 'A physical space with basic gravity.',
                explanation: 'This mode allows for direct manipulation of physical constants.'
            };
            const newMode = 'PHYSICS';
            
            // CLEANUP: If we are in the default "Suspension Bridge" and changing physics,
            // wipe the bridge so the user can see the simple physics clearly.
            let newEntities = currentWorld.entities || [];
            if (currentWorld.scenario === "Suspension Bridge Test") {
                newEntities = []; // Clear the bridge
            }

            // Auto-Spawn: If world is empty (or we just cleared it), spawn a "Test Object"
            if (newEntities.length === 0) {
                newEntities = [{
                    id: 'gravity-test',
                    type: 'cube',
                    position: { x: 0, y: 5, z: 0 },
                    physics: { mass: 1, friction: 0.5, restitution: 0.7 },
                    dimensions: { x: 1, y: 1, z: 1 },
                    color: '#3b82f6', // Blue
                    name: 'Gravity Test'
                }];
            }

            return {
                ...state,
                worldState: {
                    ...currentWorld,
                    mode: newMode,
                    entities: newEntities,
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
        default:
            return state;
    }
}
