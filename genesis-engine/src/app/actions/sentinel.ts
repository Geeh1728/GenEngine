'use server';

import { executeApexLoop } from '@/lib/genkit/resilience';
import { z } from 'genkit';
import { visualCortexFlow } from '@/lib/genkit/agents/visualCortex';

export async function runNeuralRCA(history: any[]) {
    try {
        const rca = await executeApexLoop({
            task: 'MATH',
            prompt: `ANALYZE PHYSICS FAILURE: Here is the history of the last 5 frames: 
            ${JSON.stringify(history)}
            Explain why the simulation exploded or clipped. Identify the exact entity ID and parameter (e.g. Mass, Restitution).`,
            schema: z.object({
                reason: z.string(),
                failedEntityId: z.string(),
                mitigation: z.string()
            })
        });

        return { success: true, analysis: rca.output };
    } catch (error) {
        console.error("[Sentinel RCA] Failed:", error);
        return { success: false, error: String(error) };
    }
}

export async function analyzeStructuralIntegrity(imageBase64: string, context?: string) {
    try {
        // Strip data:image/png;base64, prefix if present
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        
        const result = await visualCortexFlow({
            imageBase64: base64Data,
            context
        });

        return { success: true, data: result };
    } catch (error) {
        console.error("Structural Analysis Error:", error);
        return { success: false, error: "Failed to analyze structure." };
    }
}