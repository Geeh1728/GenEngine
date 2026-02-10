import { ai, OPENROUTER_FREE_MODELS } from '../config';
import { z } from 'genkit';
import { criticAgent } from './critic';
import { physicistAgent } from './physicist';
import { artistAgent } from './artist';

import { translatorAgent } from './translator';
import { visionFlow } from './vision';
import { researcherAgent } from './researcher';
import { reviewerAgent } from './reviewer';
import { librarianAgent } from './librarian';

import { WorldStateSchema, StructuralAnalysisSchema, StructuralAnalysis, SimulationMutationSchema, EntitySchema, Entity } from '../schemas';
import { normalizeEntities } from '../../simulation/normalizer';
import { QuestSchema } from './questAgent';
import { blackboard } from '../context';
import { executeApexLoop } from '../resilience';
import { hiveBus } from '../event-bus';

const TaskManifestSchema = z.object({
    subTasks: z.array(z.object({
        agentType: z.enum(['Visuals/Shaders', 'Joints/Constraints', 'Math/Trajectories', 'General/Reflex']),
        instruction: z.string()
    })).describe('Decomposed tasks for specialized Hive experts')
});

const WorkerOutputSchema = z.object({
    entities: z.array(EntitySchema).optional(),
    shaderCode: z.string().optional(),
    constraints: z.array(z.string()).optional()
});

/**
 * HIVE ORCHESTRATOR (v21.5 MOE Hardened)
 * Objective: Fine-grained parallel execution via specialized Gemma 3 experts.
 */
