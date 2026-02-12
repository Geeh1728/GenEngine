import { z } from 'genkit';
import { ai, geminiFlash, DEEPSEEK_LOGIC_MODEL, QWEN3_MODEL, MODELS } from './config';
import { IngestionOutputSchema, SimConfigSchema } from './schemas';

export { IngestionOutputSchema } from './schemas';

// Input schema for the flow
const IngestionFlowInputSchema = z.object({
    source: z.string().describe('PDF text content or YouTube URL'),
    sourceType: z.enum(['pdf', 'youtube']),
    title: z.string().optional(),
    images: z.array(z.string()).optional().describe('List of base64 data URIs or authenticated URLs for images in the document'),
    existingRules: z.array(z.any()).optional().describe('Existing rules to merge with (for Ontology Grafting)')
});

// Input type for the flow
type IngestionFlowInput = z.infer<typeof IngestionFlowInputSchema>;

/**
 * MODULE S-I: THE SCOUT PASS (v32.5)
 * Objective: Extract first 5 entities/laws in < 2 seconds via Groq LPU.
 */
export const scoutFlow = ai.defineFlow(
    {
        name: 'scoutFlow',
        inputSchema: z.object({ source: z.string() }),
        outputSchema: SimConfigSchema
    },
    async (input) => {
        const firstTwoPages = input.source.substring(0, 5000); // Approximation
        const { output } = await ai.generate({
            model: MODELS.GROQ_LLAMA_4_SCOUT,
            prompt: `
                QUICK SCAN TASK: You are the "LPU Scout".
                Identify the first 5 physical entities or laws mentioned in this text.
                Return a valid SimConfig JSON.
                
                Content: "${firstTwoPages}"
            `,
            output: { schema: SimConfigSchema }
        });
        return output || { entities: [], globalParameters: {}, scenarios: [] };
    }
);

export const ingestionFlow = ai.defineFlow(
    {
        name: 'ingestionFlow',
        inputSchema: IngestionFlowInputSchema,
        outputSchema: IngestionOutputSchema,
        // modelArmor middleware removed - no longer available in @genkit-ai/google-cloud
    },
    async (input: IngestionFlowInput) => {
        // --- Task 1: Gemini (The Visionary) - Extracts Visual Rules & Entities ---
        const geminiTask = (async () => {
            try {
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
            } catch (error) {
                console.error('Gemini extraction failed:', error);
                return null;
            }
        })();

        // --- Task 2: DeepSeek-R1 (The Mathematician) - Extracts Physics Constants & Formulas ---
        const deepSeekTask = (async () => {
             console.log('DeepSeek-R1: Extracting Mathematical Logic...');
             try {
                const { output } = await ai.generate({
                    model: DEEPSEEK_LOGIC_MODEL, 
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
                 try {
                    const { output } = await ai.generate({
                        model: geminiFlash.name,
                        prompt: `Extract strict simulation parameters from: "${input.source}"`,
                        output: { schema: SimConfigSchema }
                    });
                    return output;
                 } catch (e) {
                     return null;
                 }
             }
        })();

        // --- Task 3: Visual Logic Extraction (Qwen 3) ---
        const qwenTask = (async () => {
            if (!input.images || input.images.length === 0) return null;
            try {
                console.log(`Processing ${input.images.length} images with Qwen 3 (Groq LPU)...`);
                const imageParts = input.images.slice(0, 3).map((img: string) => ({ media: { url: img, contentType: 'image/jpeg' } }));

                const { output } = await ai.generate({
                    model: QWEN3_MODEL,
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
                console.warn('Qwen 3 image ingestion failed.', error);
                return null;
            }
        })();

        // --- Synthesis: Merge the Brains ---
        const [geminiResult, deepSeekResult, qwenResult] = await Promise.all([geminiTask, deepSeekTask, qwenTask]);
        
        if (!geminiResult && !deepSeekResult) {
            throw new Error('All Ingestion Brains failed.');
        }

        // Merge Rules
        let combinedRules = (geminiResult?.rules || []) as any[];
        
        if (input.existingRules) {
            console.log(`[Grafting] Merging ${input.existingRules.length} existing rules with new ones...`);
            combinedRules = [...input.existingRules, ...combinedRules];
        }
        
        // FAILOVER: If Gemini failed to extract rules, try to extract them from DeepSeek's result 
        // or re-run a specific rule extraction task via DeepSeek.
        if (combinedRules.length === 0 && !geminiResult) {
            console.log("Gemini failed, attempting Rule Extraction via DeepSeek-R1...");
            try {
                const dsRules = await ai.generate({
                    model: DEEPSEEK_LOGIC_MODEL,
                    prompt: `Extract physical rules from: "${input.source}"`,
                    output: { schema: IngestionOutputSchema.pick({ rules: true }) }
                });
                if (dsRules.output?.rules) {
                    combinedRules = dsRules.output.rules;
                }
            } catch (e) {
                console.warn("DeepSeek rule failover failed.");
            }
        }

        if (qwenResult && qwenResult.rules) {
            combinedRules = [...combinedRules, ...qwenResult.rules];
        }

        // If Gemini failed but DeepSeek worked, we might have entities but no "World Rules" in the standard format.
        // We can synthesize a default rule if needed or just rely on the simulationConfig.

        // Use metadata from Gemini, fallback to basic info
        const primaryMetadata = geminiResult?.metadata || {
            source_type: input.sourceType,
            title: input.title || 'Extracted Simulation'
        };

        return {
            rules: combinedRules,
            simulationConfig: deepSeekResult ? deepSeekResult : undefined,
            metadata: primaryMetadata
        };
    }
);
