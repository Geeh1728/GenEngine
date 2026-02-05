import { ai, geminiAudio } from '../config';
import { z } from 'genkit';
import { generateWithResilience } from '../resilience';
import { WorldStateSchema } from '../schemas';

export const TranslatorInputSchema = z.object({
    userAudioTranscript: z.string().optional().describe('Text transcript if available'),
    audioBase64: z.string().optional().describe('Raw audio data for multimodal models'),
    contentType: z.string().optional().default('audio/wav'),
    worldState: WorldStateSchema.optional(),
});

export const TranslatorOutputSchema = z.object({
    englishIntent: z.string().describe('The translated intent in English for the physicist agent'),
    nativeReply: z.string().describe('A friendly reply in the user\'s native language with a scientific analogy.'),
    detectedLanguage: z.string(),
});

/**
 * Module Z: Adaptive Babel (Titan Protocol v4.0)
 * Objective: Translate student's Mother Tongue intent into Physics Variables with cultural analogies.
 * Updated for Astra Mode (Native Audio)
 */
export const translatorAgent = ai.defineFlow(
    {
        name: 'translatorAgent',
        inputSchema: TranslatorInputSchema,
        outputSchema: TranslatorOutputSchema,
    },
    async (input) => {
        const { userAudioTranscript, audioBase64, contentType, worldState } = input;
        const worldContext = worldState ? `CURRENT PHYSICS STATE: ${JSON.stringify(worldState)}` : 'No active simulation context.';

        const promptParts: any[] = [
            {
                text: `
                ${worldContext}
                
                USER INPUT (Audio/Text):
                ${userAudioTranscript ? `Transcript: "${userAudioTranscript}"` : 'Processing Audio Input...'}
                `
            }
        ];

        if (audioBase64) {
            promptParts.push({
                media: { url: audioBase64, contentType: contentType || 'audio/wav' }
            });
        }

        const output = await generateWithResilience({
            model: geminiAudio.name,
            prompt: promptParts,
            system: `
                You are the "Babel Agent" of the Genesis Engine (Astra Mode).
                Your role is to act as a Universal Translator for physics and a cultural bridge.
                
                TASK:
                1. Listen to the user's voice (or read text).
                2. Detect the language.
                3. Translate the intent into clear English for a physics engine.
                4. Provide a friendly reply in the detected native language.
                
                CULTURAL ANALOGY RULE:
                - Use the student's mother tongue.
                - Use scientific analogies native to the user's culture.
                - Ground the explanation in the specific Physics Variables provided.

                If the input is already in English, the EnglishIntent should be the same as the input.
            `,
            schema: TranslatorOutputSchema,
            retryCount: 2,
            fallback: {
                englishIntent: userAudioTranscript || "Unknown Intent",
                nativeReply: "I heard you, but the signal was static. Could you repeat that?",
                detectedLanguage: "Unknown"
            }
        });

        if (!output) throw new Error('Translator failed to process input even with fallback.');
        return output;
    }
);

