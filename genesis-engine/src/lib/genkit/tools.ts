import { ai } from './config';
import { z } from 'genkit';
import { queryKnowledge } from '../db/pglite';
import { embeddingModel } from '../google';

/**
 * searchCurriculum: A Genkit Tool that queries the local PGLite vector store.
 * Allows agents to find relevant educational context from previous ingestions.
 */
export const searchCurriculum = ai.defineTool(
    {
        name: 'searchCurriculum',
        description: 'Searches the local knowledge base for relevant formulas, constants, or educational templates.',
        inputSchema: z.object({
            query: z.string().describe('The topic or formula to search for.'),
        }),
        outputSchema: z.array(z.object({
            content: z.string(),
            similarity: z.number(),
        })),
    },
    async (input) => {
        try {
            // 1. Generate embedding for the query
            const result = await embeddingModel.embedContent(input.query);
            const embedding = result.embedding.values;

            // 2. Query PGLite
            const results = await queryKnowledge(embedding);
            
            return results.map(r => ({
                content: (r as { content: string }).content,
                similarity: (r as { similarity: number }).similarity,
            }));
        } catch (error) {
            console.error('Tool Error: searchCurriculum failed', error);
            return [];
        }
    }
);
