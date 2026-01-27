import { ai } from '../config';
import { WorldStateSchema } from '../../simulation/schema';
import { z } from 'genkit';
import { generateWithResilience } from '../resilience';
import { blackboard } from '../context';

export const ArtistInputSchema = z.object({
    concept: z.string(),
    fileUri: z.string().optional().describe('Gemini File API URI for grounding.'),
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
        const { concept, fileUri } = input;
        const blackboardFragment = blackboard.getSystemPromptFragment();
        const output = await generateWithResilience({
            prompt: [
                { text: `Visualize this abstract concept as 3D Voxel art: "${concept}"` },
                ...(fileUri ? [{ media: { url: fileUri, contentType: 'application/pdf' } }] : [])
            ],
            system: `
                You are the Artist Agent of the Genesis Engine.
                Your role is to visualize abstract concepts as 3D Voxel Art.
                
                ${blackboardFragment}

                GROUNDING PROTOCOL:
                If a file is provided, search it for symbols, metaphors, or structural descriptions related to the concept.

                TASK:
                1. Translate the concept (e.g. "Inflation") into a set of 3D cubes.
                2. Set the WorldState 'mode' to 'VOXEL'.
                3. Use vibrant colors and creative spatial arrangements.
                4. Grid size: 16x16x16.
            `,
            schema: WorldStateSchema,
            retryCount: 2,
            fallback: {
                scenario: "Fallback Metaphor Visualization",
                mode: "VOXEL",
                description: "A default voxel sculpture provided when the visualization engine fails.",
                explanation: "Visualization failed, but here is a default representation.",
                constraints: ["Static voxel grid", "Fixed position"],
                successCondition: "The sculpture is rendered.",
                entities: [{ 
                    id: "fallback-voxel", 
                    type: "cube", 
                    position: { x: 0, y: 0, z: 0 }, 
                    rotation: { x: 0, y: 0, z: 0 },
                    dimensions: { x: 2, y: 2, z: 2 },
                    physics: { mass: 0, friction: 0.5, restitution: 0.5 },
                    isStatic: true,
                    color: "#a855f7",
                    name: "Resilience Voxel"
                }]
            }
        });

        if (!output) throw new Error('Artist failed to visualize concept even with fallback.');
        return output;
    }
);
