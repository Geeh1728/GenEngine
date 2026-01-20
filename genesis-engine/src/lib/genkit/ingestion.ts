import { z } from 'genkit';
import { ai, geminiFlash } from './config';
import { IngestionOutputSchema } from './schemas';

export { IngestionOutputSchema } from './schemas';

// Input schema for the flow
const IngestionFlowInputSchema = z.object({
    source: z.string().describe('PDF text content or YouTube URL'),
    sourceType: z.enum(['pdf', 'youtube']),
    title: z.string().optional(),
    images: z.array(z.string()).optional().describe('List of base64 data URIs or authenticated URLs for images in the document'),
});

// Input type for the flow
type IngestionFlowInput = z.infer<typeof IngestionFlowInputSchema>;

export const ingestionFlow = ai.defineFlow(
    {
        name: 'ingestionFlow',
        inputSchema: IngestionFlowInputSchema,
        outputSchema: IngestionOutputSchema,
        // modelArmor middleware removed - no longer available in @genkit-ai/google-cloud
    },
    async (input: IngestionFlowInput) => {
        const tasks: Promise<z.infer<typeof IngestionOutputSchema> | null>[] = [];

        // --- Task 1: Text Logic extraction (Gemini -> DeepSeek Failover) ---
        tasks.push((async () => {
            try {
                console.log('Attempting ingestion with Gemini 2.5 Flash Lite...');
                const { output } = await ai.generate({
                    model: geminiFlash.name,
                    prompt: `
            Analyze the following ${input.sourceType} content:
            "${input.source}"
    
            Extract the core "World Rules" or physical principles described in this material.
            For each rule:
            1. Give it a concise name (rule).
            2. Provide a clear description.
            3. Provide a 'grounding_source' - this must be a verbatim quote or a specific reference (like "Page X" for PDFs or a timestamp/segment description for video).
    
            The goal is to build a "Quantum Sandbox" where these rules will be simulated.
            Focus on rules that are actionable or visualizable in a 3D simulation.
          `,
                    output: { schema: IngestionOutputSchema },
                });

                if (!output) {
                    throw new Error('Gemini returned no output');
                }
                return output;
            } catch (error) {
                console.warn('Gemini 2.0 Flash failed. Initiating Failover to DeepSeek-R1 (via OpenRouter)...', error);

                try {
                    // Failover: DeepSeek-R1 (Reasoning Model)
                    const { output } = await ai.generate({
                        model: 'openai/deepseek/deepseek-r1',
                        prompt: `
                    CRITICAL TASK: You are the "Logic Validator" for a physics engine.
                    Analyze the text content below and EXTRACT the mathematical axioms and physical rules.
                    
                    Content: "${input.source}"
                    
                    OUTPUT IN JSON format only, matching the schema.
                    1. Verify every rule against standard physics principles.
                    2. If the text implies a formula, describe it in the 'description'.
                    3. "grounding_source" is Mandelbrot.
                        `,
                        output: { schema: IngestionOutputSchema },
                    });
                    return output;
                } catch (deepSeekError) {
                    console.error('DeepSeek-R1 failover failed', deepSeekError);
                    throw deepSeekError;
                }
            }
        })());

        // --- Task 2: Visual Logic Extraction (Qwen2.5-VL) ---
        if (input.images && input.images.length > 0) {
            tasks.push((async () => {
                try {
                    console.log(`Processing ${input.images!.length} images with Qwen2.5-VL...`);
                    // We take the first 3 images to avoid token limits or huge payloads for now
                    const imageParts = input.images!.slice(0, 3).map((img: string) => ({ media: { url: img, contentType: 'image/jpeg' } }));

                    const { output } = await ai.generate({
                        model: 'openai/qwen/qwen-2.5-vl-72b-instruct',
                        prompt: [
                            {
                                text: `
                            You are an expert Physics Diagram Reader. 
                            Analyze these images (diagrams/screenshots from the source).
                            Extract any explicit "World Rules", spatial relationships, or formulas visible in the diagrams.
                            Convert them into the standard JSON rule format.
                            If a rule is already covered by the text, ignore it. Focus on VISUAL info (e.g., angles, connections).
                            ` },
                            ...imageParts
                        ],
                        output: { schema: IngestionOutputSchema }
                    });
                    return output;
                } catch (error) {
                    console.warn('Qwen2.5-VL image ingestion failed. Continuing with text only.', error);
                    return null;
                }
            })());
        }

        // --- Merge Results ---
        const results = await Promise.all(tasks);
        const successfulResults = results.filter((r): r is z.infer<typeof IngestionOutputSchema> => r !== null);

        if (successfulResults.length === 0) {
            throw new Error('All ingestion models failed.');
        }

        // Merge rules
        const combinedRules = successfulResults.flatMap(r => r.rules);

        // Use metadata from the first result (usually text source)
        const primaryMetadata = successfulResults[0].metadata;

        return {
            rules: combinedRules,
            metadata: primaryMetadata
        };
    }
);
