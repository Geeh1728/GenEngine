import { z } from 'zod';
import { ai, geminiFlash, gemini3Flash } from './config';
import { SkillTreeSchema, SkillNodeSchema, SimConfigSchema, WorldRuleSchema } from './schemas';
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
        });

        if (!result.output) throw new Error("Failed to generate mastery challenge.");
        return result.output;
    }
);

// --- Mastery Agent: Living Exam Mode ---

// Input: Raw Text of an Exam Paper (e.g., "Question 3.5: Calculate...")
// Output: A Playable Level Configuration
const ExamParserInputSchema = z.object({
    examText: z.string(),
    subject: z.string().default('Physics')
});

const LevelConfigSchema = z.object({
    levelName: z.string(),
    questionText: z.string(),
    winCondition: z.string().describe('The logic condition to pass (e.g., "temp > 78.37")'),
    initialState: SimConfigSchema.describe('The starting setup of the Lab Bench')
});

export const examParserFlow = ai.defineFlow(
    {
        name: 'examParserFlow',
        inputSchema: ExamParserInputSchema,
        outputSchema: LevelConfigSchema,
    },
    async (input) => {
        console.log(`[MasteryAgent] Parsing Exam Question: "${input.examText.substring(0, 50)}..."`);

        // Use the Visionary Brain to imagine the scene
        const { output } = await ai.generate({
            model: gemini3Flash.name, // Smarter model for creative setup
            prompt: `
            You are a "Living Exam" Generator.
            Turn this static exam question into an interactive simulation level.
            
            Question: "${input.examText}"
            Subject: ${input.subject}
            
            Task:
            1. Extract the scenario (e.g., "Heating Ethanol").
            2. Define the 'Lab Bench' setup (e.g., Beaker, Burner, Ethanol).
            3. Define the 'Win Condition' (e.g., "User successfully boils the liquid").
            
            Output JSON matching the schema.
            `,
            output: { schema: LevelConfigSchema }
        });

        if (!output) throw new Error("Exam parsing failed.");
        return output;
    }
);

// (Existing code follows...)
export const generateSkillTree = ai.defineFlow(
    {
        name: 'generateSkillTree',
        inputSchema: z.object({ topic: z.string() }),
        outputSchema: SkillTreeSchema,
    },
    async (input) => {
        const { output } = await ai.generate({
            model: geminiFlash.name,
            prompt: `Create a mastery skill tree for: ${input.topic}`,
            output: { schema: SkillTreeSchema },
        });
        if (!output) throw new Error("Generation failed");
        return output;
    }
);
