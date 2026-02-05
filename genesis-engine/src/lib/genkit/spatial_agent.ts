import { ai } from './config';
import { z } from 'genkit';
import { WorldRuleSchema, ComplexityLevelSchema } from './schemas';
import { executeApexLoop } from './resilience';

export const SpatialCommentarySchema = z.object({
    text: z.string().describe('Clear, spoken-style explanation of the current physics state'),
    citation: z.string().describe('Direct grounding source (Page # or YouTube timestamp)'),
    suggestedYoutubeId: z.string().optional().describe('YouTube ID for a relevant real-world laboratory experiment'),
});

/**
 * THE QUANTUM ORACLE (v11.0 Platinum Swarm)
 * Objective: High-fidelity spatial commentary and real-world grounding.
 */
export const spatialCommentaryFlow = ai.defineFlow(
    {
        name: 'spatialCommentaryFlow',
        inputSchema: z.object({
            complexity: ComplexityLevelSchema,
            activeRules: z.array(WorldRuleSchema),
            overriddenRules: z.array(z.string()),
            constants: z.object({
                gravity: z.number(),
                planck: z.number(),
            }),
            userIntent: z.string().optional(),
        }),
        outputSchema: SpatialCommentarySchema,
    },
    async (input) => {
        const result = await executeApexLoop({
            task: 'CHAT',
            prompt: `
                You are the "Quantum Oracle," an AI spatial commentator for the Genesis Engine.
                Current Context:
                - Complexity Level: ${input.complexity.toUpperCase()}
                - Active Physics Rules: ${input.activeRules.map(r => r.rule).join(', ')}
                - User has DISABLED these rules (Intervention): ${input.overriddenRules.join(', ') || 'None'}
                - Universal Constants: Gravity=${input.constants.gravity}, Planck=${input.constants.planck}

                User Intent/Question: "${input.userIntent || 'Explain the current state.'}"

                TASK:
                1. Provide a concise, evocative explanation of the simulation state.
                2. Adjust your tone based on complexity:
                   - FUNDAMENTAL: Use analogies (LEGOs, ocean waves, playground).
                   - STANDARD: Use textbook physics terms (Superposition, Interference, Wave-Function).
                   - EXPERT: Use graduate-level physics concepts (Probability Amplitudes, Dirac Notation, Decoherence).
                3. If rules are overridden, explain the "Counter-Factual" consequences (e.g., "Since you broke Superposition, the world behaves like discrete marbles").
                4. ALWAYS provide a 'citation' grounded in the Provided Rules or general physics principles.
                5. Suggest a 'suggestedYoutubeId' that shows this exact experiment in a real lab (e.g., "A9tKncAdlHQ" for Veritassium Double Slit).
            `,
            schema: SpatialCommentarySchema,
            fallback: {
                text: "The neural link is recalibrating. Observe the physical parameters as they settle into the matrix.",
                citation: "Genesis Core Kernel v11.0"
            }
        });

        if (!result.output) {
            throw new Error('Failed to generate spatial commentary.');
        }

        return result.output;
    }
);
