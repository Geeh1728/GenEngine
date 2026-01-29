import { ai, geminiFlash, BRAIN_REFLEX } from '../config';
import { z } from 'genkit';
import { blackboard } from '../context';

export const ResearcherInputSchema = z.object({
    topic: z.string(),
    context: z.string().optional(),
    depth: z.number().default(1).describe('Current recursion depth'),
});

export const ResearcherOutputSchema = z.object({
    summary: z.string().describe('Summary of the research findings.'),
    constants: z.record(z.string(), z.number()).optional().describe('Extracted raw physical values or constants.'),
    citations: z.array(z.object({
        title: z.string(),
        url: z.string(),
    })).describe('Sources used for grounding.'),
    followUpQueries: z.array(z.string()).optional().describe('Queries for deeper research if needed'),
});

/**
 * THE RESEARCH AGENT (Module W+)
 * Objective: Recursive Open-World Grounding via Google Search.
 */
async function runRecursiveSearch(topic: string, context: string | undefined, depth: number): Promise<z.infer<typeof ResearcherOutputSchema>> {
    const blackboardFragment = blackboard.getSystemPromptFragment();
    blackboard.log('Researcher', `Initializing research (Depth ${depth}/3) for: "${topic}"`, 'THINKING');

    const systemPrompt = `
        You are the Genesis Research Agent.
        Your role is to find real-time, verified physical data to ground simulations.
        
        ${blackboardFragment}

        INSTRUCTIONS:
        1. Find specialized constants (e.g., soil density, orbital speed).
        2. Extract RAW numerical values.
        3. If the results are vague or missing specific numbers, provide 3 'followUpQueries' to narrow the search.
    `;

    const response = await ai.generate({
        model: geminiFlash.name,
        system: systemPrompt,
        prompt: `Research topic: "${topic}"\nContext: ${context || 'None'}`,
        config: { googleSearchRetrieval: true },
        output: { schema: ResearcherOutputSchema }
    });

    const result = response.output;
    if (!result) throw new Error("Researcher failed.");

    // RECURSIVE STEP: If we have follow-up queries and haven't hit max depth
    if (result.followUpQueries?.length && depth < 3) {
        blackboard.log('Researcher', `Diving deeper into the web (Step ${depth+1}/3)...`, 'RESEARCH');
        const deeperTopic = result.followUpQueries.join(' ');
        const deeperResult = await runRecursiveSearch(deeperTopic, result.summary, depth + 1);
        
        return {
            summary: `${result.summary}\n\nDEEP RESEARCH ADDENDUM:\n${deeperResult.summary}`,
            constants: { ...result.constants, ...deeperResult.constants },
            citations: [...result.citations, ...deeperResult.citations]
        };
    }

    blackboard.log('Researcher', `Consensus reached with ${result.citations.length} sources.`, 'SUCCESS');
    blackboard.update({
        researchFindings: result.summary,
        externalConstants: result.constants
    });

    return result;
}

export const researcherFlow = ai.defineFlow(
    {
        name: 'researcherFlow',
        inputSchema: ResearcherInputSchema,
        outputSchema: ResearcherOutputSchema,
    },
    async (input): Promise<z.infer<typeof ResearcherOutputSchema>> => {
        return await runRecursiveSearch(input.topic, input.context, input.depth);
    }
);

export const researcherAgent = researcherFlow;