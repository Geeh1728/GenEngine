import { ai } from '../config';
import { z } from 'genkit';
import { criticAgent } from './critic';
import { physicistAgent } from './physicist';
import { artistAgent } from './artist';
import { questAgent } from './questAgent';

import { translatorAgent } from './translator';
import { visionFlow } from './vision';
import { researcherAgent } from './researcher';

import { WorldStateSchema, StructuralAnalysisSchema, StructuralAnalysis } from '../schemas';
import { QuestSchema } from './questAgent';
import { blackboard } from '../context';

export const OrchestratorInputSchema = z.object({
    text: z.string().optional(),
    image: z.string().optional().describe('Base64 image data'),
    audioTranscript: z.string().optional().describe('Text from speech-to-text'),
    mode: z.enum(['AUTO', 'PHYSICS', 'VOXEL', 'SCIENTIFIC']).default('AUTO'),
    isSabotageMode: z.boolean().optional().default(false),
    interactionState: z.enum(['IDLE', 'LISTENING', 'ANALYZING', 'BUILDING', 'PLAYING', 'REFLECTION']).optional(),
    fileUri: z.string().optional().describe('Gemini File API URI for grounding.'),
});

export const OrchestratorOutputSchema = z.object({
    status: z.enum(['SUCCESS', 'BLOCKED', 'ERROR']),
    message: z.string().optional(),
    nativeReply: z.string().optional().describe('Reply in user\'s native language if audio was used'),
    worldState: WorldStateSchema.optional(),
    visionData: StructuralAnalysisSchema.optional(),
    quest: QuestSchema.optional(),
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
 * Upgraded with "The Blackboard" and "The Interaction Graph".
 */
export const orchestratorFlow = ai.defineFlow(
    {
        name: 'orchestratorFlow',
        inputSchema: OrchestratorInputSchema,
        outputSchema: OrchestratorOutputSchema,
    },
    async (params) => {
        const { text, image, audioTranscript, mode, isSabotageMode, interactionState } = params;
        const logs: Array<{ agent: string; message: string; type: 'INFO' | 'RESEARCH' | 'ERROR' | 'SUCCESS' | 'THINKING' }> = [];

        // GUARD: Don't process new simulations if the user is in REFLECTION mode unless explicitly asked
        if (interactionState === 'REFLECTION' && !text?.toLowerCase().includes('simulate')) {
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

        if (image) {
            logs.push({ agent: 'Vision', message: 'Processing image for spatial grounding...', type: 'THINKING' });
            const visionResult = await visionFlow({ imageBase64: image });
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
            userTopic: `${blackboardFragment}\n\nUSER INPUT: <UNTRUSTED_USER_DATA>${processedInput}</UNTRUSTED_USER_DATA>`
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
            context: blackboardFragment
        });
        
        if (researchResult.summary && researchResult.summary !== "Research phase failed or was inconclusive.") {
            logs.push({ agent: 'Researcher', message: `Found grounding data: ${researchResult.summary.substring(0, 100)}...`, type: 'RESEARCH' });
        } else {
            logs.push({ agent: 'Researcher', message: 'No additional grounding data found. Using local context.', type: 'INFO' });
        }

        // PHASE 2: Determine Routing
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let primaryAgent: any = physicistAgent;
        let primaryAgentName = 'Physicist';
        if (mode === 'VOXEL') {
            primaryAgent = artistAgent;
            primaryAgentName = 'Artist';
        } else if (mode === 'AUTO') {
            const isAbstract = processedInput.length > 20 || /love|freedom|time|inflation|history/i.test(processedInput);
            if (isAbstract) {
                primaryAgent = artistAgent;
                primaryAgentName = 'Artist';
            }
        }

        // PHASE 3: Parallel Execution
        logs.push({ agent: primaryAgentName, message: `Building WorldState (Clawdbot Recursive Loop active)...`, type: 'THINKING' });
        try {
            let worldState: any;
            let quest: any;

            try {
                const agentPromise = (primaryAgent === physicistAgent)
                    ? physicistAgent({
                        userTopic: processedInput,
                        isSabotageMode,
                        context: `Standard Earth physics.\nResearch Data: ${researchResult.summary}\n${blackboardFragment}`,
                        requireDeepLogic: false,
                        fileUri: params.fileUri
                    })
                    : artistAgent({
                        concept: `${processedInput}\nResearch Data: ${researchResult.summary}\n${blackboardFragment}`,
                        fileUri: params.fileUri
                    });

                [worldState, quest] = await Promise.all([
                    agentPromise,
                    questAgent({ topic: processedInput }),
                ]);
            } catch (firstAttemptError: any) {
                if (primaryAgent === physicistAgent) {
                    logs.push({ agent: 'Physicist', message: 'First attempt failed. Initializing MacGyver Self-Correction...', type: 'ERROR' });
                    // RECURSIVE SELF-CORRECTION (One attempt only)
                    const errorMsg = firstAttemptError instanceof Error ? firstAttemptError.message : String(firstAttemptError);
                    
                    const retryPromise = physicistAgent({
                        userTopic: processedInput,
                        isSabotageMode,
                        context: `Standard Earth physics.\nResearch Data: ${researchResult.summary}\n${blackboardFragment}`,
                        requireDeepLogic: true, // Up the logic power for retry
                        fileUri: params.fileUri,
                        recursive_self_correction: errorMsg
                    });

                    [worldState, quest] = await Promise.all([
                        retryPromise,
                        questAgent({ topic: processedInput }),
                    ]);
                } else {
                    throw firstAttemptError;
                }
            }

            // Update Blackboard with new state
            if (worldState) blackboard.updateFromWorldState(worldState);

            logs.push({ agent: primaryAgentName, message: 'Reality Compiled successfully.', type: 'SUCCESS' });

            return {
                status: 'SUCCESS' as const,
                worldState,
                visionData,
                quest,
                nativeReply,
                logs,
                nextState: 'PLAYING' as const
            };
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            logs.push({ agent: primaryAgentName, message: `Compilation failed: ${errorMsg}`, type: 'ERROR' });
            return {
                status: 'ERROR' as const,
                message: errorMsg,
                logs: logs, // Explicitly return logs
                nextState: 'IDLE' as const
            };
        }
    }
);