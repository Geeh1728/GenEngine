'use server';

import { artistAgent } from '@/lib/genkit/agents/artist';

/**
 * Metaphor Engine: Voxel Generator
 * Objective: Convert abstract concepts into 3D Voxel Art.
 */
export async function generateMetaphorVoxel(concept: string) {
    try {
        const output = await artistAgent.run({
            concept
        });

        if (!output) throw new Error('Failed to generate voxel metaphor');

        return { success: true, data: output };
    } catch (error) {
        console.error('Metaphor Engine Error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}
