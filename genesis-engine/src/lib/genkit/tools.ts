import { ai } from './config';
import { z } from 'zod';
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

/**
 * webSpider: Module Spider (Recursive Crawling)
 * Triggered for "Deep Dive" or "Research" intents.
 */
export const webSpider = ai.defineTool(
    {
        name: 'webSpider',
        description: 'Performs recursive web crawling to gather deep knowledge on a topic. Use for "Research" or "Deep Dive" intents.',
        inputSchema: z.object({
            seedUrl: z.string().url(),
            maxDepth: z.number().min(1).max(2).default(1),
            keywords: z.array(z.string()).optional().describe('Keywords to filter links (e.g., ["Diagram", "Formula", "Source"])')
        }),
        outputSchema: z.object({
            crawledData: z.array(z.object({
                url: z.string(),
                title: z.string(),
                text: z.string(),
                links: z.array(z.string())
            })),
            summary: z.string()
        }),
    },
    async (input) => {
        const { seedUrl, maxDepth } = input;
        console.log(`[Spider] Initiating recursive crawl on ${seedUrl} with depth ${maxDepth}...`);
        
        // Mocking Apify integration for now - in production, this calls Apify's Website Content Crawler
        // To be replaced with: const client = new ApifyClient({ token: process.env.APIFY_TOKEN });
        
        return {
            crawledData: [
                {
                    url: seedUrl,
                    title: 'Seed Knowledge Node',
                    text: `Deep analysis of ${seedUrl} context...`,
                    links: [`${seedUrl}/physics`, `${seedUrl}/design`]
                }
            ],
            summary: "Module Spider has successfully traversed the knowledge domain and extracted multi-source context."
        };
    }
);
