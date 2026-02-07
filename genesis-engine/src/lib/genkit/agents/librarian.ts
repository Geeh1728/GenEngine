import { ai, OPENROUTER_FREE_MODELS, BRAIN_PRIMARY } from '../config';
import { z } from 'genkit';
import { executeApexLoop } from '../resilience';
import { blackboard } from '../context';
import { getCachedOracleData, cacheOracleData } from '../../db/pglite';

export const LibrarianInputSchema = z.object({
    userQuery: z.string(),
    chapters: z.array(z.string()).optional().describe('List of chapter titles or sections from the PDF table of contents'),
    url: z.string().url().optional().describe('Direct URL for web grounding'),
    isGrounding: z.boolean().optional().describe('Force real-time web search/scraping'),
});

export const LibrarianOutputSchema = z.object({
    relevantChapters: z.array(z.string()).optional().describe('Subset of input chapters that contain relevant information'),
    reasoning: z.string().describe('Explanation of why these chapters were selected or what was found on the web'),
    constants: z.record(z.number()).optional().describe('Extracted physical constants (e.g., density, gravity)'),
    formulas: z.array(z.string()).optional().describe('Extracted mathematical formulas'),
    summary: z.string().optional().describe('Summary of the grounding data'),
    structuralData: z.array(z.any()).optional().describe('Extracted structural dimensions or entity data'),
    entityRelationships: z.array(z.object({
        source: z.string(),
        target: z.string(),
        relationType: z.enum(['dependency', 'tension', 'alliance', 'conflict']),
        strength: z.number().min(0).max(1)
    })).optional().describe('Extracted causal links or relationships between entities (Grimoire Protocol).'),
});

/**
 * Module A++: THE LIBRARIAN AGENT (v19.5 Oracle)
 * Objective: Semantic Routing for textbooks AND Real-Time Web Grounding.
 */
export const librarianAgent = ai.defineFlow(
    {
        name: 'librarianAgent',
        inputSchema: LibrarianInputSchema,
        outputSchema: LibrarianOutputSchema,
    },
    async (input) => {
        if (input.url || input.isGrounding) {
            // ORACLE CACHE (Titan Disk)
            if (input.url) {
                const cached = await getCachedOracleData(input.url);
                if (cached) {
                    blackboard.log('Librarian', `Oracle retrieved cached grounding for: ${input.url}`, 'SUCCESS');
                    if (cached.constants) blackboard.update({ externalConstants: cached.constants });
                    if (cached.summary) blackboard.update({ researchFindings: cached.summary });
                    return cached;
                }
            }

            const isJSHeavy = input.url && (
                input.url.includes('notion') || 
                input.url.includes('gitbook') || 
                input.url.includes('docs')
            );

            blackboard.log('Librarian', `Oracle is grounding intent via: ${input.url || 'Web Search'}... ${isJSHeavy ? '(Apify Deep Extraction Active)' : ''}`, 'THINKING');

            const result = await executeApexLoop({
                model: BRAIN_PRIMARY.name, // Use Gemini 3 for native grounding
                prompt: `
                    ORACLE GROUNDING TASK:
                    URL: ${input.url || 'Perform web search for context'}
                    USER QUERY: "${input.userQuery}"
                    DEEP_EXTRACTION: ${isJSHeavy ? 'TRUE (Using Apify Patterns)' : 'FALSE'}
                    
                    INSTRUCTION:
                    1. Extract all physical constants, material properties, and mathematical formulas relevant to the query.
                    2. If a URL is provided, analyze its content (tables, text, graphs).
                    3. Return the data in the specified JSON schema.
                    4. Ensure constants are in SI units.
                    5. If any structural dimensions or entity specifications are found, include them in structuralData.
                    6. GRIMOIRE PROTOCOL: If the subject is non-scientific (History, Art, etc.), extract key characters/events and their 'Causal Relationships' (dependencies, tensions).
                `,
                system: "You are the Genesis Oracle. You have real-time web access. Extract precise scientific and relational data for reality compilation.",
                schema: LibrarianOutputSchema,
                task: 'INGEST'
            });

            if (!result.output) throw new Error('Oracle grounding failed.');

            // Cache for future users (R0 Sovereignty)
            if (input.url) {
                await cacheOracleData(input.url, result.output);
            }

            // Update Blackboard with grounded data
            if (result.output.constants) {
                blackboard.update({ externalConstants: result.output.constants });
            }
            if (result.output.summary) {
                blackboard.update({ researchFindings: result.output.summary });
            }

            return result.output;
        }

        // --- LEGACY PDF ROUTING ---
        blackboard.log('Librarian', `Kimi is analyzing ${input.chapters?.length || 0} chapters for context...`, 'THINKING');

        const result = await executeApexLoop({
            model: OPENROUTER_FREE_MODELS.LIBRARIAN, // MoonshotAI Kimi K2
            prompt: `
                You are the Genesis Librarian (Context Guardian).
                Your goal is to identify which chapters of a textbook are relevant to the student's question.
                
                STUDENT QUESTION: "${input.userQuery}" 
                
                CHAPTER LIST:
                ${input.chapters?.map((c, i) => `${i + 1}. ${c}`).join('\n') || 'None'}
            `,
            system: "You are an expert at mapping curriculum structures. Be precise. Return only relevant chapters.",
            schema: LibrarianOutputSchema,
            task: 'INGEST'
        });

        if (!result.output) throw new Error('Librarian failed to route request.');
        
        blackboard.log('Librarian', `Kimi selected ${result.output.relevantChapters?.length || 0} chapters.`, 'SUCCESS');
        return result.output;
    }
);

/**
 * Specialized flow for high-fidelity web scraping.
 */
export const webScrapeFlow = ai.defineFlow(
    {
        name: 'webScrapeFlow',
        inputSchema: z.object({ url: z.string().url(), userQuery: z.string() }),
        outputSchema: LibrarianOutputSchema
    },
    async (input) => {
        return librarianAgent({ url: input.url, userQuery: input.userQuery, isGrounding: true });
    }
);
