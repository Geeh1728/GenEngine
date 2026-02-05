'use server';

import { WorldState } from '@/lib/simulation/schema';
import { orchestratorFlow } from '@/lib/genkit/agents/orchestrator';
import { translatorAgent } from '@/lib/genkit/agents/translator';

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
            isSabotageMode: false,
            isSaboteurReply: false
        });

        if (result.status === 'ERROR' || !result.worldState) {
            throw new Error(String(result.message || 'Failed to translate physics intent'));
        }

        // Map Orchestrator output to legacy Babel output for compatibility
        return {
            success: true,
            physicsDelta: result.worldState as WorldState,
            translatedCommentary: String(result.nativeReply || (result.worldState as WorldState).explanation || ''),
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

/**
 * ASTRA PROTOCOL: Native Audio Processing (v8.0)
 * 1. Audio -> Translator (Gemini Audio) -> English Intent
 * 2. English Intent -> Orchestrator -> Physics Delta
 */
export async function processNativeAudio(
    audioBase64: string,
    currentWorldState: WorldState
): Promise<BabelOutput> {
    try {
        console.log("Processing Native Audio via Astra Protocol...");
        
        // Step 1: Translate Audio to Intent
        const translation = await translatorAgent({
            audioBase64,
            contentType: 'audio/webm',
            worldState: currentWorldState
        });

        console.log("Astra Translation:", translation.englishIntent);

        // Step 2: Execute Intent via Orchestrator
        const result = await orchestratorFlow({
            audioTranscript: translation.englishIntent,
            text: `Target Language: ${translation.detectedLanguage}. Current State Context: ${JSON.stringify(currentWorldState)}`,
            mode: 'AUTO',
            isSabotageMode: false,
            isSaboteurReply: false
        });

        return {
            success: true,
            physicsDelta: (result.worldState as WorldState) || {},
            translatedCommentary: translation.nativeReply,
            originalIntent: translation.englishIntent
        };

    } catch (error) {
        console.error('Astra Processing Error:', error);
        return {
            success: false,
            physicsDelta: {},
            translatedCommentary: "I couldn't hear you clearly.",
            error: String(error)
        };
    }
}
