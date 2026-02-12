'use server';

import { ai } from '@/lib/genkit/config';
import { MODELS } from '@/lib/genkit/models';
import { z } from 'genkit';
import { Entity } from '@/lib/simulation/schema';

/**
 * MODULE S-E: REFLEX PREDICTOR (Module Speculative-Entities) - Server Side
 * Objective: Run LPU predictions on server to avoid client-side gRPC/Heavy dependencies.
 */

const PredictionSchema = z.object({
    predictions: z.array(z.object({
        label: z.string(),
        confidence: z.number().min(0).max(1),
        probability: z.number().min(0).max(1),
        entities: z.array(z.any())
    })).max(10)
});

export async function predictNextStatesAction(
    userAction: string,
    currentEntities: Entity[],
    focusEntityId?: string
) {
    // 1. Validation & Sanitization (Iron Shield)
    const sanitizedAction = userAction.slice(0, 200).replace(/["\\]/g, ''); 
    const validatedFocusId = focusEntityId?.match(/^[a-zA-Z0-9_-]{1,64}$/) ? focusEntityId : 'None';

    // Filter for relevant context to keep prompt small and fast
    const contextEntities = focusEntityId 
        ? currentEntities.filter(e => e.id === focusEntityId || e.physics.isStatic === false).slice(0, 10)
        : currentEntities.filter(e => !e.physics.isStatic).slice(0, 10);

    try {
        const result = await ai.generate({
            model: MODELS.GROQ_LLAMA_4_SCOUT, // <100ms Inference
            system: `
                ACT AS: Causal Oracle (Module C-F).
                TASK: Run a 120-step high-fidelity physics look-ahead based on the user's current trajectory.
                MISSION:
                1. Predict up to 10 'Branching Futures' (~2 seconds ahead).
                2. Identify if the current action leads to a 'COLLAPSE', 'STABILITY', or 'ANOMALY'.
                3. For each branch, provide updated 'entities' positions and rotations.
                4. For each branch, include a 'probability' score (0.0 to 1.0).
                OUTPUT: Return JSON only matching PredictionSchema.
            `,
            prompt: `
                USER ACTION: "${sanitizedAction}"
                FOCUS ENTITY: ${validatedFocusId}
                CURRENT STATE: ${JSON.stringify(contextEntities.map(e => ({ id: e.id, pos: e.position, vel: e.physics.velocity })))}
            `,
            output: { schema: PredictionSchema }
        });

        return { success: true, predictions: result.output?.predictions || [] };

    } catch (error) {
        console.warn("[ReflexAction] Speculation failed:", error);
        // Do not return raw error strings to client to prevent info leakage
        return { success: false, error: "Speculative simulation failed. Please try again." };
    }
}
