'use server';

import { sentinelAgent } from '@/lib/genkit/agents/sentinel';
import { StructuralHeatmap } from '@/lib/genkit/schemas';

export async function analyzeStructuralIntegrity(
    canvasSnapshot: string,
    sceneState: string
): Promise<{ success: true; heatmap: StructuralHeatmap } | { success: false; error: string }> {
    try {
        const result = await sentinelAgent({ canvasSnapshot, sceneState });
        return { success: true, heatmap: result };
    } catch (error) {
        console.error('Sentinel Error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Sentinel analysis failed' };
    }
}
