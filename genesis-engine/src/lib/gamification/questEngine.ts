import { questAgent, Quest } from '../genkit/agents/questAgent';

export type { Quest };

/**
 * Quest Engine: Generates dynamic learning challenges.
 * Inspired by "Sky Metropolis" goal generation.
 */
export async function generateLearningQuest(topic: string, failureContext?: string): Promise<Quest | null> {
    try {
        const quest = await questAgent({
            topic,
            failureContext
        });

        return quest;
    } catch (error) {
        console.error('Quest Engine Error:', error);
        return null;
    }
}

/**
 * Static Master Quests for Core Milestones
 */
export const MASTER_QUESTS: Quest[] = [
    {
        id: 'master-design-life',
        title: 'Design Life: The Xenobot Challenge',
        objective: 'Design an organism that can survive High Viscosity.',
        description: 'Adjust the Xenobot DNA (Spring Stiffness) until velocity > 0.5 in a high-friction environment.',
        winCondition: 'xenobot.velocity > 0.5 && environment.viscosity > 0.8',
        difficulty: 'Hard',
        xpReward: 1000
    }
];
