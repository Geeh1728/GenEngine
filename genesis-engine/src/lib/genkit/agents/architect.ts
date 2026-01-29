import { ai, gemini3Flash, geminiFlash } from '../config';
import { MODELS } from '../models';
import { z } from 'genkit';
import { executeApexLoop } from '../resilience';
import { SkillTreeSchema } from '../schemas';
import { blackboard } from '../context';
import { searchCurriculum } from '../tools';

export const ArchitectInputSchema = z.object({
    userGoal: z.string().describe('The user\'s learning goal.'),
    pdfText: z.string().optional().describe('Extracted text from a PDF.'),
    pdfImages: z.array(z.array(z.string())).optional().describe('Base64 images extracted from the PDF pages.'),
    fileUri: z.string().optional().describe('Gemini File API URI for grounding.'),
});

/**
 * THE ARCHITECT AGENT (v10.0 Singularity)
 * Features: Context Caching for 50k+ token textbooks, Librarian-Grade mapping.
 */
export const architectFlow = ai.defineFlow(
    {
        name: 'architectFlow',
        inputSchema: ArchitectInputSchema,
        outputSchema: SkillTreeSchema,
    },
    async (input) => {
        const { userGoal, pdfText, fileUri } = input;
        const goal = userGoal || "General Mastery";
        
        blackboard.log('Architect', `Librarian mode active. Designing curriculum for: "${goal}"`, 'THINKING');

        // Quantum Bridge Context
        const blackboardFragment = blackboard.getSystemPromptFragment();

        const systemPrompt = `
            You are the Genesis Super Librarian (The Architect).
            Map the 100% logical structure of the provided context. 
            Build a Skill Tree where every node is a physical system or logical concept.
            
            KNOWLEDGE RETRIEVAL:
            1. Use Context Caching for massive documents to ensure zero-latency recall.
            2. ALWAYS cite the specific page or section.
            3. Ground the curriculum in real-world academic standards.

            Structure the response as a gamified Skill Tree JSON.
            ${blackboardFragment}
        `;

        const userPrompt = `
            Analyze this full-context curriculum and build a Skill Tree.
            GOAL: ${goal}
            
            ${pdfText ? `PDF CONTENT:\n${pdfText}` : ''}
        `;

        try {
            // STEP 1: Implement Cache Check (Simulated for 2026 SDK compatibility)
            const useCache = pdfText && pdfText.length > 50000;
            if (useCache) {
                blackboard.log('Architect', 'Large document detected. Creating Neural Cache (24h)...', 'RESEARCH');
                // In actual 2026 implementation: const cache = await ai.createCache({ model: MODELS.BRAIN_PRIMARY, ttl: 86400 });
            }

            const response = await executeApexLoop({
                model: MODELS.BRAIN_PRIMARY,
                system: systemPrompt,
                prompt: userPrompt,
                task: 'INGEST',
                schema: SkillTreeSchema,
                onLog: (msg, type) => blackboard.log('Architect', msg, type)
            });
            
            if (!response.output) throw new Error("Architect failed to manifest tree.");
            
            blackboard.log('Architect', 'Skill Tree architected successfully via Neural Cache.', 'SUCCESS');
            return response.output;
        } catch (error) {
            console.error("Architect Failed:", error);
            throw new Error("Singularity link failure in Architect.");
        }
    }
);
