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
        const { seedUrl } = input;
        console.log(`[Spider] Initiating production crawl on ${seedUrl}...`);
        
        const apifyToken = process.env.APIFY_API_TOKEN;
        if (!apifyToken) {
            return { 
                crawledData: [], 
                summary: "Error: APIFY_API_TOKEN not configured in production." 
            };
        }

        try {
            // Production: Triggering Apify Website Content Crawler (Cheerio)
            const response = await fetch("https://api.apify.com/v2/acts/apify~website-content-crawler/run-sync-get-dataset-items", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apifyToken}`
                },
                body: JSON.stringify({
                    startUrls: [{ url: seedUrl }],
                    maxCrawlPages: 5,
                    onlyText: true
                })
            });

            const items: any = await response.json();
            
            const crawledData = Array.isArray(items) ? items.slice(0, 3).map((item: any) => ({
                url: item.url,
                title: item.metadata?.title || "Resource Node",
                text: item.text?.substring(0, 2000) || "",
                links: []
            })) : [];

            return {
                crawledData,
                summary: `Module Spider successfully extracted data from ${crawledData.length} production nodes.`
            };
        } catch (error) {
            console.error("[Spider] Production error:", error);
            return { crawledData: [], summary: "Crawl failed due to network anomaly." };
        }
    }
);
