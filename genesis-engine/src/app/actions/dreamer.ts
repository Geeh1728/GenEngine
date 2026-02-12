'use server';

import { dreamerAgent } from '@/lib/genkit/agents/dreamer';
import { WorldRuleSchema } from '@/lib/genkit/schemas';
import { WorldState } from '@/lib/simulation/schema';
import { z } from 'genkit';

/**
 * DREAMING SCIENTIST SERVER ACTION
 * Objective: Run the Dreamer agent on server to avoid client-side gRPC dependencies.
 */

export async function dreamDiscoveryAction(
    currentRules: any[],
    currentWorldState: WorldState | undefined,
    mode: 'EXPLORE' | 'EVOLVE'
) {
    try {
        const discovery = await dreamerAgent({
            currentRules,
            currentWorldState,
            mode
        });

        return { success: true, discovery };
    } catch (error) {
        console.warn("[DreamerAction] REM cycle failed:", error);
        return { success: false, error: String(error) };
    }
}
