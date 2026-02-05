import { ai, BRAIN_PRIMARY } from '../config';
import { MODELS } from '../models';
import { z } from 'genkit';
import { executeApexLoop } from '../resilience';
import { StructuralHeatmapSchema } from '../schemas';
import { updateRegisteredModel } from '../../db/pglite';
import { blackboard } from '../context';

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
            task: 'VISION',
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
            schema: StructuralHeatmapSchema
        });

        if (!result.output) throw new Error('Sentinel failed to process visual stream.');
        return result.output;
    }
);

export const SentinelRepairInputSchema = z.object({
    failedModelAlias: z.string(),
    errorType: z.string(),
});

export const SentinelRepairOutputSchema = z.object({
    newModelString: z.string().describe('The corrected Google AI model identifier'),
    patchNotes: z.string().describe('Explanation of the change')
});

/**
 * MODULE S-H: THE SENTINEL (Self-Healing)
 * Objective: Deep Search for updated model names when an API break occurs.
 */
export const sentinelRepairAgent = ai.defineFlow(
    {
        name: 'sentinelRepairAgent',
        inputSchema: SentinelRepairInputSchema,
        outputSchema: SentinelRepairOutputSchema,
    },
    async (input) => {
        blackboard.log('Sentinel', `Detecting API Drift for ${input.failedModelAlias}...`, 'THINKING');

        const result = await executeApexLoop({
            task: 'INGEST', 
            prompt: `
                The Genesis Engine encountered an error: "${input.errorType}" while calling ${input.failedModelAlias}.
                Use Google Search to find the latest valid model identifier for Google Gemini in 2026.
                
                The previously used name was similar to: "${input.failedModelAlias}".
                Look for: "googleai/gemini-3-flash", "gemini-4-ultra", etc.
            `,
            system: "You are the Genesis Sentinel. Your mission is to fix broken API links by finding the latest model names.",
            config: { googleSearchRetrieval: true },
            schema: SentinelRepairOutputSchema
        });

        if (result.output) {
            // Persist the patch to PGLite
            await updateRegisteredModel(input.failedModelAlias, result.output.newModelString);
            blackboard.log('Sentinel', `System Patched: ${input.failedModelAlias} -> ${result.output.newModelString}`, 'SUCCESS');
            return result.output;
        }

        throw new Error("Sentinel failed to find a valid patch.");
    }
);
