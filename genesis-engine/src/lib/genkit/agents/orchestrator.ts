import { ai } from '../config';
import { z } from 'genkit';
import { criticAgent } from './critic';
import { physicistAgent } from './physicist';
import { artistAgent } from './artist';
import { questAgent } from './questAgent';

import { translatorAgent } from './translator';
import { visionFlow } from './vision';

import { WorldStateSchema } from '../../simulation/schema';
import { QuestSchema } from './questAgent';
import { blackboard } from '../context';
import { InteractionState } from '../../multiplayer/GameState';

export const OrchestratorInputSchema = z.object({
    text: z.string().optional(),
    image: z.string().optional().describe('Base64 image data'),
    audioTranscript: z.string().optional().describe('Text from speech-to-text'),
    mode: z.enum(['AUTO', 'PHYSICS', 'VOXEL', 'SCIENTIFIC']).default('AUTO'),
    isSabotageMode: z.boolean().optional().default(false),
    interactionState: z.enum(['IDLE', 'LISTENING', 'ANALYZING', 'BUILDING', 'PLAYING', 'REFLECTION']).optional(),
});

export const OrchestratorOutputSchema = z.object({
    status: z.enum(['SUCCESS', 'BLOCKED', 'ERROR']),
    message: z.string().optional(),
    nativeReply: z.string().optional().describe('Reply in user\'s native language if audio was used'),
    worldState: WorldStateSchema.optional(),
    visionData: VisionOutputSchema.optional(),
    quest: QuestSchema.optional(),
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
        const currentContext = blackboard.getContext();

        // GUARD: Don't process new simulations if the user is in REFLECTION mode unless explicitly asked
        if (interactionState === 'REFLECTION' && !text?.toLowerCase().includes('simulate')) {
            return { 
                status: 'SUCCESS' as const, 
                message: "You're currently in review mode. Would you like to try a new simulation?",
                nextState: 'REFLECTION'
            };
        }

        let processedInput = text || '';
        let nativeReply: string | undefined;
        let visionData: z.infer<typeof WorldStateSchema> | any;

        // PHASE 0: Multimodal Pre-processing
        
        // 0.1 Handle YouTube Links
        const isYouTube = /youtube\.com|youtu\.be/.test(processedInput);
        if (isYouTube) {
            console.log('[Orchestrator] Detected YouTube Link. Redirecting to Video Analysis...');
            // In a full implementation, we would fetch the transcript here.
            // For now, we wrap the prompt to inform agents it's a video source.
            processedInput = `Analyze and build a curriculum based on this video: ${processedInput}`;
        }

        if (image) {
            console.log('[Orchestrator] Processing Image via Vision Agent...');
            const visionResult = await visionFlow({ imageBase64: image });
            visionData = visionResult;
            if (!processedInput && visionData) {
                processedInput = `Analyze and simulate these objects: ${visionData.elements.map((v) => v.type).join(', ')}`;
            }
        }

        if (audioTranscript) {
            console.log('[Orchestrator] Translating Audio via Babel Agent...');
            const translation = await translatorAgent({ userAudioTranscript: audioTranscript });
            processedInput = translation.englishIntent;
            nativeReply = translation.nativeReply;
        }

        if (!processedInput) {
            return { status: 'ERROR' as const, message: 'No input provided.' };
        }

        // PHASE 1: The Guard (Sequential)
        console.log('[Orchestrator] Consulting the Critic...');
        const criticResult = await criticAgent({ 
            userTopic: `${blackboardFragment}\n\nUSER INPUT: ${processedInput}` 
        });

        if (criticResult.status === 'TRAP') {
            console.warn('[Orchestrator] Input BLOCKED by Critic.');
            return {
                status: 'BLOCKED' as const,
                message: criticResult.message,
                nativeReply,
            };
        }

        // PHASE 2: Determine Routing
        let primaryAgent: typeof physicistAgent | typeof artistAgent = physicistAgent;
        if (mode === 'VOXEL') {
            primaryAgent = artistAgent;
        } else if (mode === 'AUTO') {
            const isAbstract = processedInput.length > 20 || /love|freedom|time|inflation/i.test(processedInput);
            if (isAbstract) primaryAgent = artistAgent;
        }

        // PHASE 3: Parallel Execution
        console.log(`[Orchestrator] Executing ${primaryAgent.name} and Quest Agent in parallel...`);
        try {
            const agentPromise = primaryAgent === physicistAgent
                ? physicistAgent({ 
                    userTopic: processedInput, 
                    isSabotageMode, 
                    context: `Standard Earth physics.\n${blackboardFragment}` 
                })
                : artistAgent({ 
                    concept: `${processedInput}\n${blackboardFragment}` 
                });

            const [worldState, quest] = await Promise.all([
                agentPromise,
                questAgent({ topic: processedInput }),
            ]);

            // Update Blackboard with new state
            if (worldState) blackboard.updateFromWorldState(worldState);

            return {
                status: 'SUCCESS' as const,
                worldState,
                visionData,
                quest,
                nativeReply,
                nextState: 'PLAYING'
            };
        } catch (error) {
            console.error('[Orchestrator] Parallel execution failed:', error);
            return {
                status: 'ERROR' as const,
                message: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
);
