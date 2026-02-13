import { ai, gemini3Flash } from '../config';
import { z } from 'zod';
import { generateWithResilience } from '../resilience';

export const VisualCortexInputSchema = z.object({
    imageBase64: z.string().describe('Base64 encoded image (sketch, photo, or screenshot)'),
    context: z.string().optional().describe('Additional context for the analysis'),
});

export const VisualCortexOutputSchema = z.object({
    analysis: z.string().describe('The internal reasoning or monologue about the object.'),
    weakPoints: z.array(z.object({
        x: z.number().describe('X coordinate on a 0-100 scale'),
        y: z.number().describe('Y coordinate on a 0-100 scale'),
        reason: z.string(),
    })),
    suggestions: z.array(z.string()),
    improvedWorldState: z.any().optional().describe('Optional: A corrected WorldState based on the analysis'),
});

/**
 * MODULE V: THE VISUAL CORTEX
 * Objective: Use Visual Thinking to debug reality before simulating it.
 */
export const visualCortexFlow = ai.defineFlow(
    {
        name: 'visualCortexFlow',
        inputSchema: VisualCortexInputSchema,
        outputSchema: VisualCortexOutputSchema,
    },
    async (input) => {
        const { imageBase64, context } = input;

        const response = await ai.generate({
            model: gemini3Flash.name,
            prompt: [
                {
                    media: {
                        url: `data:image/png;base64,${imageBase64}`,
                        contentType: 'image/png',
                    },
                },
                {
                    text: `
                        Analyze the structural integrity of this object or diagram. 
                        Identify physical flaws (e.g., lack of support, unanchored joints, weight imbalance).
                        Predict where it will fail under gravity.
                        
                        Context: ${context || 'General Physics Simulation'}
                        
                        Output JSON:
                        {
                          "analysis": "Describe your thinking process here.",
                          "weakPoints": [{ "x": number, "y": number, "reason": "..." }],
                          "suggestions": ["suggestion 1", "..."]
                        }
                    `,
                },
            ],
            output: {
                schema: VisualCortexOutputSchema
            }
        });

        if (!response.output) {
            return {
                analysis: "The visual cortex was unable to process the data.",
                weakPoints: [],
                suggestions: ["Try uploading a clearer image or a simpler diagram."]
            };
        }

        return response.output;
    }
);
