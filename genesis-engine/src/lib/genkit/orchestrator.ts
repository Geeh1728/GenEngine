import { z } from 'genkit';
import { ai } from './config';
import { WorldState } from '../simulation/schema';
import { simulationFlow } from './simulation';
import { inferBiomeFromText } from '../simulation/biomes';

// --- MUTATION SCHEMA ---
// We only need a partial schema for updates
const MutationSchema = z.object({
    entities: z.array(z.any()).optional(), // We'll accept any entity updates provided by LLM
    environment: z.object({
        gravity: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
        biome: z.string().optional(),
        timeScale: z.number().optional()
    }).optional(),
    camera: z.any().optional(),
    userFeedback: z.string().optional() // Orchestrator might talk back
});

// --- MUTATION FLOW ---
export const mutationFlow = ai.defineFlow(
    {
        name: 'mutationFlow',
        inputSchema: z.object({
            userIntent: z.string(),
            currentWorldState: z.any(), // Taking raw JSON to avoid strict validation issues during flow
        }),
        outputSchema: MutationSchema,
    },
    async (input) => {
        const { userIntent, currentWorldState } = input;

        // Fast-path: Biome Inference (Heuristic) before calling LLM
        // This makes "make it space" instant-ish
        const detectedBiome = inferBiomeFromText(userIntent);
        let systemPrompt = `
            You are the "Vibe Coder" Physics Engine. 
            The user wants to MUTATE the running simulation. 
            
            CURRENT SCENARIO: ${currentWorldState.scenario || 'Unknown'}
            USER INTENT: "${userIntent}"

            RULES:
            1. DO NOT reset the world. Only return properties that CHANGE.
            2. If the user asks for a physics change (gravity, bounce, friction), update the specific entities or global environment.
            3. If the user asks for a visual change (color, shape), update the entities.
            4. If the user's request corresponds to a BIOME (Space, Ocean, etc.), set 'environment.biome'.
            
            Return JSON matching the schema.
        `;

        if (detectedBiome) {
            systemPrompt += `\n HINT: The user seems to want the '${detectedBiome}' biome.`;
        }

        const result = await ai.generate({
            prompt: systemPrompt,
            output: { schema: MutationSchema }
        });

        if (!result.output) {
            throw new Error("Failed to vibe with the physics.");
        }

        // If heuristic detected a biome but LLM missed it, force it (optional, but good for reliability)
        if (detectedBiome && !result.output.environment?.biome) {
            result.output.environment = {
                ...result.output.environment,
                biome: detectedBiome
            };
        }

        return result.output;
    }
);

// --- MAIN ORCHESTRATOR ---
// This is the entry point for the OmniBar
export const orchestrateFlow = async (
    userIntent: string,
    currentWorldState: WorldState | null,
    context?: string
) => {
    // 1. DECISION LOGIC: Create vs Mutate
    // If we have a valid worldState and the intent is NOT explicitly "reset" or "new", we try to mutate.
    const isCreation = !currentWorldState ||
        userIntent.toLowerCase().startsWith('create') ||
        userIntent.toLowerCase().startsWith('new') ||
        userIntent.toLowerCase().includes('reset');

    if (isCreation) {
        // --- CREATION PATH ---
        console.log("[Orchestrator] Path: CREATION");
        // We reuse the existing simulationFlow
        // We might need to map arguments to match what simulationFlow expects
        const result = await simulationFlow({
            pdfContent: context || "User Prompt: " + userIntent, // simulationFlow expects PDF/Context
            userIntent: userIntent
        });

        return {
            type: 'CREATION',
            data: result
        };
    } else {
        // --- MUTATION PATH ---
        console.log("[Orchestrator] Path: MUTATION");
        const result = await mutationFlow({
            userIntent,
            currentWorldState
        });

        return {
            type: 'MUTATION',
            data: result
        };
    }
};
