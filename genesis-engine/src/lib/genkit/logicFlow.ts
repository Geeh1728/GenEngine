import { ai, DEEPSEEK_LOGIC_MODEL } from './config';
import { z } from 'zod';

// Input type for the flow
type LogicTutorInput = {
    question: string;
    context?: string;
};

export const logicTutorFlow = ai.defineFlow(
    {
        name: 'logicTutorFlow',
        inputSchema: z.object({
            question: z.string(),
            context: z.string().optional(),
        }),
        outputSchema: z.string(),
        // modelArmor middleware removed - no longer available in @genkit-ai/google-cloud
    },
    async (input: LogicTutorInput) => {
        const { question, context } = input;

        // We use the DeepSeek Distilled model for "Logic" tasks as per R0 Budget strategy.
        // This simulates a "local-first" logic tutor that is cheap/efficient.
        const response = await ai.generate({
            model: DEEPSEEK_LOGIC_MODEL,
            prompt: `
        You are the 'Logic Tutor' for the Genesis Engine.
        Your goal is to explain physics and simulation concepts with brutal honesty and scientific accuracy.
        
        Context: ${context || 'None provided.'}
        
        User Question: ${question}
        
        Provide a concise, logic-driven explanation. Do not hallucinate capabilities we don't have.
        Focus on F=ma, Rapier physics, and Three.js principles.
      `,
            config: {
                temperature: 0.7,
            },
        });

        return response.text;
    }
);
