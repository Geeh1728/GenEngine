import { ai } from '@/lib/genkit/config';
import { MODELS } from '@/lib/genkit/models';
import { z } from 'genkit';
import { Entity } from './schema';

/**
 * MODULE S-E: REFLEX PREDICTOR (Module Speculative-Entities)
 * Objective: Predict future user actions/states using Groq LPU speed (<100ms).
 * Strategy: Speculative Execution for Reality.
 */

const PredictionSchema = z.object({
    predictions: z.array(z.object({
        label: z.string().describe('Short description of the predicted state'),
        confidence: z.number().min(0).max(1),
        probability: z.number().min(0).max(1).describe('The LPU-predicted probability of this state'),
        entities: z.array(z.any()).describe('Partial entity updates for the ghost state')
    })).max(10).describe('Up to 10 speculative future states')
});

export type SpeculativeGhost = z.infer<typeof PredictionSchema>['predictions'][0];

let lastPredictionTime = 0;
const PREDICTION_INTERVAL = 150; // v40.0: Overclocked to 6.6Hz

export async function predictNextStates(
    userAction: string,
    currentEntities: Entity[],
    focusEntityId?: string
): Promise<SpeculativeGhost[] | null> {
    const now = Date.now();
    if (now - lastPredictionTime < PREDICTION_INTERVAL) return null;
    lastPredictionTime = now;

    // v35.0: NEURAL HEGEMONY - Increased context window for LPU
    const contextEntities = focusEntityId 
        ? currentEntities.filter(e => e.id === focusEntityId || e.physics.isStatic === false).slice(0, 10)
        : currentEntities.filter(e => !e.physics.isStatic).slice(0, 10);

    try {
        const result = await ai.generate({
            model: MODELS.GROQ_LLAMA_4_SCOUT, // <100ms Inference
            prompt: `
                ACT AS: Causal Oracle (Module C-F).
                TASK: Run a 120-step high-fidelity physics look-ahead based on the user's current trajectory.
                
                USER ACTION: "${userAction}"
                FOCUS ENTITY: ${focusEntityId || 'None'}
                CURRENT STATE: ${JSON.stringify(contextEntities.map(e => ({ id: e.id, pos: e.position, vel: e.physics.velocity })))}
                
                MISSION:
                1. Predict up to 10 'Branching Futures' (~2 seconds ahead).
                2. Identify if the current action leads to a 'COLLAPSE', 'STABILITY', or 'ANOMALY'.
                3. For each branch, provide updated 'entities' positions and rotations.
                4. For each branch, include a 'probability' score (0.0 to 1.0).
                
                OUTPUT:
                Return JSON only matching PredictionSchema.
            `,
            output: { schema: PredictionSchema }
        });

        if (!result.output) return null;

        // v40.0: CERTAINTY THRESHOLD (The Titan Risk Mitigation)
        // Only show ghosts if prediction is extremely likely (>0.85)
        const validPredictions = result.output.predictions.filter(p => p.probability > 0.85);
        
        if (validPredictions.length > 0) {
            // v40.0 TELEMETRY: Notify UI of speculative mode
            import('../genkit/context').then(({ blackboard }) => {
                blackboard.update({ speculativeModeActive: true });
            });
            return validPredictions;
        } else {
            import('../genkit/context').then(({ blackboard }) => {
                blackboard.update({ speculativeModeActive: false });
            });
            return null;
        }

    } catch (error) {
        console.warn("[ReflexPredictor] Speculation failed:", error);
        return null;
    }
}
