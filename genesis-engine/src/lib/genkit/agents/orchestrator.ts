import { ai, gemini3Flash, geminiFlash, OPENROUTER_FREE_MODELS, DEEPSEEK_LOGIC_MODEL, KIMI_DEAN_MODEL } from '../config';
import { z } from 'genkit';
import { criticAgent } from './critic';
import { physicistAgent } from './physicist';
import { artistAgent } from './artist';
import { questAgent } from './questAgent';

import { translatorAgent } from './translator';
import { visionFlow } from './vision';
import { researcherAgent } from './researcher';
import { reviewerAgent } from './reviewer';

import { WorldStateSchema, StructuralAnalysisSchema, StructuralAnalysis } from '../schemas';
import { QuestSchema } from './questAgent';
import { blackboard } from '../context';
import { executeApexLoop } from '../resilience';

export const OrchestratorInputSchema = z.object({
    text: z.string().optional(),
    image: z.string().optional().describe('Base64 image data'),
    audioTranscript: z.string().optional().describe('Text from speech-to-text'),
    mode: z.enum(['AUTO', 'PHYSICS', 'VOXEL', 'SCIENTIFIC']).default('AUTO'),
    isSabotageMode: z.boolean().optional().default(false),
    isSaboteurReply: z.boolean().optional().default(false),
    interactionState: z.enum(['IDLE', 'LISTENING', 'ANALYZING', 'BUILDING', 'PLAYING', 'REFLECTION']).optional(),
    fileUri: z.string().optional().describe('Gemini File API URI for grounding.'),
    previousInteractionId: z.string().optional().describe('Previous interaction ID for session persistence.'),
});

export const OrchestratorOutputSchema = z.object({
    status: z.enum(['SUCCESS', 'BLOCKED', 'ERROR']),
    message: z.string().optional(),
    nativeReply: z.string().optional().describe('Reply in user\'s native language if audio was used'),
    worldState: WorldStateSchema.optional(),
    visionData: StructuralAnalysisSchema.optional(),
    quest: QuestSchema.nullable().optional(),
    interactionId: z.string().optional().describe('Unique ID for this interaction.'),
    logs: z.array(z.object({
        agent: z.string(),
        message: z.string(),
        type: z.enum(['INFO', 'RESEARCH', 'ERROR', 'SUCCESS', 'THINKING'])
    })).optional(),
    nextState: z.enum(['IDLE', 'LISTENING', 'ANALYZING', 'BUILDING', 'PLAYING', 'REFLECTION']).optional(),
});

/**
 * The "Council of Agents" Orchestrator
 * Objective: Multimodal Routing and Sequential Guarding.
 * Upgraded with "The Blackboard" and "Stateful APEX Architecture".
 */
