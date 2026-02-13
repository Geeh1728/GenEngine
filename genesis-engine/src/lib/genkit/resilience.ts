import { ai } from './config';
import { z } from 'zod';
import { getApiUsage } from '../db/pglite';
import { LOGIC_WATERFALL, VISION_WATERFALL, PHYSICS_WATERFALL, CONTEXT_WATERFALL, REFLEX_WATERFALL } from './models';
import { cleanModelOutput } from '../utils/ai-sanitizer';
import { checkNanoCapabilities, localReflexQuery } from '../ai/local-nano';
import { quotaOracle } from '../utils/quota-oracle';
import { blackboard } from './context';

import { MessageData, GenerateOptions } from 'genkit';
import { StreamingRealityParser, StreamingCallback } from './streamingReality';

type TaskType = 'MATH' | 'VISION' | 'INGEST' | 'GENERAL' | 'CHAT' | 'CODE' | 'PHYSICS' | 'REFLEX';

interface ResilienceOptions<T extends z.ZodTypeAny> {
    prompt: string | MessageData['content'];
    schema: T;
    system?: string;
    model?: string;
    task?: TaskType;
    tools?: GenerateOptions['tools'];
    config?: Record<string, unknown>;
    retryCount?: number;
    fallback?: z.infer<T>;
    onLog?: (message: string, type: 'INFO' | 'ERROR' | 'SUCCESS' | 'THINKING') => void;
    previousInteractionId?: string;
    modelAlias?: string;
    // NEW: Sovereign Mint (v41.0)
    userKeys?: Record<string, string>;
    isPro?: boolean;
    // NEW: Streaming Reality Support
    enableStreaming?: boolean;
    onStreamingUpdate?: StreamingCallback;
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

/**
 * PLATINUM WATERFALL RESOLVER
 * Objective: Determine the optimal model list based on real-time quota analysis.
 */
async function getWaterfallForTask(task: TaskType, isPro: boolean = false): Promise<string[]> {
    let waterfall: string[];
    switch (task) {
        case 'MATH': waterfall = LOGIC_WATERFALL; break;
        case 'VISION': waterfall = VISION_WATERFALL; break;
        case 'PHYSICS': waterfall = PHYSICS_WATERFALL; break;
        case 'INGEST':
        case 'CHAT': waterfall = CONTEXT_WATERFALL; break;
        case 'REFLEX': waterfall = REFLEX_WATERFALL; break;
        default: waterfall = LOGIC_WATERFALL;
    }

    // v41.0 PRO-ONLY MODELS: GPT-OSS 120B and DeepSeek R1 managed are reserved for Pro
    // or users with their own keys.
    const filteredWaterfall = waterfall.filter(m => {
        if (isPro) return true;
        // Non-pro users using managed keys are restricted from expensive reasoning models
        // unless they have a user key (handled in executeApexLoop)
        if (m.includes('gpt-oss-120b') || m.includes('deepseek-r1')) return false;
        return true;
    });

    // DYNAMIC QUOTA GATING (v22.0)
    const validatedWaterfall: string[] = [];
    for (const model of filteredWaterfall) {
        if (await quotaOracle.isSafe(model)) {
            validatedWaterfall.push(model);
        }
    }

    return validatedWaterfall.length > 0 ? validatedWaterfall : filteredWaterfall;
}

export async function executeApexLoop<T extends z.ZodTypeAny>(
    options: ResilienceOptions<T>
): Promise<{ output: z.infer<T> | null, interactionId?: string, thinking?: string }> {
    const { prompt, schema, system, model, task = 'GENERAL', tools, config, retryCount = 2, fallback, onLog, previousInteractionId, modelAlias, enableStreaming, onStreamingUpdate, userKeys, isPro } = options;

    let waterfall = model ? [model] : await getWaterfallForTask(task, isPro);
    let currentWaterfallIdx = 0;
    let attempts = 0;

    while (attempts <= retryCount && currentWaterfallIdx < waterfall.length) {
        // TIER 0: Built-in AI (Gemini Nano) Check
        if (attempts === 0 && currentWaterfallIdx === 0 && !enableStreaming && !tools && await checkNanoCapabilities()) {
            console.log("[Apex] Tier 0: Trying local Gemini Nano...");
            const rawPrompt = Array.isArray(prompt)
                ? (prompt[0] as { text: string }).text
                : (typeof prompt === 'string' ? prompt : '');
            
            const localResult = await localReflexQuery(rawPrompt, system);
            if (localResult.success && localResult.text) {
                console.log("[Apex] Tier 0 Success: Local Nano handled the task.");
                try {
                    const parsed = schema.parse(JSON.parse(cleanModelOutput(localResult.text)));
                    return { output: parsed, interactionId: 'local-nano-' + Date.now() };
                } catch (e) {
                    console.warn("[Apex] Tier 0 Parse failed, falling back to Swarm.");
                }
            }
        }

        const modelName = waterfall[currentWaterfallIdx];
        
        // v41.0 SOVEREIGN KEY INJECTION
        let customApiKey: string | undefined;
        if (userKeys) {
            if (modelName.startsWith('googleai') && userKeys.googleai) customApiKey = userKeys.googleai;
            if (modelName.startsWith('groq') && userKeys.groq) customApiKey = userKeys.groq;
        }

        try {
            console.log(`[Apex] Attempt ${attempts + 1} using ${modelName} ${customApiKey ? '(SOVEREIGN KEY)' : '(MANAGED)'}`);
            if (onLog) onLog(`Swarm routing to: ${modelName}${customApiKey ? ' (Your Key)' : ''}...`, 'THINKING');

            const rawPrompt = Array.isArray(prompt)
                ? (prompt[0] as { text: string }).text
                : (typeof prompt === 'string' ? prompt : '');

            const adaptedPrompt = preparePromptForModel(rawPrompt, modelName);

            // Genkit configuration with potential custom API key
            const generationConfig = { 
                ...config, 
                previous_interaction_id: previousInteractionId,
                // In a real Genkit environment, we would pass the key to the provider
                // For now, we simulate by assuming the provider can accept a 'key' in config
                // or we use a custom fetcher.
                apiKey: customApiKey 
            };

            let result: any;

            if (enableStreaming && onStreamingUpdate) {
                if (onLog) onLog('Streaming Reality engaged...', 'THINKING');
                const streamParser = new StreamingRealityParser(onStreamingUpdate);

                const { response, stream } = await ai.generateStream({
                    model: modelName,
                    prompt: adaptedPrompt,
                    system: system,
                    tools: tools,
                    config: generationConfig,
                    output: { schema: schema },
                });

                for await (const chunk of stream) {
                    if (chunk.text) streamParser.feed(chunk.text);
                }

                streamParser.complete();
                const finalResponse = await response;
                result = finalResponse;
            } else {
                result = await ai.generate({
                    model: modelName,
                    prompt: adaptedPrompt,
                    system: system,
                    tools: tools,
                    config: generationConfig,
                    output: { schema: schema },
                });
            }

            if (result.output) {
                // QUOTA TELEMETRY: Record success
                await quotaOracle.recordSuccess(modelName);
                
                if (onLog) {
                    const lpuLatency = (result as any).custom?.latency;
                    const lpuBadge = modelName.includes('groq') ? `⚡ LPU: ${lpuLatency}ms` : '';
                    onLog(`Neural Link established via ${modelName}. ${lpuBadge}`, 'SUCCESS');
                    
                    // Log to blackboard for HUD
                    if (lpuLatency) {
                        blackboard.log('System', `LPU established in ${lpuLatency}ms. Bandwidth optimized.`, 'INFO');
                    }
                }
                
                let finalOutput = result.output;
                let thinking: string | undefined;

                // REASONING SANDBOX (v21.5): Extract <think> block
                if (result.text && result.text.includes('<think>')) {
                    const match = result.text.match(/<think>([\s\S]*?)<\/think>/);
                    if (match && match[1]) {
                        thinking = match[1].trim();
                        // Log the raw thought process for "Scholar" mode users
                        if (thinking) {
                            blackboard.log('DeepSeek', thinking.substring(0, 300) + '...', 'THOUGHT');
                        }
                    }
                }

                // SANITIZATION for DeepSeek
                if (modelName.includes('deepseek')) {
                    if (result.text) {
                        const cleaned = cleanModelOutput(result.text);
                        try {
                            finalOutput = schema.parse(JSON.parse(cleaned));
                        } catch (e) {
                            console.warn("[Apex] DeepSeek manual parse failed, using original output.");
                        }
                    }
                }

                const interactionId = (result as { metadata?: { interaction_id?: string } }).metadata?.interaction_id;
                return { output: finalOutput, interactionId, thinking };
            } else {
                throw new Error("No structured output generated.");
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`[Apex] Swarm Error (${modelName}):`, errorMessage);

            // PIVOT Logic: If 429 or 503, immediately move to next model in waterfall
            if (errorMessage.includes('429') || errorMessage.includes('500') || errorMessage.includes('503') || errorMessage.includes('limit')) {
                const nextModel = waterfall[currentWaterfallIdx + 1];
                const providerSwitch = modelName.startsWith('googleai') && nextModel?.startsWith('openrouter');
                
                if (onLog) {
                    onLog(`⚠️ Node Throttled (${modelName}). ${providerSwitch ? 'Switching Providers...' : 'Pivoting...'}`, 'ERROR');
                }
                
                currentWaterfallIdx++;
                attempts = 0; // Reset attempts for the next model
                continue; // Immediate retry with next model
            }

            // Standard Retry
            attempts++;
            if (attempts > retryCount) {
                currentWaterfallIdx++;
                attempts = 0; // Reset attempts for the next model in waterfall
            }

            if (onLog && currentWaterfallIdx < waterfall.length) {
                onLog(`Self-correcting neural path...`, 'THINKING');
            }
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
