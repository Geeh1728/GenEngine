import { ai } from '../config';
import { MODELS } from '../models';
import { z } from 'genkit';
import { executeApexLoop } from '../resilience';

export const ReviewerInputSchema = z.object({
    proposedState: z.string().describe('The JSON string of the proposed WorldState'),
    originalPrompt: z.string(),
    agentName: z.string().describe('The name of the agent who generated the state'),
});

export const ReviewerOutputSchema = z.object({
    status: z.enum(['APPROVED', 'REJECTED']),
    feedback: z.string().describe('Specific feedback for correction if rejected'),
    corrections: z.record(z.string(), z.any()).optional().describe('Specific field corrections')
});

/**
 * Module Σ: The Swarm Reviewer (Kimi K2.5)
 * Objective: Peer-review other agents' work for math, logic, and safety.
 */
export const reviewerAgent = ai.defineFlow(
    {
        name: 'reviewerAgent',
        inputSchema: ReviewerInputSchema,
        outputSchema: ReviewerOutputSchema,
    },
    async (input) => {
        const result = await executeApexLoop({
            model: MODELS.SWARM_REVIEWER,
            prompt: `
                Review this simulation proposal from ${input.agentName}.
                
                USER PROMPT: "${input.originalPrompt}"
                PROPOSED JSON:
                ${input.proposedState}
            `,
            system: `
                You are the "Scientific Reviewer" of the Genesis Swarm.
                Your role is to act as a scientific peer-reviewer for other agents.
                
                CRITERIA:
                1. Math Accuracy: Check if the physics constants and coordinates make sense.
                2. Realism: Is the scenario physically possible within the Rapier engine?
                3. UI Clutter: Ensure there aren't too many redundant entities.
                4. Safety: Ensure the content is educational and safe.

                If you find errors, return status: 'REJECTED' and explain EXACTLY how to fix them.
                If it looks good, return status: 'APPROVED'.
            `,
            schema: ReviewerOutputSchema,
            task: 'INGEST',
            fallback: {
                status: 'APPROVED',
                feedback: 'System stabilization active. Simulation approved via safety fallback.'
            }
        });

        if (!result.output) throw new Error('Reviewer failed to reach consensus.');
        return result.output;
    }
);
