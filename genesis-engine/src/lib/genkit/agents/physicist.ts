import { ai, gemini3Flash, geminiFlash, DEEPSEEK_LOGIC_MODEL } from '../config';
import { WorldStateSchema } from '../../simulation/schema';
import { z } from 'genkit';
import { generateWithResilience } from '../resilience';

export const PhysicistInputSchema = z.object({
    userTopic: z.string().optional().describe('User input for general query'),
    nodeContext: z.string().optional().describe('Context from a Skill Tree node'),
    context: z.string().optional().default('Standard Earth physics.'),
    isSabotageMode: z.boolean().optional().default(false),
    requireDeepLogic: z.boolean().optional().default(false),
});

/**
 * Module B: The Kinetic Core (Physicist)
 * Objective: Translate Natural Language into Rapier Physics Parameters.
 * 100% Potential: Routes to DeepSeek-R1 for complex math derivation.
 */
export const physicistFlow = ai.defineFlow(
    {
        name: 'physicistFlow',
        inputSchema: PhysicistInputSchema,
        outputSchema: WorldStateSchema,
    },
    async (input) => {
        const { userTopic, nodeContext, context, isSabotageMode, requireDeepLogic } = input;
        const topic = nodeContext || userTopic || "Physics Sandbox";

        // Logic Routing: If it's complex math, use DeepSeek-R1
        const isComplexMath = requireDeepLogic || 
            topic.toLowerCase().includes('derive') || 
            topic.toLowerCase().includes('formula') || 
            topic.toLowerCase().includes('calculate');

        const systemPrompt = `
                You are the Physicist Agent (KINETIC CORE) of the Genesis Engine.
                Your goal is to compile a user's idea into a valid JSON WorldState for a Rapier physics engine.
                
                RULES:
                1. **The "Dumb God" Rule:** You must OBEY the user's hypothesis exactly, even if it violates real-world physics. 
                2. **Context Grounding:** Use the provided 'context' to fill in physical constants.
                3. **Scientific Mode:** If the user mentions "Pendulum", "Orbit", "Chaos", or "Double Pendulum", switch 'mode' to 'SCIENTIFIC'.
                4. **PHASE CHANGE ENGINE:** If the user mentions "Boil", "Melt", "Freeze", "Heating Curve", or a specific substance (e.g., "Water", "Gold", "Nitrogen"), switch 'mode' to 'SCIENTIFIC' and set 'scenario' to 'PHASE_CHANGE'.
                   - Populating 'scientificParams' with: { substance, boilingPoint, meltingPoint, liquidColor, gasColor, initialTemp }.
                   - Lookup real-world values for these constants based on the substance.
                5. **MATH VERIFICATION:** You have access to a Python interpreter. If the user's goal involves trajectories, complex forces, or derivation, you MUST use Python to calculate the exact values before populating the WorldState JSON.
                5. **MODULE P-2: THE PYTHON ENGINE:**
                   - Write Python code in the 'python_code' field to show your work.
        `;

        if (isComplexMath) {
            try {
                const response = await ai.generate({
                    model: DEEPSEEK_LOGIC_MODEL,
                    system: systemPrompt,
                    prompt: `Derive the physical parameters for: ${topic}\nContext: ${context}`,
                    output: { schema: WorldStateSchema },
                    // @ts-expect-error - Assuming the underlying provider supports it
                    tools: [{ code_execution: {} }]
                });
                if (response.output) return response.output;
            } catch (error) {
                console.error("DeepSeek Logic Failed, falling back to Gemini:", error);
            }
        }

        const output = await generateWithResilience({
            prompt: `
                CONTEXT (Scientific Truths):
                ${context}

                USER HYPOTHESIS/GOAL:
                "${topic}"

                INSTRUCTIONS:
                Create a simulation for '${topic}'. 
            `,
            system: systemPrompt,
            schema: WorldStateSchema,
            retryCount: 2,
            // @ts-expect-error - Enabling code execution tool for Gemini
            tools: [{ code_execution: {} }]
        });

        if (!output) throw new Error('Physicist failed to generate world state.');
        return output;
    }
);

export const physicistAgent = physicistFlow; // Backward compatibility
