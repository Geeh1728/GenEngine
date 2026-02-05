'use server';

import { executeApexLoop } from '@/lib/genkit/resilience';
import { z } from 'genkit';

const PodcastScriptSchema = z.array(z.object({
    host: z.enum(['A', 'B']),
    text: z.string()
}));

/**
 * Genesis Radio: The Audio Bridge (v11.0 Platinum Swarm)
 * Objective: Convert scientific data into engaging viral dialogue.
 */
export async function generatePodcastScript(content: string): Promise<{ host: 'A' | 'B', text: string }[]> {
    try {
        const result = await executeApexLoop({
            task: 'CHAT',
            prompt: `
                You are a world-class podcast producer. 
                Convert the following educational content into a viral, engaging podcast script between two hosts:
                
                Host A (Nexus): Enthusiastic, uses metaphors, high energy.
                Host B (Skeptic): Analytical, asks "but how?", needs practical examples.
                
                The dialogue should be natural, including filler words like "um", "ah", and "wait, let me get this straight".
                Keep it under 5 minutes of speech.
                
                Content:
                ${content.substring(0, 10000)}
            `,
            schema: PodcastScriptSchema,
            fallback: [{ host: "A", text: "Establishing neural link for audio transmission. Please stand by." }]
        });

        return result.output || [{ host: "A", text: "Neural link failed to stabilize script." }];
    } catch (e) {
        console.error("Failed to generate podcast script:", e);
        return [{ host: "A", text: "I'm sorry, I couldn't generate the script for this content." }];
    }
}
