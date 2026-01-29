import { ai } from '../config';
import { MODELS } from '../models';
import { z } from 'genkit';
import { executeApexLoop } from '../resilience';

export const LibrarianInputSchema = z.object({
    userQuery: z.string(),
    chapters: z.array(z.string()).describe('List of chapter titles or sections from the PDF table of contents'),
});

export const LibrarianOutputSchema = z.object({
    relevantChapters: z.array(z.string()).describe('Subset of input chapters that contain relevant information'),
    reasoning: z.string().describe('Explanation of why these chapters were selected'),
});

/**
 * Module A++: THE LIBRARIAN AGENT (v7.5)
 * Model: Gemma 3 27B (15,000 RPD)
 * Objective: Semantic Routing for massive textbooks. 
 * Instead of embedding the whole book, the Librarian identifies the 
 * relevant chapter first to protect the 1K embedding quota.
 */
export const librarianAgent = ai.defineFlow(
    {
        name: 'librarianAgent',
        inputSchema: LibrarianInputSchema,
        outputSchema: LibrarianOutputSchema,
    },
    async (input) => {
        const result = await executeApexLoop({
            model: MODELS.BRAIN_WORKHORSE, // Prioritize 15K RPD Gemma 3
            prompt: `
                You are the Genesis Librarian. Your goal is to identify which chapters of a textbook 
                are relevant to the student's question.
                
                STUDENT QUESTION: "${input.userQuery}" 
                
                CHAPTER LIST:
                ${input.chapters.map((c, i) => `${i + 1}. ${c}`).join('\n')}
            `,
            system: "You are an expert at mapping curriculum structures. Be precise. Return only relevant chapters.",
            schema: LibrarianOutputSchema,
            task: 'INGEST'
        });

        if (!result.output) throw new Error('Librarian failed to route request.');
        return result.output;
    }
);
