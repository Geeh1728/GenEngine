import { ai } from '../config';
import { WorldStateSchema } from '../../simulation/schema';
import { z } from 'genkit';
import { generateWithResilience } from '../resilience';
import { blackboard } from '../context';

export const ArtistInputSchema = z.object({
    concept: z.string(),
});

/**
 * Module H: The Metaphor Engine (Artist)
 * Objective: Convert abstract concepts into 3D Voxel sculptures.
 * Integrated with the Quantum Bridge (Blackboard).
 */
export const artistAgent = ai.defineFlow(
    {
        name: 'artistAgent',
        inputSchema: ArtistInputSchema,
        outputSchema: WorldStateSchema,
    },
    async (input) => {
        const blackboardFragment = blackboard.getSystemPromptFragment();
        const output = await generateWithResilience({
            prompt: `Visualize this abstract concept as 3D Voxel art: "${input.concept}"`,
            system: `
                You are the Artist Agent of the Genesis Engine.
                Your role is to visualize abstract concepts as 3D Voxel Art.
                
                ${blackboardFragment}

                TASK:
                1. Translate the concept (e.g. "Inflation") into a set of 3D cubes.
                2. Set the WorldState 'mode' to 'VOXEL'.
                3. Use vibrant colors and creative spatial arrangements.
                4. Grid size: 16x16x16.
            `,
            schema: WorldStateSchema,
            retryCount: 2
        });

        if (!output) throw new Error('Artist failed to visualize concept.');
        return output;
    }
);
