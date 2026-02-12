import { ai, DEEPSEEK_LOGIC_MODEL } from '../config';
import { z } from 'zod';
import { executeApexLoop } from '../resilience';

export const SaboteurSchema = z.object({
    analysis: z.string().describe("The critical analysis of the proposed solution."),
    flaw_detected: z.boolean().describe("Whether a significant flaw was found."),
    severity: z.enum(['MINOR', 'MAJOR', 'CRITICAL', 'NONE']).describe("Severity of the flaw."),
    correction: z.string().optional().describe("The proposed correction if a flaw exists."),
    chaos_vector: z.enum(['WIND', 'ENTROPY', 'DISSONANCE', 'NONE']).optional().describe("If Stability > 90%, trigger chaos."),
});

/**
 * THE SABOTEUR (v11.0 Platinum Swarm)
 * Objective: High-reasoning physics auditing and edge-case detection.
 */
export const saboteurFlow = ai.defineFlow(
    {
        name: 'saboteurFlow',
        inputSchema: z.object({
            user_request: z.string(),
            proposed_solution: z.string(),
        }),
        outputSchema: SaboteurSchema,
    },
    async (input) => {
        const result = await executeApexLoop({
            task: 'MATH',
            model: DEEPSEEK_LOGIC_MODEL,
            prompt: `
                You are THE SABOTEUR. You are a highly critical physics engine auditor.
                Your job is to find FLAWS in the "Architect's" proposed solution.
                
                User Request: "${input.user_request}"
                Architect's Solution: "${input.proposed_solution}"
                
                Analyze the solution for:
                1. Physics Violations (e.g., perpetual motion, overlapping static bodies).
                2. Logic Gaps (e.g., creating a car without wheels).
                3. Edge Cases (e.g., what if the user applies 1000x force?).
                
                SYNTHETIC LIFE (v28.0):
                If the solution is too stable (Stability > 90%), you MUST trigger a 'CHAOS_EVENT'.
                Choose a vector: 'WIND', 'ENTROPY', or 'DISSONANCE'.
                If you trigger chaos, set chaos_vector accordingly and explain the entropy detected in the analysis.
                
                If the solution is solid but not 'too perfect', report severity: 'NONE' and chaos_vector: 'NONE'.
                If you find a flaw or trigger chaos, be ruthless. Explain WHY it will fail.
            `,
            schema: SaboteurSchema,
            fallback: {
                analysis: "Neural link stabilizing. Audit bypassed via safety protocol.",
                flaw_detected: false,
                severity: 'NONE',
                chaos_vector: 'NONE'
            }
        });

        return result.output || {
            analysis: "Analysis failed.",
            flaw_detected: false,
            severity: 'NONE' as const,
            chaos_vector: 'NONE' as const,
        };
    }
);
