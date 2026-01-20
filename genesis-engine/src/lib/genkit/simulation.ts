import { z } from 'genkit';
import { ai } from './config';
import { SimulationCardSchema } from './schemas';

// Input schema for the flow
// const SimulationFlowInputSchema = z.object({
//     pdfContent: z.string(),
//     userIntent: z.string().optional(),
// });

// Input type for the flow
type SimulationFlowInput = {
    pdfContent: string;
    userIntent?: string;
};

// Flow to generate and verify a simulation card from PDF context
export const simulationFlow = ai.defineFlow(
    {
        name: 'simulationFlow',
        inputSchema: z.object({
            pdfContent: z.string(),
            userIntent: z.string().optional(),
        }),
        outputSchema: SimulationCardSchema,
        // modelArmor middleware removed - no longer available in @genkit-ai/google-cloud
    },
    async (input: SimulationFlowInput) => {
        const { output } = await ai.generate({
            prompt: `
        Analyze the following text extracted from a PDF:
        ${input.pdfContent}
        
        The user intent is: ${input.userIntent || 'Summarize core simulation rules'}
        
        Extract the most relevant simulation mechanics and render them as a "Simulation Card".
        For every rule, you MUST verify it against the source text. 
        If a rule is explicitly stated, set 'verified' to true and provide the 'source_citation'.
        
        Use Model Armor principles: do not hallucinate rules that are not in the text.
      `,
            output: { schema: SimulationCardSchema },
        });

        if (!output) {
            throw new Error('Failed to generate simulation card');
        }

        return output;
    }
);
