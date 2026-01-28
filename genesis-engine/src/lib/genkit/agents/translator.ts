import { ai, geminiAudio } from '../config';
import { z } from 'genkit';
import { generateWithResilience } from '../resilience';
import { WorldStateSchema } from '../schemas';

export const TranslatorInputSchema = z.object({
    userAudioTranscript: z.string(),
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
 */
export const translatorAgent = ai.defineFlow(
    {
        name: 'translatorAgent',
        inputSchema: TranslatorInputSchema,
        outputSchema: TranslatorOutputSchema,
    },
    async (input) => {
        const { userAudioTranscript, worldState } = input;
        const worldContext = worldState ? `CURRENT PHYSICS STATE: ${JSON.stringify(worldState)}` : 'No active simulation context.';

        const output = await generateWithResilience({
            model: geminiAudio.name,
            prompt: `
                USER INPUT: "${userAudioTranscript}"
                ${worldContext}
            `, 
            system: `
                You are the "Babel Agent" of the Genesis Engine.
                Your role is to act as a Universal Translator for physics and a cultural bridge.
                
                TASK:
                1. Detect the language of the input.
                2. Translate the intent into clear English for a physics engine (e.g., "Make gravity zero", "Spawn a cube").
                3. Provide a friendly reply in the detected native language.
                
                CULTURAL ANALOGY RULE:
                - Use the student's mother tongue to explain the physics change.
                - Use scientific analogies native to the user's culture (e.g., comparing gravity to the weight of a traditional pot, or friction to the drag of a sled on sand).
                - Ground the explanation in the specific Physics Variables provided in the WorldState.

                If the input is already in English, the EnglishIntent should be the same as the input, but the nativeReply should still provide a helpful analogy.
            `,
            schema: TranslatorOutputSchema,
            retryCount: 2,
            fallback: {
                englishIntent: userAudioTranscript, 
                nativeReply: "I've processed your intent. Let's see how it changes reality.",
                detectedLanguage: "Unknown"
            }
        });

        if (!output) throw new Error('Translator failed to process input even with fallback.');
        return output;
    }
);

