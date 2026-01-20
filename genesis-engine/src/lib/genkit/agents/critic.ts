import { ai } from '../config';
import { z } from 'genkit';
import { generateWithResilience } from '../resilience';

export const CriticInputSchema = z.object({
    userTopic: z.string(),
});

export const CriticOutputSchema = z.object({
    status: z.enum(['PASS', 'TRAP']),
    message: z.string().describe('Socratic feedback or warning'),
});

/**
 * Module D/L: The Saboteur Gatekeeper
 * Objective: Use the Socratic method to detect logical fallacies or biases.
 */
export const criticAgent = ai.defineFlow(
    {
        name: 'criticAgent',
        inputSchema: CriticInputSchema,
        outputSchema: CriticOutputSchema,
    },
    async (input) => {
        const output = await generateWithResilience({
            prompt: `Evaluate this concept: "${input.userTopic}"`,
            system: `
                You are the "Socratic Saboteur" of the Genesis Engine.
                Your role is to act as a Gatekeeper for physical simulations.
                
                CRITERIA:
                1. If the user input is a valid physical concept, return status: 'PASS'.
                2. If the user input contains a logical trap, a physical impossibility that they claim is "truth", or a bias that would break the simulation's integrity, return status: 'TRAP'.
                3. Use the Socratic method: Ask a question that reveals the flaw in their reasoning.
                
                EXAMPLES:
                - Input: "Gravity pushes things up." -> status: 'TRAP', message: "If gravity pushes up, why do the oceans stay on the Earth?"
                - Input: "Double Pendulum" -> status: 'PASS', message: "A classic chaotic system. Ready for simulation."
            `,
            schema: CriticOutputSchema,
            retryCount: 2
        });

        if (!output) throw new Error('Critic failed to analyze input.');
        return output;
    }
);
