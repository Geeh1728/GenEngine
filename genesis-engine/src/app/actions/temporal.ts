'use server';

import { ai, geminiFlash } from "@/lib/genkit/config";
import { WorldState, WorldStateSchema } from "@/lib/simulation/schema";
import { z } from "zod";

/**
 * TEMPORAL ANCHOR (v24.0 Oracle)
 * Objective: Semantic merge of historical states with current intent.
 * Logic: Finds a historical state and patches it with new parameters.
 */

export async function semanticUndo(intent: string, history: WorldState[], currentState: WorldState) {
    try {
        console.log(`[Temporal] Processing Semantic Undo: "${intent}"...`);

        const response = await ai.generate({
            model: geminiFlash.name,
            prompt: `
            ROLE: You are the "Temporal Oracle". 
            
            USER INTENT: "${intent}"
            
            CURRENT STATE:
            ${JSON.stringify(currentState)}
            
            HISTORY (Last 5 states):
            ${JSON.stringify(history.slice(-5))}
            
            TASK:
            The user wants to go back in time but keep some current changes.
            Identify the target historical state and perform a SEMANTIC MERGE.
            
            Example: "Go back to before it fell but keep the Mars gravity"
            -> Find state where height was high.
            -> Keep gravity from CURRENT STATE.
            
            OUTPUT JSON:
            Return a full WorldState object.
            `,
            output: { schema: WorldStateSchema }
        });

        if (!response.output) throw new Error("Temporal merge failed.");

        return { success: true, worldState: response.output as WorldState };

    } catch (error) {
        console.error("[Temporal] Error:", error);
        return { success: false, error: String(error) };
    }
}
