'use server';

import { google } from "@genkit-ai/googleai";
import { generate } from "@genkit-ai/ai";
import { z } from "zod";
import { geminiFlash } from "@/lib/genkit/config";

// --- The Babel Node: Universal Translator ---

/**
 * Translates user speech into Physics Intent + Localized Commentary.
 */
export async function translatePhysicsIntent(transcript: string, targetLang: string = 'English') {
    try {
        console.log(`[BabelNode] Translating: "${transcript}" to ${targetLang}...`);

        const response = await generate({
            model: geminiFlash.name,
            prompt: `
            Role: Interpreter and Physics Engine.
            Input: User said: "${transcript}".
            Task:
            1. Analyze if the user wants to change the simulation (e.g., 'Make it heavier' -> { mass: current * 1.5 }).
            2. Translate the meaning of what they said into "${targetLang}".
            
            Output JSON:
            {
              "physicsDelta": { ...partial WorldState updates... },
              "translatedCommentary": "The translated text for TTS",
              "originalIntent": "What they actually meant"
            }
            Constraint: Use JSON format only.
            `,
            output: { format: "json" }
        });

        if (!response.output()) {
            throw new Error("Babel translation returned empty output.");
        }

        return { success: true, data: response.output() };

    } catch (error) {
        console.error("[BabelNode] Translation Failed:", error);
        return { success: false, error: String(error) };
    }
}