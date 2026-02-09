import { z } from 'genkit';
import { ai, geminiFlash, gemini3Flash } from './config';
import { SkillTreeSchema, SkillNodeSchema, SimConfigSchema } from './schemas';

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