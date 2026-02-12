import { Entity } from './schema';
import { predictNextStatesAction } from '@/app/actions/reflex';
import { blackboard } from '../genkit/context';

/**
 * MODULE S-E: REFLEX PREDICTOR (Module Speculative-Entities)
 * Objective: Predict future user actions/states using Groq LPU speed (<100ms).
 * Strategy: Speculative Execution for Reality.
 */

export interface SpeculativeGhost {
    label: string;
    confidence: number;
    probability: number;
    entities: any[];
}

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

    try {
        const result = await predictNextStatesAction(userAction, currentEntities, focusEntityId);

        if (!result.success || !result.predictions) {
            blackboard.update({ speculativeModeActive: false });
            return null;
        }

        // v40.0: CERTAINTY THRESHOLD (The Titan Risk Mitigation)
        // Only show ghosts if prediction is extremely likely (>0.85)
        const validPredictions = result.predictions.filter((p: any) => p.probability > 0.85);
        
        if (validPredictions.length > 0) {
            blackboard.update({ speculativeModeActive: true });
            return validPredictions;
        } else {
            blackboard.update({ speculativeModeActive: false });
            return null;
        }

    } catch (error) {
        console.warn("[ReflexPredictor] Speculation failed:", error);
        return null;
    }
}
