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

import { analyzeIntent } from '@/lib/security/sentinel';

export async function predictNextStatesAction(
    userAction: string,
    currentEntities: Entity[],
    focusEntityId?: string
) {
    // 1. Validation & THE SENTINEL (Iron Shield)
    const sanitizedAction = userAction.slice(0, 200);
    const intent = await analyzeIntent(sanitizedAction);
    
    if (!intent.isSafe) {
        console.warn("[ReflexAction] Sentinel intercepted malicious intent. Throttling...");
        return { success: false, error: "Reality violation detected by Sentinel." };
    }

    const validatedFocusId = focusEntityId?.match(/^[a-zA-Z0-9_-]{1,64}$/) ? focusEntityId : 'None';

    // 2. Filter context
    const contextEntities = focusEntityId 
        ? currentEntities.filter(e => e.id === focusEntityId || e.physics.isStatic === false).slice(0, 10)
        : currentEntities.filter(e => !e.physics.isStatic).slice(0, 10);

    const contextJson = JSON.stringify(contextEntities.map(e => ({ id: e.id, pos: e.position, vel: e.physics.velocity })));

    try {
        // 3. SWARM ATTESTATION (Speculative Consensus)
        // We run a fast Scout and a secondary validator if entropy is high
        const scoutResult = await ai.generate({
            model: MODELS.GROQ_LLAMA_4_SCOUT,
            system: "ACT AS: Causal Oracle. Predict futures. Return JSON matching PredictionSchema.",
            prompt: `ACTION: "${sanitizedAction}" | FOCUS: ${validatedFocusId} | STATE: ${contextJson}`,
            output: { schema: PredictionSchema }
        });

        const predictions = scoutResult.output?.predictions || [];
        
        // 4. NEURAL ENTROPY MONITORING
        // If the top prediction has low probability, escalate to a High-Reasoning model
        const topConfidence = Math.max(...predictions.map(p => p.probability), 0);
        
        if (topConfidence < 0.6 && predictions.length > 0) {
            console.log(`[ReflexAction] High Entropy (${topConfidence.toFixed(2)}). Escalating to ELITE COUNCIL...`);
            const eliteResult = await ai.generate({
                model: MODELS.BRAIN_PRO, // DeepSeek R1 / Reasoning model
                system: "ACT AS: High-Fidelity Physics Arbitrator. Resolve causal ambiguity. Return JSON matching PredictionSchema.",
                prompt: `AMBIGUITY DETECTED. SCOUT PREDICTIONS: ${JSON.stringify(predictions)} | ACTION: "${sanitizedAction}" | STATE: ${contextJson}`,
                output: { schema: PredictionSchema }
            });
            
            return { success: true, predictions: eliteResult.output?.predictions || [] };
        }

        return { success: true, predictions: predictions };

    } catch (error) {
        console.warn("[ReflexAction] Speculation failed:", error);
        return { success: false, error: "Speculative simulation failed." };
    }
}
