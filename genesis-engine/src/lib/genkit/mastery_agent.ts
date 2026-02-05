import { ai } from './config';
import { z } from 'genkit';
import { WorldRuleSchema } from './schemas';
import { executeApexLoop } from './resilience';

export const MasteryQuestionSchema = z.object({
    id: z.string(),
    text: z.string(),
    options: z.array(z.string()).length(4),
    correctOption: z.number().min(0).max(3),
    explanation: z.string(),
});

export const MasteryChallengeSchema = z.object({
    questions: z.array(MasteryQuestionSchema),
});

// Input type for the flow
type MasteryFlowInput = {
    rules: z.infer<typeof WorldRuleSchema>[];
    complexity: 'fundamental' | 'standard' | 'expert';
};

// Rule type for mapping
type WorldRule = z.infer<typeof WorldRuleSchema>;

/**
 * THE MASTERY AGENT (v11.0 Platinum Swarm)
 * Objective: Generate adaptive, citation-backed verification questions.
 */
export const masteryChallengeFlow = ai.defineFlow(
    {
        name: 'masteryChallengeFlow',
        inputSchema: z.object({
            rules: z.array(WorldRuleSchema),
            complexity: z.enum(['fundamental', 'standard', 'expert']),
        }),
        outputSchema: MasteryChallengeSchema,
    },
    async (input: MasteryFlowInput) => {
        const result = await executeApexLoop({
            task: 'CHAT',
            prompt: `
                You are the "Master of Genesis," a guardian of quantum knowledge.
                Based on the following physical rules extracted from the study material, generate 3 challenging multiple-choice questions for a "Mastery Verification."

                Rules:
                ${input.rules.map((r: WorldRule) => `- ${r.rule}: ${r.description} (Source: ${r.grounding_source})`).join('\n')}

                Complexity Level: ${input.complexity.toUpperCase()}

                TASK:
                1. Create 3 questions that test the user's understanding of how these rules interact.
                2. Provide 4 options for each question.
                3. One option must be correct (0-indexed correctOption).
                4. Provide an 'explanation' that directly cites the 'grounding_source' from the rules.
                5. Adjust question difficulty to the complexity level:
                   - FUNDAMENTAL: focus on analogies and basic behaviors.
                   - STANDARD: focus on terminology and experimental outcomes.
                   - EXPERT: focus on the underlying mathematical/theoretical logic.
            `,
            schema: MasteryChallengeSchema,
            fallback: {
                questions: [
                    {
                        id: 'fallback-1',
                        text: 'How does gravity affect objects in the Genesis Engine?',
                        options: ['It pulls them down', 'It pushes them up', 'It does nothing', 'It makes them float'],
                        correctOption: 0,
                        explanation: 'Standard Earth gravity is applied to all non-static entities.'
                    }
                ]
            }
        });

        if (!result.output) {
            throw new Error('Failed to generate mastery challenge.');
        }

        return result.output;
    }
);
