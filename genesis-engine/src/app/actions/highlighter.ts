'use server';

import { executeApexLoop } from '@/lib/genkit/resilience';
import { z } from 'genkit';
import { WorldStateSchema } from '@/lib/simulation/schema';

/**
 * MODULE N-H: NEURAL HIGHLIGHTER (v32.5)
 * Objective: Convert a highlighted sentence from a PDF into a 3D simulation.
 */
export async function manifestHighlight(text: string, context?: string) {
    try {
        console.log(`[NeuralHighlighter] Manifesting: "${text}"`);

        const result = await executeApexLoop({
            task: 'PHYSICS',
            prompt: `
            ROLE: The Neural Highlighter.
            TASK: You are an expert at converting text snippets into physical reality.
            
            HIGHLIGHTED TEXT: "${text}"
            CONTEXT: ${context || 'None'}
            
            INSTRUCTION:
            1. Extract the physical intent from the highlight. 
               (e.g., "Gravity is 9.8" -> set environment.gravity.y = -9.8)
               (e.g., "A heavy steel box" -> create a box entity with mass 500 and color 'gray')
            2. Return a valid WorldState JSON.
            `,
            schema: WorldStateSchema
        });

        return { success: true, worldState: result.output };

    } catch (error) {
        console.error("[NeuralHighlighter] Failed:", error);
        return { success: false, error: String(error) };
    }
}
