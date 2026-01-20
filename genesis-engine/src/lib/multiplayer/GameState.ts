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
}

export type GameAction =
    | { type: 'SYNC_WORLD'; payload: WorldState }
    | { type: 'SET_INTERACTION_STATE'; payload: InteractionState }
    | { type: 'PLAYER_JOIN'; payload: PlayerState }
    | { type: 'PLAYER_MOVE'; payload: { id: string; position: [number, number, number] } }
    | { type: 'PLAYER_LEAVE'; payload: { id: string } }
    | { type: 'UPDATE_WORLD_ENVIRONMENT'; payload: any }
    | { type: 'RESET_SIMULATION' };

export const initialGameState: GlobalGameState = {
    sessionId: '',
    worldState: {} as WorldState,
    interactionState: 'IDLE',
    players: {},
    lastUpdated: Date.now(),
};

/**
 * Reducer for P2P Socratic Syncing.
 */
export function gameReducer(state: GlobalGameState, action: GameAction): GlobalGameState {
    switch (action.type) {
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
        case 'UPDATE_WORLD_ENVIRONMENT':
            return {
                ...state,
                worldState: {
                    ...state.worldState,
                    environment: {
                        ...state.worldState.environment,
                        ...action.payload
                    } as any
                }
            };
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
