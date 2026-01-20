import { ai, gemini3Flash, geminiFlash } from '../config';
import { z } from 'genkit';
import { generateWithResilience } from '../resilience';
import { SkillTreeSchema } from '../schemas';

export const ArchitectInputSchema = z.object({
    userGoal: z.string().describe('The user\'s learning goal.'),
    pdfText: z.string().optional().describe('Extracted text from a PDF.'),
    pdfImages: z.array(z.string()).optional().describe('Base64 images extracted from the PDF pages.')
});

/**
 * THE ARCHITECT AGENT (Titan Protocol v3.5)
 * Model: Gemini 3 Flash (Thinking) -> Fallback to Flash Lite
 */
export const architectFlow = ai.defineFlow(
    {
        name: 'architectFlow',
        inputSchema: ArchitectInputSchema,
        outputSchema: SkillTreeSchema,
    },
    async (input) => {
        const { userGoal, pdfText, pdfImages } = input;
        const context = pdfText ? `PDF CONTENT:\n${pdfText}` : '';
        const goal = userGoal || "General Mastery";

        const systemPrompt = `
            You are the Genesis Curriculum Designer (The Architect).
            Your goal is to design a personalized learning path (Skill Tree) for the user.
            
            DIAGRAM UNDERSTANDING:
            If you are provided with images from a PDF, analyze the graphs, charts, and diagrams. 
            Create specific 'SIMULATION' nodes that recreate the physics or logic shown in those diagrams.
            
            ENGINE ASSIGNMENT:
            For each node, assign an 'engineMode':
            - 'LAB': For Biology, Chemistry, Fluid Dynamics, Chaos, or Pure Math.
            - 'RAP': For Bridges, Collisions, Structural Forces, Gravity.
            - 'VOX': For Social Sciences, Geography, Abstract Metaphors.
            - 'ASM': For Machines, Anatomy, Jointed Structures.
            
            Structure the response as a gamified Skill Tree JSON.
        `;

        const userPrompt = `
            GOAL: ${goal}
            ${context}
            Analyze the provided context and images to build the curriculum.
        `;

        try {
            // Attempt with Deep Brain (Gemini 3 Flash Thinking)
            const response = await ai.generate({
                model: gemini3Flash.name,
                system: systemPrompt,
                prompt: [
                    { text: userPrompt },
                    ...(pdfImages || []).map(img => ({
                        media: { url: `data:image/png;base64,${img}`, contentType: 'image/png' }
                    }))
                ],
                output: { schema: SkillTreeSchema }
            });
            return response.output;
        } catch (error) {
            console.error("Gemini 3 Architect Failed, falling back to Flash Lite:", error);
            
            // Fallback to Fast Brain (Flash Lite)
            const fallbackResponse = await generateWithResilience({
                system: systemPrompt,
                prompt: userPrompt,
                schema: SkillTreeSchema,
                retryCount: 1
            });
            
            if (!fallbackResponse) throw new Error("Architect completely failed to generate curriculum.");
            return fallbackResponse;
        }
    }
);