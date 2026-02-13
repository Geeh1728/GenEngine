import { ai } from '../config';
import { z } from 'zod';
import { generateWithResilience } from '../resilience';

export const QuestSchema = z.object({
    id: z.string(),
    title: z.string(),
    objective: z.string(),
    description: z.string(),
    winCondition: z.string().describe('A measurable physics condition (e.g. "entity:ball.position.y > 5")'),
    difficulty: z.enum(['Easy', 'Medium', 'Hard']),
    xpReward: z.number(),
});

export type Quest = z.infer<typeof QuestSchema>;

export const QuestInputSchema = z.object({
    topic: z.string(),
    failureContext: z.string().optional(),
});

/**
 * Module I: The Quest Board Agent
 * Objective: Generates dynamic learning challenges.
 */
export const questAgent = ai.defineFlow(
    {
        name: 'questAgent',
        inputSchema: QuestInputSchema,
        outputSchema: QuestSchema,
    },
    async (input) => {
        const { topic, failureContext } = input;
        
        const output = await generateWithResilience({
            prompt: `Generate a quest for ${topic}.`,
            system: `
                You are the "Game Master" of a Physics Simulator.
                The user is learning about "${topic}".
                ${failureContext ? `They just failed at: "${failureContext}".` : ''}
                
                Generate a specific, bite-sized "Quest" to help them master this concept.
                The winCondition must be precise.
            `,
            schema: QuestSchema,
            retryCount: 2,
            fallback: {
                id: `quest-${Date.now()}`,
                title: "Exploratory Sandbox",
                objective: "Observe the simulation mechanics.",
                description: "The Quest Agent is currently optimizing. Enjoy free-play mode.",
                winCondition: "true", // Always true or manual check
                difficulty: "Easy",
                xpReward: 50
            }
        });

        if (!output) throw new Error('Quest Agent failed even with fallback.');
        return output;
    }
);