export const orchestratorFlow = ai.defineFlow(
    {
        name: 'orchestratorFlow',
        inputSchema: OrchestratorInputSchema,
        outputSchema: OrchestratorOutputSchema,
    },
    async (params) => {
        const { text, image, audioTranscript, mode, isSabotageMode, isSaboteurReply, interactionState, previousInteractionId } = params;
        const logs: Array<{ agent: string; message: string; type: 'INFO' | 'RESEARCH' | 'ERROR' | 'SUCCESS' | 'THINKING' }> = [];

        // 1. STATEFUL MEMORY: Pass previous_interaction_id to the context
        if (previousInteractionId) {
            logs.push({ agent: 'Hippocampus', message: `Restoring context from session: ${previousInteractionId.substring(0, 8)}...`, type: 'INFO' });
        }

        // GUARD: Don't process new simulations if the user is in REFLECTION mode unless explicitly asked
        if (interactionState === 'REFLECTION' && !text?.toLowerCase().includes('simulate') && !isSaboteurReply) {
            const reflectLogs: typeof logs = [{ agent: 'Aegis', message: 'User in REFLECTION mode. Simulation bypassed.', type: 'INFO' }];
            return {
                status: 'SUCCESS' as const,
                message: "You're currently in review mode. Would you like to try a new simulation?",
                nextState: 'REFLECTION' as const,
                logs: reflectLogs
            };
        }

        let processedInput = text || '';
        let nativeReply: string | undefined;
        let visionData: StructuralAnalysis | undefined = undefined;

        // Add Blackboard fragment to prompt
        const blackboardFragment = blackboard.getSystemPromptFragment();

        // PHASE 0: Multimodal Pre-processing

        // 0.1 Handle YouTube Links
        const isYouTube = /youtube\.com|youtu\.be/.test(processedInput);
        if (isYouTube) {
            logs.push({ agent: 'Multimodal', message: 'YouTube Link detected. Initializing Video Analysis...', type: 'INFO' });
            processedInput = `Analyze and build a curriculum based on this video: ${processedInput}`;
        }

        // 0.2 ROUTE A: The Eye (Vision/Image)
        if (image) {
            logs.push({ agent: 'Vision', message: '🔍 Qwen is analyzing the diagram...', type: 'THINKING' });
            const visionResult = await visionFlow({ 
                imageBase64: image,
                model: OPENROUTER_FREE_MODELS.VISION // Force-routing to specialized vision
            });
            visionData = visionResult;
            if (!processedInput && visionData) {
                processedInput = `Analyze and simulate these objects: ${visionData.elements.map((v) => v.type).join(', ')}`;
            }
            logs.push({ agent: 'Vision', message: `Extracted ${visionData.elements.length} structural elements.`, type: 'SUCCESS' });
        }

        if (audioTranscript) {
            logs.push({ agent: 'Babel', message: 'Translating audio intent...', type: 'THINKING' });
            const translation = await translatorAgent({ userAudioTranscript: audioTranscript });
            processedInput = translation.englishIntent;
            nativeReply = translation.nativeReply;
            logs.push({ agent: 'Babel', message: `Translated intent: "${processedInput.substring(0, 50)}..."`, type: 'SUCCESS' });
        }

        if (!processedInput) {
            return { status: 'ERROR' as const, message: 'No input provided.', logs };
        }

        // PHASE 1: The Guard (Sequential)
        logs.push({ agent: 'Aegis', message: 'Consulting the Socratic Saboteur...', type: 'THINKING' });
        const criticResult = await criticAgent({
            userTopic: `${blackboardFragment}\n\nUSER INPUT: <UNTRUSTED_USER_DATA>${processedInput}</UNTRUSTED_USER_DATA>`,
            isSaboteurReply: isSaboteurReply
        });

        if (criticResult.status === 'TRAP') {
            logs.push({ agent: 'Aegis', message: `Input BLOCKED: ${criticResult.message}`, type: 'ERROR' });
            return {
                status: 'BLOCKED' as const,
                message: criticResult.message,
                nativeReply,
                logs
            };
        }
        logs.push({ agent: 'Aegis', message: 'Concept verified safe for simulation.', type: 'SUCCESS' });

        // PHASE 1.5: The Researcher (Autonomous Grounding)
        logs.push({ agent: 'Researcher', message: 'Searching web for real-time grounding data...', type: 'THINKING' });
        const researchResult = await researcherAgent({
            topic: processedInput,
            context: blackboardFragment,
            depth: 1
        });
        
        if (researchResult.summary && researchResult.summary !== "Research phase failed or was inconclusive.") {
            logs.push({ agent: 'Researcher', message: `Found grounding data: ${researchResult.summary.substring(0, 100)}...`, type: 'RESEARCH' });
        } else {
            logs.push({ agent: 'Researcher', message: 'No additional grounding data found. Using local context.', type: 'INFO' });
        }

        // PHASE 2: Determine Routing (TRIANGLE OF POWER)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let primaryAgent: any = physicistAgent;
        let primaryAgentName = 'Physicist';
        let routingTask: any = 'GENERAL';

        if (mode === 'VOXEL' || /sculpture|abstract|art/i.test(processedInput)) {
            primaryAgent = artistAgent;
            primaryAgentName = 'Artist';
            routingTask = 'CODE';
        } else if (/calculate|derive|solve|physics|force|gravity/i.test(processedInput)) {
            // ROUTE B: The Brain (Math/Physics)
            logs.push({ agent: 'Brain', message: '📐 DeepSeek is solving the differential equation...', type: 'RESEARCH' });
            routingTask = 'MATH';
        } else if (params.fileUri || processedInput.length > 500) {
            // ROUTE C: The Dean (Heavy Context)
            logs.push({ agent: 'Dean', message: '📖 Kimi is mapping the textbook context...', type: 'RESEARCH' });
            routingTask = 'INGEST';
        }

        // PHASE 3: Parallel Execution via APEX LOOP
        logs.push({ agent: 'Conductor', message: `Synthesizing neural outputs via Gemini 3 Flash...`, type: 'THINKING' });
        try {
            const agentRes = await executeApexLoop({
                prompt: processedInput,
                schema: WorldStateSchema,
                system: `You are the ${primaryAgentName} member of the Council. Construct the WorldState. Context: ${blackboardFragment}`,
                task: routingTask,
                previousInteractionId: previousInteractionId,
                onLog: (msg, type) => logs.push({ agent: 'Apex', message: msg, type }),
                fallback: {
                    scenario: "Neural Stabilization Mode",
                    mode: "PHYSICS",
                    description: "The primary intelligence link is stabilizing. Observe the baseline grid.",
                    explanation: "Model connectivity lost. Engaging low-level physical stabilization to maintain reality feed.",
                    constraints: ["Gravity is active"],
                    successCondition: "Observe the obelisk",
                    entities: [{
                        id: "sentinel-obelisk",
                        type: "box",
                        position: { x: 0, y: 4, z: 0 },
                        rotation: { x: 0, y: 45, z: 0 },
                        dimensions: { x: 0.5, y: 8, z: 0.5 },
                        physics: { mass: 0, friction: 0.5, restitution: 0.5 },
                        color: "#3b82f6",
                        name: "Quantum Obelisk",
                        isStatic: true
                    }],
                    environment: {
                        gravity: { x: 0, y: -9.81, z: 0 },
                        timeScale: 1
                    }
                }
            });

            const worldState = agentRes.output;
            const interactionId = agentRes.interactionId;

            // PHASE 4: Peer Review Swarm (Kimi K2.5)
            if (worldState) {
                logs.push({ agent: 'Aegis', message: 'Kimi K2.5 is validating DeepSeek\'s math...', type: 'THINKING' });
                const review = await reviewerAgent({
                    proposedState: JSON.stringify(worldState),
                    originalPrompt: processedInput,
                    agentName: primaryAgentName
                });

                if (review.status === 'REJECTED') {
                    logs.push({ agent: 'Aegis', message: `Review REJECTED: ${review.feedback}. Self-correcting...`, type: 'ERROR' });
                    // ONE-TIME SELF-CORRECTION
                    const correctionRes = await executeApexLoop({
                        prompt: `${processedInput}\n\nFEEDBACK FROM REVIEWER: ${review.feedback}. Fix the previous WorldState.`,
                        schema: WorldStateSchema,
                        system: `You are the ${primaryAgentName}. Fix your previous state based on the feedback.`,
                        task: routingTask,
                        previousInteractionId: interactionId
                    });
                    if (correctionRes.output) {
                        blackboard.updateFromWorldState(correctionRes.output as any);
                        logs.push({ agent: 'Aegis', message: 'Self-correction successful. Consensus reached.', type: 'SUCCESS' });
                        return {
                            status: 'SUCCESS' as const,
                            worldState: correctionRes.output as any,
                            visionData,
                            quest: (await executeApexLoop({ prompt: processedInput, schema: QuestSchema, task: 'CHAT' })).output as any,
                            interactionId: correctionRes.interactionId || interactionId,
                            nativeReply,
                            logs,
                            nextState: 'PLAYING' as const
                        };
                    }
                } else {
                    logs.push({ agent: 'Aegis', message: 'Scientific consensus reached.', type: 'SUCCESS' });
                }
            }

            const questRes = await executeApexLoop({
                prompt: processedInput,
                schema: QuestSchema,
                system: `Design a mastery quest for this simulation.`,
                task: 'CHAT',
                fallback: null as any // Explicitly allow null for quest fallback
            });
            const quest = questRes.output;

            // Update Blackboard with new state
            if (worldState) blackboard.updateFromWorldState(worldState as any);

            logs.push({ agent: 'Conductor', message: 'Reality Compiled successfully.', type: 'SUCCESS' });

            return {
                status: 'SUCCESS' as const,
                worldState: worldState as any,
                visionData,
                quest: quest || null,
                interactionId,
                nativeReply,
                logs,
                nextState: 'PLAYING' as const
            };
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            logs.push({ agent: 'Conductor', message: `Compilation failed: ${errorMsg}`, type: 'ERROR' });
            return {
                status: 'ERROR' as const,
                message: errorMsg,
                logs: logs,
                nextState: 'IDLE' as const
            };
        }
    }
);