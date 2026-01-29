import { ai, geminiFlash, gemini3Flash, BRAIN_PRIMARY, BRAIN_WORKHORSE, OPENROUTER_FREE_MODELS } from './config';
import { z } from 'genkit';
import { incrementApiUsage, getApiUsage } from '../db/pglite';

import { MessageData } from 'genkit';

interface ResilienceOptions<T extends z.ZodTypeAny> {
    prompt: string | MessageData['content'];
    schema: T;
    system?: string;
    model?: string;
    task?: 'MATH' | 'VISION' | 'INGEST' | 'GENERAL' | 'CHAT' | 'CODE';
    tools?: any[];
    config?: any;
    retryCount?: number;
    fallback?: z.infer<T>;
    onLog?: (message: string, type: 'INFO' | 'ERROR' | 'SUCCESS' | 'THINKING') => void;
    previousInteractionId?: string;
}

/**
 * THE PROMPT ADAPTER
 * Objective: Adapt instructions for different model families (Gemma, Llama, DeepSeek).
 */
function preparePromptForModel(prompt: string, modelId: string): string {
    const isGemmaOrLlama = modelId.toLowerCase().includes('gemma') || modelId.toLowerCase().includes('llama');
    const isDeepSeek = modelId.toLowerCase().includes('deepseek');

    if (isGemmaOrLlama) {
        return `
            <context>
            You are a specialized agent in the Genesis Swarm.
            </context>
            <instruction>
            ${prompt}
            </instruction>
            Final Response must be valid JSON only.
        `;
    }

    if (isDeepSeek) {
        return `${prompt}\n\nShow your step-by-step reasoning before providing the final JSON in a code block.`;
    }

    return prompt;
}

export async function executeApexLoop<T extends z.ZodTypeAny>(
    options: ResilienceOptions<T>
): Promise<{ output: z.infer<T> | null, interactionId?: string }> {
    const { prompt, schema, system, model, task = 'GENERAL', tools, config, retryCount = 2, fallback, onLog, previousInteractionId } = options;

    let attempts = 0;
    let currentModel = model || BRAIN_PRIMARY.name;
    
    // Check local quota before starting
    const usage = await getApiUsage();
    if (usage > 18 && currentModel.includes('gemini-3-flash')) {
        console.warn("[Apex] Gemini 3 quota near exhaustion. Engaging high-quota Gemma fallback.");
        if (onLog) onLog('Gemini 3 limit near (18/20). Engaging Gemma Workhorse (14.4K RPD)...', 'INFO');
        currentModel = BRAIN_WORKHORSE.name;
    }

    while (attempts <= retryCount) {
        try {
            const modelName = typeof currentModel === 'string' ? currentModel : (currentModel as any).name;
            console.log(`[Apex] Attempt ${attempts + 1} using ${modelName}`);
            if (onLog) onLog(`Swarm routing to: ${modelName}...`, 'THINKING');

            // Adapt prompt for the current model
            const rawPrompt = Array.isArray(prompt) ? (prompt[0] as any).text : prompt;
            const adaptedPrompt = preparePromptForModel(rawPrompt, modelName);

            const response = await ai.generate({
                model: modelName,
                prompt: adaptedPrompt,
                system: system,
                tools: tools,
                config: {
                    ...config,
                    previous_interaction_id: previousInteractionId
                },
                output: {
                    schema: schema,
                },
            });

            if (response.output) {
                if (modelName.includes('googleai')) {
                    await incrementApiUsage(modelName); 
                }
                if (onLog) onLog(`Neural Link established via ${modelName}.`, 'SUCCESS');
                
                const interactionId = (response as any).metadata?.interaction_id;
                return { output: response.output, interactionId };
            } else {
                throw new Error("No structured output generated.");
            }

        } catch (error: any) {
            const errorMessage = error.message || String(error);
            console.error(`[Apex] Swarm Error (${attempts + 1}):`, errorMessage);
            
            attempts++;
            if (attempts > retryCount) break;

            // Tiered Fallback Logic
            if (errorMessage.includes('429') || errorMessage.includes('500') || errorMessage.includes('limit')) {
                if (currentModel.includes('gemini-3-flash')) {
                    if (onLog) onLog(`Primary Brain saturated. Rerouting to Gemma-3 Workhorse...`, 'ERROR');
                    currentModel = BRAIN_WORKHORSE.name;
                    continue;
                } else if (currentModel.includes('googleai')) {
                    const fallbackModel = (OPENROUTER_FREE_MODELS as any)[task] || OPENROUTER_FREE_MODELS.GENERAL;
                    if (onLog) onLog(`Google Swarm saturated. Engaging Open Source Specialist (${fallbackModel})...`, 'ERROR');
                    currentModel = fallbackModel;
                    continue;
                }
            }

            if (onLog) onLog(`Self-correcting neural path...`, 'THINKING');
        }
    }

    if (onLog) onLog('All swarm routes exhausted. Using low-level fallback.', 'ERROR');
    return { output: fallback || null, interactionId: previousInteractionId };
}

// Keep generateWithResilience for backward compatibility
export async function generateWithResilience<T extends z.ZodTypeAny>(
    options: ResilienceOptions<T>
): Promise<z.infer<T> | null> {
    const res = await executeApexLoop(options);
    return res.output;
}
