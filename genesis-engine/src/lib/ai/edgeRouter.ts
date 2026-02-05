import { blackboard } from '../genkit/context';
import { routeIntentViaAI } from '@/app/actions/reflex';

export type LocalTool = 
    | { type: 'UPDATE_PHYSICS', payload: { gravity?: { x: number, y: number, z: number }, timeScale?: number } }
    | { type: 'SPAWN_VOXEL', payload: { x: number, y: number, z: number, color: string } }
    | { type: 'NAVIGATE', payload: { screen: string } }
    | { type: 'RESTART', payload: Record<string, never> };

/**
 * MODULE X: THE EDGE ROUTER (Apex Swarm v8.0)
 * Objective: Reduce latency by handling simple intents via Gemma 3n (Mobile Reflex).
 */
export async function routeIntentLocally(input: string): Promise<LocalTool | null> {
    const text = input.toLowerCase();

    // STRICT GUARD: If user mentions objects or complex simulations, bypass local routing
    if (text.includes('car') || text.includes('bomb') || text.includes('bridge') || 
        text.includes('simulate') || text.includes('build') || text.includes('make')) {
        return null;
    }

    // TIER 0: Regex Heuristic (Zero Latency)
    if (/\bgravity\b|\bweightless\b|\bheavy\b/i.test(text)) {
        const gravity = { x: 0, y: -9.81, z: 0 };
        if (/\bzero\b|\boff\b|\bweightless\b/i.test(text)) gravity.y = 0;
        if (/\bmoon\b/i.test(text)) gravity.y = -1.62;
        if (/\bmars\b/i.test(text)) gravity.y = -3.71;
        if (/\bjupiter\b/i.test(text)) gravity.y = -24.79;
        if (/\bheavy\b|\bhigh\b/i.test(text)) gravity.y = -50;
        
        return { type: 'UPDATE_PHYSICS', payload: { gravity } };
    }

    if (/\btime\b|\bslow\b|\bfast\b|\bfreeze\b/i.test(text)) {
        let timeScale = 1;
        if (/\bslow\b|\bmatrix\b/i.test(text)) timeScale = 0.2;
        if (/\bfast\b|\bspeed up\b/i.test(text)) timeScale = 2.0;
        if (/\bstop\b|\bfreeze\b/i.test(text)) timeScale = 0;
        
        return { type: 'UPDATE_PHYSICS', payload: { timeScale } };
    }

    if (/\brestart\b|\breset\b|\bclear\b/i.test(text)) {
        return { type: 'RESTART', payload: {} };
    }

    if (text.includes('go to') || text.includes('open')) {
        if (text.includes('garden')) return { type: 'NAVIGATE', payload: { screen: 'GARDEN' } };
        if (text.includes('lab')) return { type: 'NAVIGATE', payload: { screen: 'LAB' } };
    }

    // TIER 1: Gemma 3n Reflex (Mobile Edge Model) - Server Action
    if (text.split(' ').length < 10 && !text.includes('why')) {
        blackboard.log('EdgeRouter', '🤖 Gemma 3n is checking reflexes...', 'THINKING');
        try {
            const result = await routeIntentViaAI(input);

            if (result.success && result.reflex && result.reflex.tool !== 'UNKNOWN') {
                blackboard.log('EdgeRouter', `Gemma 3n Reflex Triggered: ${result.reflex.tool}`, 'SUCCESS');
                return { type: result.reflex.tool as any, payload: result.reflex.payload };
            }
        } catch (e) {
            console.warn("Gemma Reflex failed, falling back to cloud.", e);
        }
    }

    // Fallback
    if (text.includes('why') || text.includes('how') || text.includes('explain') || text.includes('simulate')) {
        return null;
    }

    return null;
}

/**
 * Execute a local tool directly in the app state.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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