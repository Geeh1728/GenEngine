'use server';

import { ai, ROBOTICS_MODEL_NAME, geminiFlash } from '@/lib/genkit/config';
import { embeddingModel } from '@/lib/google';
import { shieldInput, shieldOutput, checkRateLimit } from '@/lib/security/armor';
import { orchestratorFlow } from '@/lib/genkit/agents/orchestrator';
import { architectFlow } from '@/lib/genkit/agents/architect';
import { sanitizeInput } from '@/lib/utils/text';

import { SkillTree } from '@/lib/genkit/schemas';

export async function generateCurriculum(userGoal: string): Promise<SkillTree | null> {
    try {
        // This runs the EXACT logic you tested in the CLI
        const result = await architectFlow({ userGoal });
        return result;
    } catch (error) {
        console.error("Architect failed:", error);
        return null;
    }
}

/**
 * Kinetic Core: The Physics Bridge
 * Compiles a user hypothesis into a valid physical WorldState JSON.
 */
export async function compileHypothesis(hypothesis: string, context: string, fileUri?: string): Promise<ReturnType<typeof generateSimulationLogic>> {
    return generateSimulationLogic(hypothesis, context, null, fileUri);
}

import { WorldState, Entity } from '@/lib/simulation/schema';
import { Quest } from '@/lib/genkit/agents/questAgent';
import { StructuralAnalysis } from '@/lib/genkit/schemas';

export async function generateSimulationLogic(
    hypothesis: string, 
    context: string, 
    currentWorldState?: WorldState | null, 
    fileUri?: string,
    previousInteractionId?: string
): Promise<
    | { success: true; worldState: WorldState; interactionId?: string; quest: Quest | undefined; isSabotaged: boolean; logs?: any[] }
    | { success: false; isBlocked: true; error: string; message: string; nativeReply: string; logs?: any[] }
    | { success: false; error: string; logs?: any[] }
> {
    try {
        // 1. Rate Limit Check
        const isRateLimited = !(await checkRateLimit());
        if (isRateLimited) throw new Error('Neural link bandwidth exceeded. Please wait.');

        // 2. Input Armor
        const armorResult = await shieldInput(hypothesis);
        if (!armorResult.isSafe) {
            throw new Error(armorResult.reason || 'Input rejected by security shield.');
        }

        const sanitizedHypothesis = armorResult.sanitizedContent || hypothesis;

        // CONTEXT INJECTION: Add World State Summary if available
        let fullPrompt = `Context:\n${context}\n\nHypothesis: ${sanitizedHypothesis}`;
        if (currentWorldState) {
            const entitySummary = currentWorldState.entities?.map((e: Entity) => `${e.color || 'gray'} ${e.type} at [${e.position.x}, ${e.position.y}]`).join(', ');
            fullPrompt += `\n\nCURRENT SIMULATION STATE:\n- Mode: ${currentWorldState.mode}\n- Entities: ${entitySummary || 'None'}\n- Gravity: Y=${currentWorldState.environment?.gravity?.y}`;
        }

        // Module D: The Saboteur (20% chance of activation)
        const isSabotageMode = Math.random() < 0.2;

        // 3. Execute Council of Agents (Orchestrator)
        const result = await orchestratorFlow(
            {
                text: fullPrompt,
                mode: 'AUTO',
                isSabotageMode: isSabotageMode,
                isSaboteurReply: false,
                fileUri,
                previousInteractionId
            }
        );

        if (result.status === 'BLOCKED') {
            return {
                success: false,
                isBlocked: true,
                // Map message to 'error' so OmniBar displays it correctly
                error: String(result.message || 'Input rejected by the Socratic Saboteur.'),
                message: String(result.message || ''),
                nativeReply: String(result.nativeReply || ''),
                logs: result.logs
            };
        }

        if (result.status === 'ERROR' || !result.worldState) {
            throw new Error(String(result.message || 'AI failed to compile the hypothesis.'));
        }

        // 4. Output Armor
        const outputArmor = await shieldOutput(result.worldState);
        if (!outputArmor.isSafe) {
            throw new Error(outputArmor.reason || 'Output blocked by security shield.');
        }

        return {
            success: true,
            worldState: result.worldState as WorldState,
            interactionId: result.interactionId,
            quest: result.quest,
            isSabotaged: !!(result.worldState as WorldState).sabotage_reveal,
            logs: result.logs
        };
    } catch (error) {
        console.error('Kinetic Core Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown compilation error'
        };
    }
}

