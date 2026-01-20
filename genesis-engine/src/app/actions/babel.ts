'use server';

import { WorldState } from '@/lib/simulation/schema';
import { orchestratorFlow } from '@/lib/genkit/agents/orchestrator';

export type BabelOutput = {
    success: boolean;
    physicsDelta: Partial<WorldState>;
    translatedCommentary: string;
    originalIntent?: string;
    error?: string;
};

/**
 * The Babel Node: Semantic Translation Loop
 * Translates speech into physical intent and commentary.
 */
export async function translatePhysicsIntent(
    transcript: string,
    currentWorldState: WorldState,
    targetLang: string = 'English'
): Promise<BabelOutput> {
    try {
        const result = await orchestratorFlow({
            audioTranscript: transcript,
            text: `Target Language: ${targetLang}. Current State Context: ${JSON.stringify(currentWorldState)}`,
            mode: 'AUTO',
            isSabotageMode: false
        });

        if (result.status === 'ERROR' || !result.worldState) {
            throw new Error(result.message || 'Failed to translate physics intent');
        }

        // Map Orchestrator output to legacy Babel output for compatibility
        return { 
            success: true, 
            physicsDelta: result.worldState, 
            translatedCommentary: result.nativeReply || result.worldState.explanation || '',
            originalIntent: transcript
        };
    } catch (error) {
        console.error('Babel Node Error:', error);
        return {
            success: false,
            physicsDelta: {},
            translatedCommentary: '',
            error: error instanceof Error ? error.message : 'Unknown translation error'
        };
    }
}
