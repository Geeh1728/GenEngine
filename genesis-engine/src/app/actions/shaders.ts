'use server';

import { executeApexLoop } from '@/lib/genkit/resilience';
import { z } from 'zod';

const ShaderVariantsSchema = z.object({
    variants: z.array(z.string()).length(3)
});

/**
 * Shader Evolution Engine (v19.0)
 * Objective: Generate visually complex GLSL variations in the background.
 */
export async function evolveShader(currentShader: string) {
    try {
        const result = await executeApexLoop({
            task: 'REFLEX',
            prompt: `ACT AS SHADER ARTIST: Take this current GLSL fragment shader and evolve it to be more visually complex and beautiful. 
            Focus on 'Neural Light' aesthetics. Return 3 variants in a JSON array.
            CURRENT: ${currentShader}`,
            schema: ShaderVariantsSchema
        });

        return { 
            success: true, 
            variants: result.output?.variants || [] 
        };
    } catch (error) {
        console.error("[Shader Action] Failed:", error);
        return { success: false, error: String(error) };
    }
}
