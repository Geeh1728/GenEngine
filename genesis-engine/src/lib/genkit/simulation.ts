import { z } from 'genkit';
import { ai } from './config';
import { SimulationCardSchema } from './schemas';
import { executeApexLoop } from './resilience';

// Input type for the flow
type SimulationFlowInput = {
    pdfContent: string;
    userIntent?: string;
};

/**
 * THE SIMULATION CARD ENGINE (v11.0 Platinum Swarm)
 * Objective: Extract actionable simulation rules from source text.
 */
export const simulationFlow = ai.defineFlow(
    {
        name: 'simulationFlow',
        inputSchema: z.object({
            pdfContent: z.string(),
            userIntent: z.string().optional(),
        }),
        outputSchema: SimulationCardSchema,
    },
    async (input: SimulationFlowInput) => {
        const result = await executeApexLoop({
            task: 'INGEST',
            prompt: `
                Analyze the following text extracted from a PDF:
                ${input.pdfContent}
                
                The user intent is: ${input.userIntent || 'Summarize core simulation rules'}
                
                Extract the most relevant simulation mechanics and render them as a "Simulation Card".
                For every rule, you MUST verify it against the source text. 
                If a rule is explicitly stated, set 'verified' to true and provide the 'source_citation'.
                
                Use Model Armor principles: do not hallucinate rules that are not in the text.
            `,
            schema: SimulationCardSchema,
            fallback: {
                title: "Reality Link Active",
                description: "The source material is being indexed. Stand by for rule extraction.",
                rules: [],
                actions: ["Index Material"]
            }
        });

        if (!result.output) {
            throw new Error('Failed to generate simulation card');
        }

        return result.output;
    }
);
