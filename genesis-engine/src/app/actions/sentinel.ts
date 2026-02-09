'use server';

import { executeApexLoop } from '@/lib/genkit/resilience';
import { z } from 'genkit';
import { visualCortexFlow } from '@/lib/genkit/agents/visualCortex';
import { WorldRuleSchema } from '@/lib/genkit/schemas';

// --- The Sentinel: Physics Lawyer ---

/**
 * Validates a user's simulation action against the Ingested Rules (Ground Truth).
 */
export async function validateSimAction(action: string, currentState: any, ingestedRules: z.infer<typeof WorldRuleSchema>[]) {
    try {
        console.log(`[Sentinel] Validating action: "${action}" against ${ingestedRules.length} rules...`);

        const result = await executeApexLoop({
            task: 'MATH', // DeepSeek Logic
            prompt: `
            ROLE: You are the "Sentinel Physics Lawyer".
            
            CONTEXT:
            User Action: "${action}"
            Current State: ${JSON.stringify(currentState)}
            
            LEGAL CODE (Ingested Rules):
            ${JSON.stringify(ingestedRules.map(r => `Rule ${r.id}: ${r.rule} (Source: ${r.grounding_source})`))}
            
            TASK:
            Does the user's action or the resulting state violate any of the rules?
            
            OUTPUT JSON:
            {
                "isViolation": boolean,
                "violatedRuleId": string | null,
                "citation": string | null, // e.g., "Page 14, Paragraph 2"
                "explanation": string // "You cannot boil X at 50C because Rule 5 states boiling point is 78C."
            }
            `,
            schema: z.object({
                isViolation: z.boolean(),
                violatedRuleId: z.string().nullable(),
                citation: z.string().nullable(),
                explanation: z.string()
            })
        });

        return { success: true, validation: result.output };

    } catch (error) {
        console.error("[Sentinel] Validation Failed:", error);
        return { success: false, error: String(error) };
    }
}

export async function runNeuralRCA(history: any[]) {
    try {
        const rca = await executeApexLoop({
            task: 'MATH',
            prompt: `ANALYZE PHYSICS FAILURE: Here is the history of the last 5 frames: 
            ${JSON.stringify(history)}
            Explain why the simulation exploded or clipped. Identify the exact entity ID and parameter (e.g. Mass, Restitution).`,
            schema: z.object({
                reason: z.string(),
                failedEntityId: z.string(),
                mitigation: z.string()
            })
        });

        return { success: true, analysis: rca.output };
    } catch (error) {
        console.error("[Sentinel RCA] Failed:", error);
        return { success: false, error: String(error) };
    }
}

export async function analyzeStructuralIntegrity(imageBase64: string, context?: string) {
    try {
        // Strip data:image/png;base64, prefix if present
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        
        const result = await visualCortexFlow({
            imageBase64: base64Data,
            context
        });

        return { success: true, data: result };
    } catch (error) {
        console.error("Structural Analysis Error:", error);
        return { success: false, error: "Failed to analyze structure." };
    }
}
