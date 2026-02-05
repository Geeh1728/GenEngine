'use server';

import { executeHiveSwarm } from '@/lib/genkit/agents/orchestrator';

export async function executeHiveSwarmAction(generalGoal: string, context: string) {
    try {
        const result = await executeHiveSwarm(generalGoal, context);
        return { success: true, data: result };
    } catch (error) {
        console.error("[Swarm Action] Failed:", error);
        return { success: false, error: String(error) };
    }
}