export async function executeHiveSwarm(generalGoal: string, context: string) {
    console.log("[Hive] General is issuing specialized Work Orders...");

    // 1. THE GENERAL (Reasoning head)
    const plan = await executeApexLoop({
        task: 'MATH',
        prompt: `ACT AS GENERAL: Decompose this learning simulation goal into a parallel TaskManifest.
        GOAL: "${generalGoal}"
        CONTEXT: ${context}
        
        EXPERT ROLES:
        - Visuals/Shaders: Focus on colors, textures, and GLSL effects.
        - Joints/Constraints: Focus on connections, hinges, and physical limits.
        - Math/Trajectories: Focus on exact positions, velocities, and orbital paths.
        - General/Reflex: Default for object spawning and simple UI logic.
        
        Return JSON.`,
        schema: TaskManifestSchema
    });

    if (!plan.output) return null;

    // 2. THE EXPERTS (Fine-Grained MOE)
    const workerPromises = plan.output.subTasks.map(task => {
        hiveBus.registerWorker();
        // Route to Reflex waterfall for speed
        return executeApexLoop({
            task: 'REFLEX',
            prompt: `EXPERT ROLE: "${task.agentType}". Instruction: ${task.instruction}.
            Return JSON matching WorkerOutputSchema. Focus ONLY on your specific domain.`,
            schema: WorkerOutputSchema
        }).finally(() => hiveBus.releaseWorker());
    });

    const results = await Promise.all(workerPromises);

    // 3. ASSEMBLY
    const aggregated: { entities: Entity[]; shaderCode: string; constraints: string[] } = {
        entities: [],
        shaderCode: "",
        constraints: []
    };

    results.forEach(res => {
        if (res.output) {
            if (res.output.entities) aggregated.entities.push(...res.output.entities);
            if (res.output.shaderCode) aggregated.shaderCode += "\n" + res.output.shaderCode;
            if (res.output.constraints) aggregated.constraints.push(...res.output.constraints);
        }
    });

    return aggregated;
}

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
    mutation: SimulationMutationSchema.optional().describe('Partial update for Vibe Coding'),
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
        let blackboardFragment = blackboard.getSystemPromptFragment();

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
            const translation = await translatorAgent({
                userAudioTranscript: audioTranscript,
                contentType: 'text/plain' // Transcript is text
            });
            processedInput = translation.englishIntent;
            nativeReply = translation.nativeReply;
            logs.push({ agent: 'Babel', message: `Translated intent: "${processedInput.substring(0, 50)}"...`, type: 'SUCCESS' });
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

        // --- VIBE CODER INTERCEPTOR (v23.0) ---
        if (interactionState === 'PLAYING' && !processedInput.toLowerCase().includes('simulate new') && !isYouTube) {
            logs.push({ agent: 'VibeCoder', message: 'Intercepting intent as Simulation Mutation...', type: 'THINKING' });
            
            try {
                const mutationRes = await executeApexLoop({
                    prompt: `
                    USER INTENT: "${processedInput}"
                    CURRENT BLACKBOARD: ${blackboardFragment}
                    
                    TASK: You are the "Vibe Coder". Instead of building a new world, MUTATE the current one.
                    1. If the user wants to change gravity/environment -> ENVIRONMENT_UPDATE (set biome: SPACE, OCEAN, etc).
                    2. If the user wants to change an object property (mass, color, bounce) -> ENTITY_UPDATE.
                    3. If the user wants to remove a connection -> JOINT_REMOVE.
                    4. If the user wants to add a single object -> ENTITY_ADD.
                    
                    Return JSON matching SimulationMutationSchema.
                    `,
                    schema: SimulationMutationSchema,
                    task: 'REFLEX' // Use reflex for speed
                });

                if (mutationRes.output) {
                    logs.push({ agent: 'VibeCoder', message: `Mutation Applied: ${mutationRes.output.explanation}`, type: 'SUCCESS' });
                    return {
                        status: 'SUCCESS' as const,
                        mutation: mutationRes.output,
                        logs,
                        nextState: 'PLAYING' as const
                    };
                }
            } catch (err) {
                console.warn("[VibeCoder] Mutation parsing failed, falling back to full build.", err);
            }
        }

        // PHASE 1.5: The Researcher & Oracle (Autonomous Grounding)
        const urlMatch = processedInput.match(/https?:\/\/[^\s]+/);
        if (urlMatch) {
            const detectedUrl = urlMatch[0];
            logs.push({ agent: 'Oracle', message: `🔗 Direct Link detected: ${detectedUrl}. Grounding simulation logic...`, type: 'THINKING' });

            try {
                const oracleResult = await librarianAgent({
                    userQuery: processedInput,
                    url: detectedUrl,
                    isGrounding: true
                });

                if (oracleResult.constants || oracleResult.formulas) {
                    const constantsSummary = oracleResult.constants ? Object.entries(oracleResult.constants).map(([k, v]) => `${k}=${v}`).join(', ') : '';
                    logs.push({
                        agent: 'Astra',
                        message: `🔗 Web-Source verified. I've updated the world's physics constants: ${constantsSummary}`,
                        type: 'SUCCESS'
                    });

                    // Inject into context
                    blackboardFragment += `\n\nWEB-GROUNDED DATA:\n${JSON.stringify(oracleResult)}`;
                }
            } catch (err) {
                console.warn("[Oracle] Link grounding failed:", err);
                logs.push({
                    agent: 'Oracle',
                    message: "⚠️ I can't reach that link directly. Use the Reality Lens to take a screenshot of the page, and I'll analyze it visually.",
                    type: 'ERROR'
                });
            }
        }

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

        // HIERARCHICAL SWARM TRIGGER (v13.0 GOLD)
        const isComplexTask = processedInput.length > 100 || processedInput.toLowerCase().includes('build') || processedInput.toLowerCase().includes('create');
        let hiveContext = "";

        if (isComplexTask && !isSaboteurReply) {
            logs.push({ agent: 'General', message: 'Task complexity high. Spawning worker swarm...', type: 'THINKING' });
            const swarmData = await executeHiveSwarm(processedInput, blackboardFragment);
            if (swarmData) {
                hiveContext = `WORKER BEE DRAFTS: \nEntities: ${JSON.stringify(swarmData.entities)}\nShader: ${swarmData.shaderCode}\nConstraints: ${swarmData.constraints.join(', ')}`;
                logs.push({ agent: 'Hive', message: `Workers aggregated ${swarmData.entities.length} entities and logic.`, type: 'SUCCESS' });
            }
        }

        // PHASE 2: Determine Routing (TRIANGLE OF POWER)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let primaryAgent: any = physicistAgent;
        let primaryAgentName = 'Physicist';
        let routingTask: any = 'GENERAL';
        let domain: 'SCIENCE' | 'HISTORY' | 'MUSIC' | 'TRADE' | 'ABSTRACT' = 'SCIENCE';

        if (mode === 'VOXEL' || /sculpture|abstract|art/i.test(processedInput)) {
            primaryAgent = artistAgent;
            primaryAgentName = 'Artist';
            routingTask = 'CODE';
            domain = 'ABSTRACT';
        } else if (/history|revolution|era|century|war|politics/i.test(processedInput)) {
            primaryAgentName = 'Historian';
            routingTask = 'INGEST';
            domain = 'HISTORY';
        } else if (/music|jazz|rhythm|melody|harmony|chord|piano|guitar|drum|sax|trumpet|flute|instrument/i.test(processedInput)) {
            primaryAgentName = 'Composer';
            routingTask = 'PHYSICS';
            domain = 'MUSIC';
        } else if (/calculate|derive|solve|physics|force|gravity/i.test(processedInput)) {
            // ROUTE B: The Brain (Math/Physics)
            logs.push({ agent: 'Brain', message: '📐 DeepSeek is solving the differential equation...', type: 'RESEARCH' });
            routingTask = 'MATH';
            domain = 'SCIENCE';
        } else if (params.fileUri || processedInput.length > 500) {
            // ROUTE C: The Dean (Heavy Context)
            logs.push({ agent: 'Dean', message: '📖 Kimi is mapping the textbook context...', type: 'RESEARCH' });
            routingTask = 'INGEST';
            domain = 'SCIENCE';
        }

        // PHASE 3: Parallel Execution via APEX LOOP
        logs.push({ agent: 'Conductor', message: `Synthesizing neural outputs via Gemini 3 Flash...`, type: 'THINKING' });
        try {
            const agentRes = await executeApexLoop({
                prompt: `${processedInput}\n\n${hiveContext}`,
                schema: WorldStateSchema,
                system: `You are the ${primaryAgentName} member of the Council. Construct the WorldState. 
                DOMAIN: ${domain}
                
                ${domain === 'MUSIC' ? `
                MUSIC COMPILER PROTOCOL (v20.7):
                1. Map chords/rhythms to 'Causal Dependencies'. 
                2. If dissonance or rhythmic drift is detected, set 'isUnstable: true' and high 'stress' values.
                3. Implement 'Logic Magnets': Add 'point_force' markers for tactile guidance (e.g., chord shapes, timing pulses).
                4. ASSEMBLY: Use the 4 Primitives (Trigger, Tension, Impact, Valve).
                5. ASTRA PERFORMANCE: Adapt focus based on instrument (Guitar = Shapes, Drums = Timing, Sax = Fluid paths).
                ` : ''}

                ${domain !== 'SCIENCE' && domain !== 'MUSIC' ? `
                UNIVERSAL COMPILER INSTRUCTIONS (v20.0):
                1. Map non-physical concepts to 'Spatial Entities'.
                2. Assign 'Semantic Mass' (0-1000) based on importance.
                3. Map 'Causal Dependencies' to Rapier.js Joints (Fixed = Alliance, Spring = Tension, Revolute = Turning Point).
                4. Use the X-axis for chronological time and Y-axis for intensity.
                ` : ''}

                ${hiveContext ? 'Use the WORKER BEE DRAFTS as a starting point, but ensure scientific coherence.' : ''}
                Context: ${blackboardFragment}`,
                task: routingTask,
                previousInteractionId: previousInteractionId,
                onLog: (msg, type) => logs.push({ agent: 'Apex', message: msg, type }),
                enableStreaming: true,
                onStreamingUpdate: (streamingState) => {
                    blackboard.updateStreaming(
                        streamingState.progress,
                        streamingState.entitiesReady.map(e => `${e.name || e.id} at [${e.position.x.toFixed(1)}, ${e.position.y.toFixed(1)}]`)
                    );
                },
                fallback: {
                    scenario: "Neural Stabilization Mode",
                    mode: "PHYSICS",
                    domain: "SCIENCE",
                    description: "The primary intelligence link is stabilizing. Observe the baseline grid.",
                    explanation: "Model connectivity lost. Engaging low-level physical stabilization to maintain reality feed.",
                    constraints: ["Gravity is active"],
                    successCondition: "Observe the obelisk",
                    entities: [{
                        id: "sentinel-obelisk",
                        shape: "box",
                        position: { x: 0, y: 4, z: 0 },
                        rotation: { x: 0, y: 0, z: 0, w: 1 },
                        dimensions: { x: 0.5, y: 8, z: 0.5 },
                        physics: { mass: 0, friction: 0.5, restitution: 0.5, isStatic: true },
                        visual: {
                            color: "#3b82f6",
                        },
                        name: "Quantum Obelisk"
                    }],
                    environment: {
                        gravity: { x: 0, y: -9.81, z: 0 },
                        timeScale: 1
                    }
                }
            });

            const worldState = agentRes.output;
            const interactionId = agentRes.interactionId;

            // NORMALIZATION INTERCEPTOR (The Rosetta Protocol)
            if (worldState && worldState.entities) {
                // Ensure all entities conform to IUniversalEntity standard before returning
                worldState.entities = normalizeEntities(worldState.entities);
            }

            // PHASE 4: Self-Healing Sandbox (Verification Loop)
            if (worldState) {
                let stableState = worldState;
                let isStable = true;
                let failureReason = "";

                // 1. PHYSICAL STABILITY HEURISTICS
                const entities = stableState.entities || [];

                // Check A: Massive Unanchored Entities
                const criticalMass = entities.filter(e => e.physics.mass > 500 && !e.physics.isStatic);
                if (criticalMass.length > 0) {
                    isStable = false;
                    failureReason = `Massive unanchored entities (${criticalMass[0].id}) detected. Risk of kinetic explosion.`;
                }

                // Check B: Excessive Overlap (Potential Interpenetration)
                for (let i = 0; i < entities.length; i++) {
                    for (let j = i + 1; j < entities.length; j++) {
                        const a = entities[i];
                        const b = entities[j];
                        if (a.physics.isStatic && b.physics.isStatic) continue;

                        const dist = Math.sqrt(
                            Math.pow(a.position.x - b.position.x, 2) +
                            Math.pow(a.position.y - b.position.y, 2)
                        );
                        const combinedRadius = (Math.max(a.dimensions?.x || 1, a.dimensions?.y || 1) + Math.max(b.dimensions?.x || 1, b.dimensions?.y || 1)) / 2;

                        if (dist < combinedRadius * 0.5) { // Significant overlap
                            isStable = false;
                            failureReason = `Critical overlap detected between ${a.id} and ${b.id}. Risk of spawn-time force spike.`;
                            break;
                        }
                    }
                    if (!isStable) break;
                }

                if (!isStable) {
                    logs.push({ agent: 'Sentinel', message: `⚠️ Stability Alert: ${failureReason} Initiating repair loop...`, type: 'ERROR' });

                    for (let repairAttempt = 1; repairAttempt <= 3; repairAttempt++) {
                        logs.push({ agent: 'Operator', message: `Self-healing Attempt ${repairAttempt}/3...`, type: 'THINKING' });

                        const repairRes = await executeApexLoop({
                            prompt: `${processedInput}\n\nSTABILITY FAILURE: ${failureReason}. 
                            FIX: Adjust positions to avoid overlap, increase linearDamping, or normalize mass.`,
                            schema: WorldStateSchema,
                            system: `You are the Lead Stability Engineer. Repair the simulation to be physically stable.`,
                            task: routingTask,
                            previousInteractionId: interactionId
                        });

                        if (repairRes.output) {
                            stableState = repairRes.output;
                            // Re-verify (simplified for attempt loop)
                            if (stableState.entities?.every(e => e.physics.mass <= 500)) {
                                logs.push({ agent: 'Operator', message: 'Simulation stabilized. Scaling parameters for safety.', type: 'SUCCESS' });
                                break;
                            }
                        }
                    }
                }

                logs.push({ agent: 'Aegis', message: 'Kimi K2.5 is validating DeepSeek\'s math...', type: 'THINKING' });
                const review = await reviewerAgent({
                    proposedState: JSON.stringify(stableState),
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
                        const correctedState = correctionRes.output;
                        if (correctedState && correctedState.entities) {
                            correctedState.entities = normalizeEntities(correctedState.entities);
                        }

                        blackboard.updateFromWorldState(correctedState);
                        logs.push({ agent: 'Aegis', message: 'Self-correction successful. Consensus reached.', type: 'SUCCESS' });
                        return {
                            status: 'SUCCESS' as const,
                            worldState: correctedState,
                            visionData,
                            quest: (await executeApexLoop({ prompt: processedInput, schema: QuestSchema, task: 'CHAT' })).output ?? undefined,
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
                fallback: undefined
            });
            const quest = questRes.output;

            // Update Blackboard with new state
            if (worldState) blackboard.updateFromWorldState(worldState);

            logs.push({ agent: 'Conductor', message: 'Reality Compiled successfully.', type: 'SUCCESS' });

            return {
                status: 'SUCCESS' as const,
                worldState: worldState ?? undefined,
                visionData,
                quest: quest ?? undefined,
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
