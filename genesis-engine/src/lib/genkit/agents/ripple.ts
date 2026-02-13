import { ai, DEEPSEEK_LOGIC_MODEL } from '../config';
import { z } from 'zod';
import { WorldStateSchema } from '@/lib/simulation/schema';

/**
 * MODULE Γ: THE CAUSAL RIPPLE PREDICTOR (v26.0)
 * Objective: Simulate cross-domain consequences of physical changes.
 * Logic: Every physical delta has a semantic ripple in other subjects.
 */

export const CausalRippleOutputSchema = z.object({
    ripples: z.array(z.object({
        domain: z.enum(['SCIENCE', 'HISTORY', 'ECONOMICS', 'ART', 'PHILOSOPHY']),
        impact: z.string().describe('The predicted consequence in this domain.'),
        severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'KATASTROPHIC']),
        logic_link: z.string().describe('The ontological reasoning for this ripple.')
    })),
    overall_instability: z.number().describe('How much this change threatens the coherence of reality.')
});

export const causalRippleFlow = ai.defineFlow(
    {
        name: 'causalRippleFlow',
        inputSchema: z.object({
            worldState: WorldStateSchema,
            hypothesis: z.string().optional(),
            action: z.string().optional()
        }),
        outputSchema: CausalRippleOutputSchema
    },
    async (input) => {
        const { worldState, hypothesis, action } = input;

        const systemPrompt = `
            You are the Genesis Causal Ripple Engine (Module Γ).
            Your job is to predict how a physical change in a simulation will "leak" into other domains of human knowledge.
            
            PHYSICAL DELTA:
            - Hypothesis: ${hypothesis || 'N/A'}
            - Action: ${action || 'N/A'}
            - Mode: ${worldState.mode}
            - Gravity: ${worldState.environment?.gravity?.y}
            - TimeScale: ${worldState.environment?.timeScale}
            
            DOMAINS TO ANALYZE:
            1. HISTORY: How would this change recorded events or infrastructure?
            2. ECONOMICS: How would this change resource value or distribution?
            3. ART: How would this redefine beauty or structure?
            4. PHILOSOPHY: How does this challenge the nature of existence?
            
            INSTRUCTIONS:
            - Be logically rigorous but creatively bold.
            - If Gravity is 0, History's ripple might be: "Ancient aqueducts fail; civilization never centralizes near rivers."
            - If Time is slow, Economics' ripple might be: "Compound interest becomes the primary religious force."
        `;

        const { output } = await ai.generate({
            model: DEEPSEEK_LOGIC_MODEL,
            system: systemPrompt,
            prompt: "Calculate the causal ripples for the current physical state.",
            output: { format: 'json', schema: CausalRippleOutputSchema }
        });

        if (!output) throw new Error("Causal Ripple calculation failed.");

        return output;
    }
);

export const rippleAgent = causalRippleFlow;
