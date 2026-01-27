'use client';

import React, { createContext, useContext, useReducer, ReactNode, useMemo } from 'react';
import { GlobalGameState, GameAction, gameReducer, initialGameState } from '@/lib/multiplayer/GameState';

interface GenesisContextType {
    state: GlobalGameState;
    dispatch: React.Dispatch<GameAction>;
}

const GenesisContext = createContext<GenesisContextType | undefined>(undefined);

/**
 * GenesisProvider: The central nervous system of the application.
 * Replaces fragmented state logic with a unified Reducer-based Context.
 */
export const GenesisProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(gameReducer, initialGameState);

    // Memoize the value to prevent unnecessary re-renders of all consumers
    const value = useMemo(() => ({ state, dispatch }), [state]);

    return (
        <GenesisContext.Provider value={value}>
            {children}
        </GenesisContext.Provider>
    );
};

export const useGenesisStore = () => {
    const context = useContext(GenesisContext);
    if (context === undefined) {
        throw new Error('useGenesisStore must be used within a GenesisProvider');
    }
    return context;
};
