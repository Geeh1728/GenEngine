import { ai, geminiFlash, geminiPro, OPENROUTER_FREE_MODELS } from './config';
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

export async function executeApexLoop<T extends z.ZodTypeAny>(
    options: ResilienceOptions<T>
): Promise<{ output: z.infer<T> | null, interactionId?: string }> {
    const { prompt, schema, system, model, task = 'GENERAL', tools, config, retryCount = 2, fallback, onLog, previousInteractionId } = options;

    let attempts = 0;
    let currentModel = model || geminiPro.name;
    let currentPrompt: MessageData['content'] = Array.isArray(prompt) ? prompt : [{ text: prompt }];
    
    // Check local quota before starting - Specifically for the 2000 RPD Gemini 3 model
    const usage = await getApiUsage();
    if (usage > 1980 && currentModel.includes('gemini-3-flash')) {
        console.warn("[Apex] Gemini 3 quota near exhaustion. Pre-emptively switching to Gemma-3.");
        if (onLog) onLog('Gemini 3 limit near. Engaging high-quota Gemma fallback...', 'INFO');
        currentModel = geminiFlash.name;
    }

    while (attempts <= retryCount) {
        try {
            const modelName = typeof currentModel === 'string' ? currentModel : (currentModel as any).name;
            console.log(`[Apex] Attempt ${attempts + 1} using ${modelName}`);
            if (onLog) onLog(`Routing to: ${modelName}...`, 'THINKING');

            const response = await ai.generate({
                model: modelName,
                prompt: currentPrompt,
                system: system,
                tools: tools,
                config: {
                    ...config,
                    // Pass interaction ID for stateful sessions
                    previous_interaction_id: previousInteractionId
                },
                output: {
                    schema: schema,
                },
            });

            if (response.output) {
                await incrementApiUsage();
                if (onLog) onLog(`Success via ${modelName}.`, 'SUCCESS');
                
                // Extract interactionId if present
                const interactionId = (response as any).metadata?.interaction_id;
                
                return { output: response.output, interactionId };
            } else {
                throw new Error("No structured output generated.");
            }

        } catch (error: any) {
            const errorMessage = error.message || String(error);
            console.error(`[Apex] Attempt ${attempts + 1} CRASHED:`, errorMessage);
            if (onLog) onLog(`Attempt ${attempts + 1} Error: ${errorMessage.substring(0, 60)}`, 'ERROR');
            
            attempts++;
            if (attempts > retryCount) break;

            // Tiered Fallback Logic: Instant reroute to high-quota Gemma or OpenRouter
            if (errorMessage.includes('429') || errorMessage.includes('500') || errorMessage.includes('limit')) {
                if (currentModel.includes('gemini-3-flash')) {
                    const fallbackModel = geminiFlash.name;
                    if (onLog) onLog(`Gemini limit reached. Rerouting to high-quota Gemma-3...`, 'ERROR');
                    currentModel = fallbackModel;
                    continue;
                } else if (currentModel.includes('googleai')) {
                    const fallbackModel = (OPENROUTER_FREE_MODELS as any)[task] || OPENROUTER_FREE_MODELS.GENERAL;
                    if (onLog) onLog(`Google limit reached. Rerouting ${task} to OpenRouter ${fallbackModel}...`, 'ERROR');
                    currentModel = fallbackModel;
                    continue;
                }
            }

            // Self-Correction for Schema Errors
            if (onLog) onLog('Initiating autonomous self-correction...', 'THINKING');
            currentPrompt = [
                ...currentPrompt,
                { text: `\n\nCRITICAL ERROR: Your previous response failed: "${errorMessage}". Please fix and match the requested schema exactly.` }
            ];
        }
    }

    if (onLog) onLog('All routes exhausted. Using low-level fallback.', 'ERROR');
    return { output: fallback || null, interactionId: previousInteractionId };
}

// Keep generateWithResilience for backward compatibility
export async function generateWithResilience<T extends z.ZodTypeAny>(
    options: ResilienceOptions<T>
): Promise<z.infer<T> | null> {
    const res = await executeApexLoop(options);
    return res.output;
}
