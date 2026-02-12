import { ai, LOGIC_WATERFALL, MODELS } from '../config';
import { z } from 'genkit';
import { blackboard } from '../context';
import { executeApexLoop } from '../resilience';

export const ResearcherInputSchema = z.object({
    topic: z.string(),
    context: z.string().optional(),
    depth: z.number().default(1).describe('Current recursion depth'),
});

export const ResearcherOutputSchema = z.object({
    summary: z.string().describe('Summary of the research findings.'),
    constants: z.array(z.object({
        name: z.string(),
        value: z.number()
    })).optional().describe('Extracted raw physical values or constants.'),
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
        1. Find specialized constants (e.g., soil density, orbital speed, drum membrane tension).
        2. Extract RAW numerical values.
    `;

    // STEP 1: Internal Knowledge Grounding (Using Groq LPU for speed)
    let rawText = "";
    let success = false;
    
    // v32.5 LPU-Accelerated First Pass
    const lpuList = [MODELS.GROQ_LLAMA_4_SCOUT, ...LOGIC_WATERFALL];
    
    for (const modelName of lpuList) {
        blackboard.log('Researcher', `Generating research via ${modelName}...`, 'THINKING');
        try {
            const response = await ai.generate({
                model: modelName,
                prompt: `Research topic: "${topic}"\nContext: ${context || 'None'}\nProvide a detailed summary including specific constants and citations.`,
                system: systemPrompt
            });
            
            if (response.text) {
                rawText = response.text;
                success = true;
                break;
            }
        } catch (err) {
            console.warn(`[Researcher] Research failed for ${modelName}:`, err);
            continue;
        }
    }

    if (!success) {
        blackboard.log('Researcher', 'Grounding link unstable. Proceeding with local neural context.', 'ERROR');
        return {
            summary: "Research phase failed or was inconclusive. Using local scientific context.",
            citations: [],
            followUpQueries: []
        };
    }

    // STEP 2: Structured Extraction
    const extractionResult = await executeApexLoop({
        prompt: `Extract structured scientific data from this research text:\n\n${rawText}`,
        system: "You are a scientific data extractor. Format the findings as JSON matching the ResearcherOutputSchema.",
        schema: ResearcherOutputSchema,
        task: 'MATH'
    });

    if (!extractionResult.output) {
        return {
            summary: rawText,
            citations: [],
            followUpQueries: []
        };
    }
    const researchData = extractionResult.output;
    researchData.summary = rawText; // Combine results

    // RECURSIVE STEP: If we have follow-up queries and haven't hit max depth
    if (researchData.followUpQueries?.length && depth < 3) {
        blackboard.log('Researcher', `Diving deeper into the web (Step ${depth+1}/3)...`, 'RESEARCH');
        const deeperTopic = researchData.followUpQueries.join(' ');
        const deeperResult = await runRecursiveSearch(deeperTopic, researchData.summary, depth + 1);
        
        return {
            summary: `${researchData.summary}\n\nDEEP RESEARCH ADDENDUM:\n${deeperResult.summary}`,
            constants: [...(researchData.constants || []), ...(deeperResult.constants || [])],
            citations: [...researchData.citations, ...deeperResult.citations]
        };
    }

    blackboard.log('Researcher', `Consensus reached with ${researchData.citations.length} sources.`, 'SUCCESS');
    
    // Map array constants back to record for Blackboard/Engine compatibility if needed
    const constantsMap: Record<string, number> = {};
    researchData.constants?.forEach(c => {
        constantsMap[c.name] = c.value;
    });

    blackboard.update({
        researchFindings: researchData.summary,
        externalConstants: constantsMap
    });

    return researchData;
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