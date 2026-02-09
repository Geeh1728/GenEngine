import { z } from 'genkit';
import { ai, geminiFlash, DEEPSEEK_LOGIC_MODEL } from './config';
import { IngestionOutputSchema, SimConfigSchema, SimEntitySchema, ECSComponentSchema } from './schemas';

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
        const tasks: Promise<any>[] = [];

        // --- Task 1: Gemini (The Visionary) - Extracts Visual Rules & Entities ---
        const geminiTask = (async () => {
            console.log('Gemini 2.5 Flash: Extracting Visual Rules...');
            const { output } = await ai.generate({
                model: geminiFlash.name,
                prompt: `
            Analyze the following ${input.sourceType} content:
            "${input.source}"
    
            Phase 1: Rule Extraction
            Extract the core "World Rules" or physical principles.
            For each rule:
            1. Give it a concise name.
            2. Provide a clear description.
            3. Provide a 'grounding_source' (verbatim quote or reference).
    
            Phase 2: Visual Entity Description
            Describe the key physical entities mentioned (e.g., "Ethanol", "Beaker", "Flame").
            Focus on their visual properties (color, state of matter).
          `,
                output: { schema: IngestionOutputSchema.pick({ rules: true, metadata: true }) },
            });
            return output;
        })();
        tasks.push(geminiTask);

        // --- Task 2: DeepSeek-R1 (The Mathematician) - Extracts Physics Constants & Formulas ---
        const deepSeekTask = (async () => {
             console.log('DeepSeek-R1: Extracting Mathematical Logic...');
             try {
                const { output } = await ai.generate({
                    model: DEEPSEEK_LOGIC_MODEL, // e.g., 'openrouter/deepseek/deepseek-r1'
                    prompt: `
                    CRITICAL TASK: You are the "Text-to-ECS" Compiler.
                    Analyze the text content below and EXTRACT the strict mathematical and physical parameters.
                    
                    Content: "${input.source}"
                    
                    OUTPUT: A JSON object matching the SimConfig schema.
                    1. Identify Entities (e.g., "Water").
                    2. Assign Components (e.g., BoilingPoint=100, Density=1.0).
                    3. Extract Global Parameters (e.g., Gravity, AmbientTemp).
                    
                    Format:
                    Entities: [{ name: "Ethanol", components: [{ type: "PhaseState", properties: { boilingPoint: 78.37 } }] }]
                    `,
                    output: { schema: SimConfigSchema },
                });
                return output;
             } catch (error) {
                 console.warn("DeepSeek logic extraction failed, falling back to Gemini for Logic.", error);
                 // Fallback to Gemini if DeepSeek fails (Resilience)
                 const { output } = await ai.generate({
                    model: geminiFlash.name,
                    prompt: `Extract strict simulation parameters from: "${input.source}"`,
                    output: { schema: SimConfigSchema }
                 });
                 return output;
             }
        })();
        tasks.push(deepSeekTask);

        // --- Task 3: Visual Logic Extraction (Qwen2.5-VL) ---
        if (input.images && input.images.length > 0) {
            tasks.push((async () => {
                try {
                    console.log(`Processing ${input.images!.length} images with Qwen2.5-VL...`);
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
                        output: { schema: IngestionOutputSchema.pick({ rules: true }) }
                    });
                    return output;
                } catch (error) {
                    console.warn('Qwen2.5-VL image ingestion failed. Continuing with text only.', error);
                    return null;
                }
            })());
        }

        // --- Synthesis: Merge the Brains ---
        const results = await Promise.all(tasks);
        
        // Results[0] is Gemini (Rules), Results[1] is DeepSeek (SimConfig), Results[2] is Qwen (Visual Rules)
        const geminiResult = results[0];
        const deepSeekResult = results[1];
        const qwenResult = results.length > 2 ? results[2] : null;

        if (!geminiResult) {
            throw new Error('Primary Gemini Ingestion failed.');
        }

        // Merge Rules
        let combinedRules = geminiResult.rules || [];
        if (qwenResult && qwenResult.rules) {
            combinedRules = [...combinedRules, ...qwenResult.rules];
        }

        // Use metadata from Gemini
        const primaryMetadata = geminiResult.metadata;

        return {
            rules: combinedRules,
            simulationConfig: deepSeekResult ? deepSeekResult : undefined, // Attach the ECS config
            metadata: primaryMetadata
        };
    }
);