/**
 * Multimodal Gateway: Process Text, Image, or Audio
 */
export async function processMultimodalIntent(params: {
    text?: string;
    image?: string;
    audioTranscript?: string;
    mode?: 'AUTO' | 'PHYSICS' | 'VOXEL' | 'SCIENTIFIC';
    fileUri?: string;
    isSaboteurReply?: boolean;
    previousInteractionId?: string;
}): Promise<
    | { success: true; worldState: WorldState; visionData: StructuralAnalysis | undefined; quest: Quest | undefined; nativeReply: string; interactionId?: string; logs?: any[] }
    | { success: false; isBlocked: true; message: string; nativeReply: string; logs?: any[] }
    | { success: false; error: string; logs?: any[] }
> {
    try {
        if (!(await checkRateLimit())) throw new Error('Neural link bandwidth exceeded.');

        // SANITIZE HERE: Strip harmful box-characters that crash the API
        const cleanText = params.text ? sanitizeInput(params.text) : params.text;

        const result = await orchestratorFlow({
            mode: 'AUTO',
            ...params,
            text: cleanText, // Use sanitized text
            isSabotageMode: Math.random() < 0.2,
            fileUri: params.fileUri,
            isSaboteurReply: params.isSaboteurReply ?? false,
            previousInteractionId: params.previousInteractionId
        });

        if (result.status === 'BLOCKED') {
            return {
                success: false,
                isBlocked: true,
                message: String(result.message || ''),
                nativeReply: String(result.nativeReply || ''),
                logs: result.logs
            };
        }

        if (result.status === 'ERROR' || !result.worldState) {
            throw new Error(String(result.message || 'Multimodal processing failed.'));
        }

        return {
            success: true,
            worldState: result.worldState as WorldState,
            visionData: result.visionData,
            quest: result.quest,
            nativeReply: String(result.nativeReply || ''),
            interactionId: result.interactionId,
            logs: result.logs
        };
    } catch (error) {
        console.error('Multimodal Gateway Error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to process multimodal intent' };
    }
}

/**
 * Generates an embedding for a given text.
 * Used for client-side PGLite queries.
 */
export async function getEmbedding(text: string): Promise<{ success: true; embedding: number[] } | { success: false; error: string }> {
    try {
        // 1. Input Armor
        const armorResult = await shieldInput(text);
        if (!armorResult.isSafe) {
            throw new Error(armorResult.reason || 'Input rejected by security shield.');
        }

        const result = await embeddingModel.embedContent(armorResult.sanitizedContent || text);
        return { success: true, embedding: result.embedding.values };
    } catch (error) {
        console.error('Embedding Error:', error);
        return { success: false, error: 'Failed to generate embedding' };
    }
}

/**
 * Genesis Lens: Analyze real-world images using Robotics/Vision models.
 * Toggles between expensive Robotics-ER (Paid) and Flash (Free).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function analyzeRealWorldImage(imageBase64: string, userIsPremium: boolean): Promise<{ success: true; analysis: any } | { success: false; error: string }> {
    try {
        // 1. Rate Limit
        if (!(await checkRateLimit())) throw new Error('Vision link bandwidth exceeded.');

        const modelName = userIsPremium
            ? ROBOTICS_MODEL_NAME
            : geminiFlash.name;

        const systemPrompt = userIsPremium
            ? "You are a Spatial Robotics Engine. Output 3D bounding boxes [cx, cy, cz, w, h, d, r, p, y]."
            : "You are a 2D Vision Engine. Output 2D bounding boxes [ymin, xmin, ymax, xmax].";

        const { output } = await ai.generate({
            model: modelName,
            system: systemPrompt,
            prompt: [
                { text: "Analyze this scene for physical objects and their spatial coordinates." },
                { media: { url: imageBase64, contentType: 'image/jpeg' } }
            ],
            output: { format: "json" }
        });

        return { success: true, analysis: output };
    } catch (error) {
        console.error('Genesis Lens Error:', error);
        return { success: false, error: 'Failed to analyze image' };
    }
}
