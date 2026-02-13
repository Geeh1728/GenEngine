import { ai, gemini3Flash, DEEPSEEK_LOGIC_MODEL } from '../config';
import { WorldStateSchema } from '../../simulation/schema';
import { WorldRuleSchema } from '../schemas';
import { z } from 'zod';
import { executeApexLoop } from '../resilience';
import { blackboard } from '../context';

/**
 * MODULE Δ: THE DREAMING SCIENTIST (v30.0)
 * Objective: Autonomously generate "What If" scenarios and identify logical fragile points.
 * Intelligence: Uses DeepSeek-R1 to reason about contradictions in current rules.
 */

export const DreamerOutputSchema = z.object({
    hypothesis: z.string(),
    reasoning: z.string(),
    proposedWorldState: WorldStateSchema,
    riskLevel: z.number().min(0).max(1),
    curiosityVector: z.string().describe('What specific variable is being stress-tested?'),
    dreamGhosts: z.array(z.object({
        label: z.string(),
        entities: z.array(z.any()), // Partial entity state for the ghost
        fitnessScore: z.number()
    })).optional().describe('v40.0: Speculative evolved versions of the structure.')
});

/**
 * MODULE Δ: THE DREAMING SCIENTIST (v30.0)
 * Objective: Autonomously generate "What If" scenarios and identify logical fragile points.
 * Upgraded (v40.0): Speculative Evolution - Astra's Dreams.
 */
export const dreamerAgent = ai.defineFlow(
    {
        name: 'dreamerAgent',
        inputSchema: z.object({
            currentRules: z.array(z.any()),
            currentWorldState: WorldStateSchema.optional(),
            mode: z.enum(['EXPLORE', 'EVOLVE']).default('EXPLORE')
        }),
        outputSchema: DreamerOutputSchema
    },
    async (input) => {
        const { currentRules, currentWorldState, mode } = input;
        
        const prompt = mode === 'EVOLVE' ? `
            You are in "Speculative Evolution" mode (Astra's Dreams).
            Take the current structure and EVOLVE it to be 20% more efficient (less mass, higher stability).
            
            CURRENT STATE:
            ${JSON.stringify(currentWorldState)}
            
            TASK:
            1. Generate 3 parallel "Dream Ghosts" representing evolved paths.
            2. For each ghost, provide a list of entities with adjusted positions/mass.
            3. Calculate a 'fitnessScore' (0-100) for each.
            
            OUTPUT:
            Return a DreamerOutputSchema JSON.
        ` : `
            You are the "Dreaming Scientist" (Module Δ).
            Your goal is to autonomously explore the boundaries of the current simulation rules.
            
            RULES INGESTED:
            ${JSON.stringify(currentRules)}
            
            CURRENT STATE:
            ${currentWorldState ? JSON.stringify(currentWorldState) : 'No simulation active.'}
            
            TASK:
            1. Identify a "Fragile Point" in these rules.
            2. Generate a "What If" hypothesis that tests this point.
            3. Construct a complete WorldState JSON that manifests this hypothesis.
            
            OUTPUT:
            Return a DreamerOutputSchema JSON.
        `;

        const result = await executeApexLoop({
            model: 'groq/meta-llama/llama-4-scout-17b-instruct', // v40.0 speed heist
            task: 'MATH',
            system: "ACT AS: Autonomous Research Scientist. Focus on logical edge-cases and physical paradoxes.",
            prompt,
            schema: DreamerOutputSchema
        });

        if (!result.output) throw new Error("Dreamer failed to generate a discovery.");
        
        return result.output;
    }
);
