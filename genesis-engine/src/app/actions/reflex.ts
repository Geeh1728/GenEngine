'use server';

import { executeApexLoop } from '@/lib/genkit/resilience';
import { ai, OPENROUTER_FREE_MODELS } from '@/lib/genkit/config';
import { z } from 'genkit';

export async function predictIntentionalTrajectory(name: string, shape: string, vx: number, vy: number) {
    try {
        const reflex = await executeApexLoop({
            task: 'REFLEX',
            prompt: `Entity "${name}" (${shape}) is moving at velocity [${vx.toFixed(2)}, ${vy.toFixed(2)}]. Predict the next likely position based on common physical behaviors (e.g. parabolas, circular orbits, or linear drift). Return JSON { x, y, z }.`,
            schema: z.object({ x: z.number(), y: z.number(), z: z.number() }),
            onLog: () => {} 
        });

        return { success: true, prediction: reflex.output };
    } catch (error) {
        console.error("[Reflex Action] Failed:", error);
        return { success: false, error: String(error) };
    }
}

export async function routeIntentViaAI(input: string) {
    const ReflexSchema = z.object({
        tool: z.enum(['UPDATE_PHYSICS', 'SPAWN_VOXEL', 'NAVIGATE', 'RESTART', 'UNKNOWN']),
        payload: z.any()
    });

    try {
        const reflex = await ai.generate({
            model: OPENROUTER_FREE_MODELS.REFLEX, 
            prompt: `You are the OS Reflex. Map user intent to a tool.
            Input: "${input}"
            Tools: UPDATE_PHYSICS (gravity/time), RESTART, NAVIGATE.
            If unclear, return UNKNOWN.
            Return JSON.`,
            output: { schema: ReflexSchema }
        });

        return { success: true, reflex: reflex.output };
    } catch (error) {
        console.error("[Reflex Router] Failed:", error);
        return { success: false, error: String(error) };
    }
}