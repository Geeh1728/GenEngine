import { ai } from './config';
import { z } from 'genkit';
import { WorldRuleSchema } from './schemas';

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

// Input schema for the flow (defined once for reuse)
// const MasteryFlowInputSchema = z.object({
//     rules: z.array(WorldRuleSchema),
//     complexity: z.enum(['fundamental', 'standard', 'expert']),
// });

// Input type for the flow
type MasteryFlowInput = {
    rules: z.infer<typeof WorldRuleSchema>[];
    complexity: 'fundamental' | 'standard' | 'expert';
};

// Rule type for mapping
type WorldRule = z.infer<typeof WorldRuleSchema>;

export const masteryChallengeFlow = ai.defineFlow(
    {
        name: 'masteryChallengeFlow',
        inputSchema: z.object({
            rules: z.array(WorldRuleSchema),
            complexity: z.enum(['fundamental', 'standard', 'expert']),
        }),
        outputSchema: MasteryChallengeSchema,
        // modelArmor middleware removed - no longer available in @genkit-ai/google-cloud
    },
    async (input: MasteryFlowInput) => {
        const { output } = await ai.generate({
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
            output: { schema: MasteryChallengeSchema },
        });

        if (!output) {
            throw new Error('Failed to generate mastery challenge.');
        }

        return output;
    }
);
