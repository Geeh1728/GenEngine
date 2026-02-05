import { ai, DEEPSEEK_LOGIC_MODEL } from './config';
import { z } from 'zod';
import { executeApexLoop } from './resilience';

// Input type for the flow
type LogicTutorInput = {
    question: string;
    context?: string;
};

/**
 * THE LOGIC TUTOR (v11.0 Platinum Swarm)
 * Objective: High-fidelity scientific explanations with zero hallucination.
 */
export const logicTutorFlow = ai.defineFlow(
    {
        name: 'logicTutorFlow',
        inputSchema: z.object({
            question: z.string(),
            context: z.string().optional(),
        }),
        outputSchema: z.string(),
    },
    async (input: LogicTutorInput) => {
        const { question, context } = input;

        const result = await executeApexLoop({
            task: 'MATH',
            model: DEEPSEEK_LOGIC_MODEL,
            prompt: `
                You are the 'Logic Tutor' for the Genesis Engine.
                Your goal is to explain physics and simulation concepts with brutal honesty and scientific accuracy.
                
                Context: ${context || 'None provided.'}
                
                User Question: ${question}
                
                Provide a concise, logic-driven explanation. Do not hallucinate capabilities we don't have.
                Focus on F=ma, Rapier physics, and Three.js principles.
            `,
            schema: z.string()
        });

        return result.output || "Neural link failed to stabilize explanation.";
    }
);
