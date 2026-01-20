import { ai } from '../config';
import { z } from 'genkit';
import { generateWithResilience } from '../resilience';

export const TranslatorInputSchema = z.object({
    userAudioTranscript: z.string(),
});

export const TranslatorOutputSchema = z.object({
    englishIntent: z.string().describe('The translated intent in English for the physicist agent'),
    nativeReply: z.string().describe('A reply in the user\'s native language'),
    detectedLanguage: z.string(),
});

/**
 * Module F: The Babel Agent
 * Objective: Translate user speech/text into English intent for the Council of Agents.
 */
export const translatorAgent = ai.defineFlow(
    {
        name: 'translatorAgent',
        inputSchema: TranslatorInputSchema,
        outputSchema: TranslatorOutputSchema,
    },
    async (input) => {
        const output = await generateWithResilience({
            prompt: `Translate this user input into a clear English physics intent: "${input.userAudioTranscript}"`, 
            system: `
                You are the "Babel Agent" of the Genesis Engine.
                Your role is to act as a Universal Translator for physics.
                
                TASK:
                1. Detect the language of the input.
                2. Translate the intent into clear English for a physics engine (e.g., "Make gravity zero").
                3. Provide a friendly reply in the detected native language acknowledging the command.
                
                If the input is already in English, the EnglishIntent should be the same as the input.
            `,
            schema: TranslatorOutputSchema,
            retryCount: 2
        });

        if (!output) throw new Error('Translator failed to process input.');
        return output;
    }
);

