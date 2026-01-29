import { ai, BRAIN_PRIMARY } from '../config';
import { z } from 'genkit';
import { executeApexLoop } from '../resilience';
import { StructuralHeatmapSchema } from '../schemas';

export const SentinelInputSchema = z.object({
    canvasSnapshot: z.string().describe('Base64 image of the current Three.js canvas'),
    sceneState: z.string().describe('Textual summary of entities and positions'),
});

/**
 * Module Ω: The Visual Sentinel (Agentic Vision)
 * Objective: Proactive critique of user constructions using spatial reasoning.
 */
export const sentinelAgent = ai.defineFlow(
    {
        name: 'sentinelAgent',
        inputSchema: SentinelInputSchema,
        outputSchema: StructuralHeatmapSchema,
    },
    async (input) => {
        const result = await executeApexLoop({
            model: BRAIN_PRIMARY.name,
            prompt: [
                { text: `Observe this simulation construction. Scene Data: ${input.sceneState}` },
                { media: { url: input.canvasSnapshot, contentType: 'image/jpeg' } }
            ],
            system: `
                You are the "Visual Sentinel" of the Genesis Engine.
                Your role is to predict structural failures before the simulation runs.
                
                TASK:
                1. Analyze the visual arrangement and the provided Scene Data.
                2. Identify points where gravity or force will likely cause a collapse or collision.
                3. Return a 'StructuralHeatmap' with [x, y, z] coordinates of danger zones.
                4. Provide a 'severity' (0-1) for each point.
                5. Provide one sentence of 'remediationAdvice' to help the student improve the build.
            `,
            schema: StructuralHeatmapSchema,
            task: 'VISION'
        });

        if (!result.output) throw new Error('Sentinel failed to process visual stream.');
        return result.output;
    }
);
