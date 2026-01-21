import { blackboard } from '../genkit/context';

export type LocalTool = 
    | { type: 'UPDATE_PHYSICS', payload: { gravity?: { x: number, y: number, z: number }, timeScale?: number } }
    | { type: 'SPAWN_VOXEL', payload: { x: number, y: number, z: number, color: string } }
    | { type: 'NAVIGATE', payload: { screen: string } }
    | { type: 'RESTART', payload: Record<string, never> };

/**
 * MODULE X: THE EDGE ROUTER (FunctionGemma Protocol)
 * Objective: Reduce latency by handling simple intents locally.
 */
export async function routeIntentLocally(input: string): Promise<LocalTool | null> {
    const text = input.toLowerCase();

    // STRICT GUARD: If user mentions objects or complex simulations, bypass local routing
    if (text.includes('car') || text.includes('bomb') || text.includes('bridge') || 
        text.includes('simulate') || text.includes('build') || text.includes('make')) {
        return null;
    }

    // Heuristic-based routing (Local FunctionGemma emulation)
    if (text.includes('gravity') || text.includes('weightless') || text.includes('heavy')) {
        const gravity = { x: 0, y: -9.81, z: 0 };
        if (text.includes('zero') || text.includes('off') || text.includes('weightless')) gravity.y = 0;
        if (text.includes('moon')) gravity.y = -1.62;
        if (text.includes('mars')) gravity.y = -3.71;
        if (text.includes('jupiter')) gravity.y = -24.79;
        
        return { type: 'UPDATE_PHYSICS', payload: { gravity } };
    }

    if (text.includes('time') || text.includes('slow') || text.includes('fast')) {
        let timeScale = 1;
        if (text.includes('slow') || text.includes('matrix')) timeScale = 0.2;
        if (text.includes('fast') || text.includes('speed up')) timeScale = 2.0;
        if (text.includes('stop') || text.includes('freeze')) timeScale = 0;
        
        return { type: 'UPDATE_PHYSICS', payload: { timeScale } };
    }

    if (text.includes('restart') || text.includes('reset')) {
        return { type: 'RESTART', payload: {} };
    }

    if (text.includes('go to') || text.includes('open')) {
        if (text.includes('garden')) return { type: 'NAVIGATE', payload: { screen: 'GARDEN' } };
        if (text.includes('lab')) return { type: 'NAVIGATE', payload: { screen: 'LAB' } };
    }

    // Fallback: If intent is "Knowledge" or "Complex", return null to trigger Cloud Routing
    if (text.includes('why') || text.includes('how') || text.includes('explain') || text.includes('simulate')) {
        return null;
    }

    return null;
}

/**
 * Execute a local tool directly in the app state.
 */
export function executeLocalTool(tool: LocalTool, dispatch: (action: { type: string, payload?: any }) => void) {
    console.log(`[EdgeRouter] Executing Local Tool: ${tool.type}`, tool.payload);
    
    switch (tool.type) {
        case 'UPDATE_PHYSICS':
            blackboard.update({ currentPhysics: { ...blackboard.getContext().currentPhysics, ...tool.payload } });
            dispatch({ type: 'UPDATE_WORLD_ENVIRONMENT', payload: tool.payload });
            break;
        case 'RESTART':
            dispatch({ type: 'RESET_SIMULATION' });
            break;
        case 'NAVIGATE':
            // Logic to change UI screen
            break;
        default:
            console.warn('[EdgeRouter] Unknown tool type');
    }
}
