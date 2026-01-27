import { ai, geminiFlash } from '../config';
import { z } from 'genkit';
import { blackboard } from '../context';

export const ResearcherInputSchema = z.object({
    topic: z.string(),
    context: z.string().optional(),
});

export const ResearcherOutputSchema = z.object({
    summary: z.string().describe('Summary of the research findings.'),
    constants: z.record(z.string(), z.number()).optional().describe('Extracted raw physical values or constants.'),
    citations: z.array(z.object({
        title: z.string(),
        url: z.string(),
    })).describe('Sources used for grounding.'),
});

/**
 * THE RESEARCH AGENT (Module W)
 * Objective: Open-World Grounding via Google Search.
 * Fetches real-time data or specialized constants not found in the local KB.
 */
export const researcherFlow = ai.defineFlow(
    {
        name: 'researcherFlow',
        inputSchema: ResearcherInputSchema,
        outputSchema: ResearcherOutputSchema,
    },
    async (input) => {
        const { topic, context } = input;
        const blackboardFragment = blackboard.getSystemPromptFragment();

        blackboard.log('Researcher', `Initializing deep research for: "${topic}"`, 'THINKING');

        const systemPrompt = `
            You are the Genesis Research Agent.
            Your role is to find real-time, verified physical data to ground simulations.
            
            ${blackboardFragment}

            INSTRUCTIONS:
            1. If the user topic requires real-time data or specialized constants (e.g., current orbital positions, specific chemical densities, current weather), browse the web to find the source.
            2. Extract RAW numerical values whenever possible.
            3. Provide citations for every piece of data.
            4. If the data is already in the provided context, summarize it but still verify if it seems outdated.
        `;

        try {
            const response = await ai.generate({
                model: geminiFlash.name,
                system: systemPrompt,
                prompt: `Research the following topic for physical constants and real-world grounding: "${topic}"\n\nContext: ${context || 'None'}`,
                config: {
                    googleSearchRetrieval: true
                },
                output: { schema: ResearcherOutputSchema }
            });

            if (!response.output) throw new Error("Researcher failed to generate output.");

            blackboard.log('Researcher', `Research complete. Found ${response.output.citations.length} sources.`, 'SUCCESS');

            // Update Blackboard with research findings
            blackboard.update({
                researchFindings: response.output.summary,
                externalConstants: response.output.constants
            });

            return response.output;
        } catch (error) {
            console.error("Researcher Agent Failed:", error);
            blackboard.log('Researcher', `Research failed: ${error instanceof Error ? error.message : String(error)}`, 'ERROR');
            return {
                summary: "Research phase failed or was inconclusive.",
                citations: []
            };
        }
    }
);

export const researcherAgent = researcherFlow;