'use server';

import { artistAgent } from '@/lib/genkit/agents/artist';
import { WorldState } from '@/lib/simulation/schema';

/**
 * Mastery Trophy Minter (v9.0)
 * Objective: Generate a unique Voxel sculpture based on user mastery.
 */
export async function mintMasteryTrophy(goal: string, context: string) {
    try {
        console.log(`[Mastery] Minting Voxel Trophy for: ${goal}`);
        
        const trophy = await artistAgent({
            concept: `A scientific trophy representing mastery of: ${goal}. ${context}`,
        });

        return {
            success: true,
            trophy: trophy as WorldState
        };
    } catch (error) {
        console.error("Mastery Minting failed:", error);
        return { success: false, error: String(error) };
    }
}
