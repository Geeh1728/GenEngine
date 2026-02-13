import { z } from 'zod';
import { ai } from './config';
import { WorldState, WorldStateSchema } from '../simulation/schema';
import { simulationFlow } from './simulation';
import { inferBiomeFromText } from '../simulation/biomes';
import { MODELS } from './models';
import { blackboard } from './context';

// --- MUTATION SCHEMA ---
// We only need a partial schema for updates
const MutationSchema = z.object({
    entities: z.array(z.any()).optional(), // We'll accept any entity updates provided by LLM
    environment: z.object({
        gravity: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
        biome: z.string().optional(),
        timeScale: z.number().optional(),
        damping: z.number().optional(),
        stiffness: z.number().optional()
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
            3. PARAMETER INJECTION (v23.5):
               - "More friction" / "sluggish" -> Increase 'environment.damping'.
               - "More tension" / "stiff" -> Increase 'environment.stiffness'.
               - "Make it chaotic" -> Increase 'environment.timeScale' or randomize 'environment.gravity'.
            4. If the user asks for a visual change (color, shape), update the entities.
            5. If the user's request corresponds to a BIOME (Space, Ocean, etc.), set 'environment.biome'.
            
            Return JSON matching the schema.
        `;

        if (detectedBiome) {
            systemPrompt += `\n HINT: The user seems to want the '${detectedBiome}' biome.`;
        }

        const result = await ai.generate({
            model: MODELS.GEMMA_3_4B,
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

// --- GRAFT FLOW (v26.0) ---
export const graftFlow = ai.defineFlow(
    {
        name: 'graftFlow',
        inputSchema: z.object({
            logicSubject: z.string(),
            physicsSubject: z.string(),
        }),
        outputSchema: WorldStateSchema,
    },
    async (input) => {
        const { logicSubject, physicsSubject } = input;

        blackboard.log('Architect', `Grafting logic of ${logicSubject} onto physics of ${physicsSubject}...`, 'THINKING');

        const systemPrompt = `
            You are the Genesis Grafting Engine.
            TASK: Deep Ontological Hybridization.
            1. Extract the LOGIC/RELATIONS of '${logicSubject}'.
            2. Extract the PHYSICAL ENVIRONMENT of '${physicsSubject}'.
            3. Fuse them. (e.g. If logic is 'Revolution' and physics is 'Jupiter', the actors of the revolution are heavy, slow, and crushed by 2.4g gravity).
            
            Return a complete WorldState JSON.
        `;

        const result = await ai.generate({
            model: MODELS.BRAIN_FLASH_3,
            prompt: systemPrompt,
            output: { schema: WorldStateSchema }
        });

        if (!result.output) throw new Error("Grafting failed.");

        // Tag it as a graft
        result.output._graftSource = { logicSubject, physicsSubject };
        return result.output;
    }
);

// --- COLLABORATIVE MUTATION FLOW (v45.0 Neural Hegemony) ---
export const collaborativeMutationFlow = ai.defineFlow(
    {
        name: 'collaborativeMutationFlow',
        inputSchema: z.object({
            intents: z.array(z.string()),
            currentWorldState: z.custom<WorldState>(),
        }),
        outputSchema: MutationSchema,
    },
    async (input) => {
        const { intents, currentWorldState } = input;

        blackboard.log('Arbitrator', `Synthesizing ${intents.length} conflicting intents into a unified compromise...`, 'THINKING');

        const systemPrompt = `
            You are the Genesis Intent Arbitrator. 
            Multiple users are 'Vibe Coding' the same simulation simultaneously.
            
            CONFLICTING INTENTS:
            ${intents.map((intent, i) => `${i + 1}. "${intent}"`).join('\n')}

            CURRENT SCENARIO: ${currentWorldState.scenario || 'Unknown'}

            TASK: Deep Semantic Synthesis (Collaborative Vibe).
            1. Perform 'Semantic Weighted Averaging' on the intents.
            2. Find a creative physical compromise that respects the essence of all inputs.
            3. (e.g. If "Make it hot" and "Make it cold" are sent, the result is "Thermally Volatile").
            
            Return JSON matching the MutationSchema. Only include properties that CHANGE.
        `;

        const result = await ai.generate({
            model: MODELS.GROQ_LLAMA_4_SCOUT, // Use LPU for near-instant arbitration
            prompt: systemPrompt,
            output: { schema: MutationSchema }
        });

        if (!result.output) throw new Error("Intent Synthesis failed.");

        return result.output;
    }
);

// --- MAIN ORCHESTRATOR ---
export const orchestrateFlow = async (
    userIntent: string,
    currentWorldState: WorldState | null,
    context?: string
) => {
    // 1. ADVANCED ROUTING (Graft Detection)
    if (userIntent.toLowerCase().includes('graft') || userIntent.toLowerCase().includes('combine')) {
        console.log("[Orchestrator] Path: GRAFTING");
        // Simplified parsing - in production we'd use an LLM router
        const match = userIntent.match(/graft (.*) onto (.*)/i) || userIntent.match(/combine (.*) and (.*)/i);
        if (match) {
            return {
                type: 'GRAFT',
                data: await graftFlow({ logicSubject: match[1], physicsSubject: match[2] })
            };
        }
    }

    // 2. DECISION LOGIC: Create vs Mutate
    const isCreation = !currentWorldState ||
        userIntent.toLowerCase().startsWith('create') ||
        userIntent.toLowerCase().startsWith('new') ||
        userIntent.toLowerCase().includes('reset');

    if (isCreation) {
        // --- GHOST KERNEL (v26.0) ---
        // We trigger a fast-path 'Ghost' world using Gemma-3-Flash before the heavy architect call
        console.log("[Orchestrator] Path: CREATION (Ghost Kernel Active)");

        // Optional: Return a Ghost State if we had a streaming mechanism. 
        // For now, we simulate by ensuring the FIRST call is as fast as possible.

        const result = await simulationFlow({
            pdfContent: context || "User Prompt: " + userIntent,
            userIntent: userIntent
        });

        if (result && result.title) {
            // We can augment the result with Ghost metadata if needed
            // result._renderingStage = 'GHOST';
        }

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
