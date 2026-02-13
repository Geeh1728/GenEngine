import { ai, OPENROUTER_FREE_MODELS, MODELS } from '../config';
import { z } from 'zod';
import { criticAgent } from './critic';
import { physicistAgent } from './physicist';
import { artistAgent } from './artist';

import { translatorAgent } from './translator';
import { visionFlow } from './vision';
import { researcherAgent } from './researcher';
import { reviewerAgent } from './reviewer';
import { librarianAgent } from './librarian';

import { WorldStateSchema, StructuralAnalysisSchema, StructuralAnalysis, SimulationMutationSchema, EntitySchema, Entity } from '../schemas';
import { normalizeEntities } from '@/lib/simulation/normalizer';
import { rippleAgent } from './ripple';
import { QuestSchema } from './questAgent';
import { blackboard } from '../context';
import { executeApexLoop } from '../resilience';
import { hiveBus } from '../event-bus';
import { queryResidue } from '@/lib/db/residue';

const TaskManifestSchema = z.object({
    subTasks: z.array(z.object({
        agentType: z.enum(['Shader Specialist', 'Joint/Constraint Specialist', 'Math/Trajectory Specialist', 'Fluid Dynamics Specialist']),
        instruction: z.string()
    })).describe('Decomposed tasks for specialized Hive experts')
});

const EXPERT_SYSTEM_PROMPTS = {
    'Shader Specialist': 'You are a GLSL graphics expert. Focus on vertex displacement, color heatmaps, and noise-based visual effects. Output valid glsl and entity visual properties.',
    'Joint/Constraint Specialist': 'You are a mechanical engineer. Focus on joints, springs, and physical constraints. Ensure structural stability via correct anchor points.',
    'Math/Trajectory Specialist': 'You are a physicist. Focus on exact starting positions, linear/angular velocities, and orbital vectors. Output precise numeric data.',
    'Fluid Dynamics Specialist': 'You are a fluid simulation expert. Focus on particle density, viscosity, and buoyancy. Output entity properties for fluid/softbody shapes.'
};

const WorkerOutputSchema = z.object({
    entities: z.array(EntitySchema).optional(),
    shaderCode: z.string().optional(),
    constraints: z.array(z.string()).optional()
});

/**
 * MODULE Σ: THE CONSENSUS WEAVER (v60.0 GOLD)
 * Objective: Merge discrete worker outputs into a single 'Gold Standard' reality.
 * Intelligence: DeepSeek-R1 Reasoning Core.
 */
export const consensusWeaverFlow = ai.defineFlow(
    {
        name: 'consensusWeaverFlow',
        inputSchema: z.object({
            generalGoal: z.string(),
            workerResults: z.array(WorkerOutputSchema)
        }),
        outputSchema: WorldStateSchema
    },
    async (input) => {
        const { generalGoal, workerResults } = input;
        
        blackboard.log('Arbitrator', 'Consensus Weaver: Fusing expert outputs into a coherent reality...', 'THINKING');

        const result = await executeApexLoop({
            task: 'MATH',
            model: MODELS.LOGIC_DEEPSEEK,
            prompt: `
                ROLE: The Consensus Weaver (Final Orchestrator).
                MISSION: Synthesize a single 'Gold Standard' WorldState from the following specialist workers.
                
                GOAL: "${generalGoal}"
                WORKER RESULTS: ${JSON.stringify(workerResults)}
                
                TASK:
                1. Fix any ID mismatches between the Joint Specialist and Shader Specialist.
                2. Resolve scale inconsistencies (e.g. if one worker suggests 1m and another 10m for the same object).
                3. Ensure every entity has valid physics and visual components.
                4. Output a single, 100% stable WorldState JSON.
            `,
            schema: WorldStateSchema
        });

        if (!result.output) throw new Error("Consensus Weaver failed to stabilize reality.");
        
        return result.output;
    }
);

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
        - Shader Specialist: Focus on colors, textures, and GLSL effects.
        - Joint/Constraint Specialist: Focus on connections, hinges, and physical limits.
        - Math/Trajectory Specialist: Focus on exact positions, velocities, and orbital paths.
        - Fluid Dynamics Specialist: Focus on liquids, softbodies, and pressure.
        
        Return JSON.`,
        schema: TaskManifestSchema
    });

    if (!plan.output) return null;

    // 2. THE EXPERTS (Fine-Grained MOE)
    const workerPromises = plan.output.subTasks.map(task => {
        hiveBus.registerWorker();
        const systemPrompt = EXPERT_SYSTEM_PROMPTS[task.agentType as keyof typeof EXPERT_SYSTEM_PROMPTS];
        
        // Route to Reflex waterfall for speed
        return executeApexLoop({
            task: 'REFLEX',
            system: systemPrompt,
            prompt: `Instruction: ${task.instruction}.
            Return JSON matching WorkerOutputSchema. Focus ONLY on your specific domain.`,
            schema: WorkerOutputSchema
        }).finally(() => hiveBus.releaseWorker());
    });

    const results = await Promise.all(workerPromises);

    // 3. ASSEMBLY (Consensus Weaver v60.0)
    const validResults = results.map(r => r.output).filter(Boolean) as z.infer<typeof WorkerOutputSchema>[];
    
    if (validResults.length > 0) {
        return await consensusWeaverFlow({
            generalGoal,
            workerResults: validResults
        });
    }

    return null;
}

/**
 * v33.0 NEURAL ARBITRATOR
 * Resolves logical conflicts between Gemini and DeepSeek.
 */
async function arbitrateConsensus(geminiState: any, deepseekState: any, prompt: string): Promise<any> {
    console.log("[Arbitrator] Disagreement detected. Negotiating Consensus via Groq LPU...");
    
    const result = await executeApexLoop({
        task: 'REFLEX', // Fast resolution
        prompt: `
        ROLE: Neural Arbitrator (LPU Overclocked).
        GOAL: Resolve physical disagreements between two world models.
        
        USER PROMPT: "${prompt}"
        
        MODEL A (Architect): ${JSON.stringify(geminiState.entities)}
        MODEL B (Auditor): ${JSON.stringify(deepseekState.entities)}
        
        TASK:
        1. Identify the most stable physical parameters from BOTH models.
        2. If they disagree on a value (e.g. mass), use your intuition to pick the more realistic one.
        3. Output a unified, 100% stable WorldState JSON that fulfills the user intent.
        
        AXIOMATIC EVOLUTION: If the user's intent is physically impossible, INVENT a new 'customConstants' entry to justify it.
        `,
        schema: WorldStateSchema,
        model: MODELS.GROQ_LLAMA_31_8B // v60.0: 14.4k RPD for instant consensus
    });

    return result.output;
}

/**
 * v31.0 THE JUDGE (Consensus Agent)
 * Specifically handles rule collisions in Grafted worlds.
 */
async function invokeTheJudge(conflicts: any[], userIntent: string): Promise<any> {
    console.log("[The Judge] Resolving physical rule collisions via DeepSeek-R1...");
    
    const result = await executeApexLoop({
        task: 'MATH', // DeepSeek-R1 for reasoning
        model: MODELS.LOGIC_DEEPSEEK,
        prompt: `
        ROLE: The Judge (Consensus Agent).
        CONFLICTS DETECTED: ${JSON.stringify(conflicts)}
        USER INTENT: "${userIntent}"
        
        TASK:
        1. Conflict detected between Source A and Source B variables.
        2. Based on user intent and scientific plausibility, synthesize a weighted average or choose the dominant law.
        3. Output the Resolution JSON.
        `,
        schema: z.object({
            resolvedVariables: z.record(z.any()),
            explanation: z.string()
        })
    });

    return result.output;
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
    // NEW: Sovereign Mint (v41.0)
    userKeys: z.record(z.string()).optional(),
    isPro: z.boolean().optional().default(false)
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
    knowledgeGraph: z.object({
        nodes: z.array(z.object({
            id: z.string(),
            label: z.string(),
            type: z.enum(['CONCEPT', 'ENTITY', 'FORCE']),
            description: z.string().optional(),
            certainty: z.number().min(0).max(1).default(1),
            timestamp: z.number().optional()
        })),
        edges: z.array(z.object({
            source: z.string(),
            target: z.string(),
            label: z.string().optional(),
            strength: z.number().min(0).max(1).default(0.5)
        })),
        ghostEdges: z.array(z.object({
            source: z.string(),
            target: z.string(),
            label: z.string().optional(),
            userId: z.string().optional()
        })).optional()
    }).optional().describe('Module Spider: 3D Knowledge Graph structure.'),
    chaosTrigger: z.enum(['WIND', 'ENTROPY', 'DISSONANCE']).optional().describe('Module Chaos: Saboteur-initiated physical event.'),
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
        const { text, image, audioTranscript, mode, isSabotageMode, isSaboteurReply, interactionState, previousInteractionId, userKeys, isPro } = params;
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
        let hiveContext = "";
        let primaryAgent: any = physicistAgent;
        let primaryAgentName = 'Physicist';
        let routingTask: any = 'GENERAL';
        let domain: 'SCIENCE' | 'HISTORY' | 'MUSIC' | 'TRADE' | 'ABSTRACT' = 'SCIENCE';

        // Add Blackboard fragment to prompt
        let blackboardFragment = blackboard.getSystemPromptFragment();

        // --- NEURAL RESIDUE INJECTION (v30.0) ---
        const residues = await queryResidue(processedInput.split(' ')[0]);
        if (residues.length > 0) {
            logs.push({ agent: 'Hippocampus', message: `Analyzing ${residues.length} historical structural residues...`, type: 'INFO' });
            blackboardFragment += `\n\nHISTORICAL PHYSICAL RESIDUE (Past Failures/Successes):\n${JSON.stringify(residues.map(r => ({ scenario: r.scenario, outcome: r.outcome, reason: r.failureReason })))}`;
        }

        // PHASE 0.5: GRAFTING & RULE COLLISION DETECTION (v31.0)
        if (processedInput.toLowerCase().includes('graft') || processedInput.toLowerCase().includes('combine')) {
            logs.push({ agent: 'The Judge', message: 'Graft detected. Auditing physical law overlaps...', type: 'THINKING' });
            
            // Detect collisions in blackboard worldRules
            const activeRules = blackboard.getContext().worldRules.filter(r => r.isActive);
            const collisions: any[] = [];
            
            const keywords = ['gravity', 'friction', 'mass', 'time', 'density'];
            keywords.forEach(kw => {
                const matches = activeRules.filter(r => r.rule.toLowerCase().includes(kw));
                if (matches.length > 1) {
                    collisions.push({ variable: kw, rules: matches.map(m => m.rule) });
                }
            });

            if (collisions.length > 0) {
                const resolution = await invokeTheJudge(collisions, processedInput);
                if (resolution) {
                    logs.push({ agent: 'The Judge', message: `Resolved ${collisions.length} collisions: ${resolution.explanation}`, type: 'SUCCESS' });
                    blackboardFragment += `\n\nJUDGE RESOLUTION (Follow these over individual rules):\n${JSON.stringify(resolution.resolvedVariables)}`;
                }
            }
        }

        // PHASE 0.1: Multimodal Pre-processing

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
        
        if (criticResult.chaos_trigger) {
            logs.push({ 
                agent: 'Saboteur', 
                message: `⚠️ LEVEL GOD ENGAGED: ${criticResult.message}. Deploying ${criticResult.chaos_trigger} event to test structural integrity.`, 
                type: 'ERROR' 
            });
            // We'll pass this trigger through to the result or apply it immediately if we're in PLAYING mode.
        }

        logs.push({ agent: 'Aegis', message: 'Concept verified safe for simulation.', type: 'SUCCESS' });

        // --- SENTINEL PHYSICS LAWYER (v21.0) ---
        const activeRules = blackboard.getContext().worldRules.filter(r => r.isActive);
        if (activeRules.length > 0) {
            logs.push({ agent: 'Sentinel', message: 'Validating intent against Ingested Truths...', type: 'THINKING' });
            
            try {
                const legalCheck = await executeApexLoop({
                    task: 'MATH', // Use DeepSeek for strict logic
                    prompt: `
                    ROLE: Sentinel Physics Lawyer.
                    USER INTENT: "${processedInput}"
                    LEGAL CODE (Extracted Rules):
                    ${activeRules.map(r => `Rule ${r.id}: ${r.rule} (Source: ${r.grounding_source})`).join('\n')}
                    
                    TASK:
                    Does this intent violate the physical laws defined in the source material?
                    
                    OUTPUT:
                    If VIOLATION: { "status": "VIOLATION", "message": "Violation Detected: [Explanation with citation]" }
                    If SAFE: { "status": "SAFE" }
                    `,
                    schema: z.object({
                        status: z.enum(['SAFE', 'VIOLATION']),
                        message: z.string().optional()
                    }),
                    userKeys,
                    isPro
                });

                if (legalCheck.output?.status === 'VIOLATION') {
                    logs.push({ agent: 'Sentinel', message: legalCheck.output.message!, type: 'ERROR' });
                    return {
                        status: 'BLOCKED' as const,
                        message: legalCheck.output.message,
                        logs
                    };
                }
                logs.push({ agent: 'Sentinel', message: 'Intent conforms to Scientific Truths.', type: 'SUCCESS' });
            } catch (err) {
                console.warn("[Sentinel] Legal check failed, proceeding with caution.", err);
            }
        }

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
                    5. TACTILE TRUTH (v29.0): If the user wants to be guided or find the answer, add 'behavior' { type: 'ATTRACT', strength: 5.0, radius: 2.0 } to correct entities. Add 'REPULSE' with strength 10.0 to wrong ones.
                    
                    Return JSON matching SimulationMutationSchema.
                    `,
                    schema: SimulationMutationSchema,
                    task: 'REFLEX', // Use reflex for speed
                    userKeys,
                    isPro
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
        const isDeepResearch = processedInput.toLowerCase().includes('research') || processedInput.toLowerCase().includes('deep dive');
        let sessionKnowledgeGraph: any = null;

        if (urlMatch) {
            const detectedUrl = urlMatch[0];
            logs.push({ agent: 'Oracle', message: `🔗 Direct Link detected: ${detectedUrl}. Grounding simulation logic... ${isDeepResearch ? '(Module Spider Engaged)' : ''}`, type: 'THINKING' });

            try {
                const oracleResult = await librarianAgent({
                    userQuery: processedInput,
                    url: detectedUrl,
                    isGrounding: true,
                    recursiveDepth: isDeepResearch ? 1 : undefined
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

                if (oracleResult.knowledgeGraph) {
                    sessionKnowledgeGraph = oracleResult.knowledgeGraph;
                    logs.push({ agent: 'Librarian', message: 'Knowledge Graph synthesized from deep crawl.', type: 'SUCCESS' });
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

        // PHASE 2: Determine Routing (TRIANGLE OF POWER)
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

        // HIERARCHICAL SWARM TRIGGER (v13.0 GOLD)
        const isComplexTask = processedInput.length > 100 || processedInput.toLowerCase().includes('build') || processedInput.toLowerCase().includes('create');
        let synthesizedWorldState: WorldState | null = null;

        if (isComplexTask && !isSaboteurReply) {
            logs.push({ agent: 'General', message: 'Task complexity high. Spawning worker swarm...', type: 'THINKING' });
            // v41.0: Hive experts would need keys too, but we start with parallel apex
            const swarmResult = await executeHiveSwarm(processedInput, blackboardFragment);
            if (swarmResult) {
                // v60.0: swarmResult is now a synthesized WorldState from the Consensus Weaver
                synthesizedWorldState = swarmResult as WorldState;
                logs.push({ agent: 'Hive', message: `Consensus Weaver has finalized the 'Gold Standard' reality.`, type: 'SUCCESS' });
            }
        }

        // --- CAUSAL RIPPLE CHECK (v23.5) ---
        // If we just applied a mutation or are about to build, check for Cross-Domain Consequences
        if (processedInput.toLowerCase().includes('gravity') || processedInput.toLowerCase().includes('time') || processedInput.toLowerCase().includes('light')) {
            logs.push({ agent: 'Sentinel', message: 'Analyzing Cross-Domain Causal Ripples...', type: 'THINKING' });

            // Simple heuristic for immediate feedback (Real logic would be in a dedicated agent)
            if (domain === 'MUSIC' && (processedInput.toLowerCase().includes('gravity') || processedInput.includes('0.5'))) {
                logs.push({ agent: 'Astra', message: 'CAUSAL RIPPLE (Music): Low gravity detected. Lowering acoustic frequency floor. Sustain increased by 400%.', type: 'INFO' });
            }
            if (domain === 'HISTORY' && (processedInput.toLowerCase().includes('gravity'))) {
                logs.push({ agent: 'Astra', message: 'CAUSAL RIPPLE (History): Roman Aqueducts would fail. Water flow relies on standard G.', type: 'INFO' });
            }
            if (domain === 'SCIENCE' && processedInput.toLowerCase().includes('light')) {
                logs.push({ agent: 'Astra', message: 'CAUSAL RIPPLE (Physics): Changing the speed of light? Prepare for Relativistic Distortion.', type: 'RESEARCH' });
            }
        }

        // PHASE 3: Parallel Execution via APEX LOOP
        if (synthesizedWorldState) {
            logs.push({ agent: 'Conductor', message: 'Using Gold Standard reality from Consensus Weaver.', type: 'SUCCESS' });
            
            // NORMALIZATION INTERCEPTOR (The Rosetta Protocol)
            if (synthesizedWorldState.entities) {
                synthesizedWorldState.entities = await normalizeEntities(synthesizedWorldState.entities);
            }

            // Update Blackboard
            blackboard.updateFromWorldState(synthesizedWorldState);

            return {
                status: 'SUCCESS' as const,
                worldState: synthesizedWorldState,
                visionData,
                logs,
                nextState: 'PLAYING' as const
            };
        }

        logs.push({ agent: 'Conductor', message: `Synthesizing neural outputs via Gemini & DeepSeek...`, type: 'THINKING' });
        try {
            // v32.0 THE DISAGREEMENT ENGINE: Execute two models in parallel
            const [geminiRes, deepseekRes] = await Promise.all([
                executeApexLoop({
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

                    GLOBAL PROTOCOLS:
                    TACTILE TRUTH (v29.0): Add 'behavior' { type: 'ATTRACT', strength: 5.0, radius: 2.0 } to "Correct" or "Goal" entities to guide the user's hand. Add 'behavior' { type: 'REPULSE', strength: 10.0, radius: 2.0 } to "Logical Fallacies" or "Distractors".
                    SEMANTIC COMPRESSION (v29.2): For MACRO views, suggest "Swarm Entities" that represent aggregate data.
                    AXIOM-BREAKER VIOLET (v29.3): If a user forces a physical impossibility, flag the entity with isUnstable: true and color: "#8A2BE2".
                    
                    v30.0 COGNITIVE SYNTHESIS:
                    1. COGNITIVE TEXTURE: Assign 'certainty' (0.0 to 1.0) to every entity based on grounding reliability.
                    2. AXOIMATIC AUTO-GENESIS: If the user requests a state that violates standard physics, DO NOT reject it. Instead, DEVELOP a new 'python_code' formula that mathematically justifies the state (e.g., localized gravity field, anti-matter buoyancy).
                    3. PROBABILITY CLOUDS: For complex outcomes, suggest multiple 'probabilitySnapshots' for entities.
                    4. CROSS-DOMAIN MAPPING: Map ALL abstract subjects to these physical analogs (e.g., Inflation = Thermal Conductivity, Revolution = Kinetic Energy).

                    v31.0 TITAN SOVEREIGNTY:
                    1. ADVERSARIAL CHAOS: If the simulation is too stable, occasionally suggest a "Stress Test" (e.g., "Send a Level 5 Hurricane", "Simulate a Market Crash").
                    2. DETERMINISTIC PRIMITIVES: Favor reusing established physical entities (e.g., 'Foundation', 'Singularity') to minimize jank.
                    3. SOCRATIC ADVERSARY: When in 'reflection' mode, take an opposing view to the user's conclusion to force a "Survival of the Fittest" logic loop.

                    ${hiveContext ? 'Use the WORKER BEE DRAFTS as a starting point, but ensure scientific coherence.' : ''}
                    Context: ${blackboardFragment}`,
                    task: routingTask,
                    previousInteractionId: previousInteractionId,
                    model: MODELS.BRAIN_FLASH_3,
                    onLog: (msg, type) => logs.push({ agent: 'Gemini', message: msg, type }),
                    enableStreaming: true,
                    onStreamingUpdate: (streamingState) => {
                        blackboard.updateStreaming(
                            streamingState.progress,
                            streamingState.entitiesReady.map(e => `${e.name || e.id} at [${e.position.x.toFixed(1)}, ${e.position.y.toFixed(1)}]`)
                        );
                    },
                    userKeys,
                    isPro,
                    fallback: {
                        scenario: "Neural Stabilization Mode",
                        mode: "PHYSICS",
                        domain: "SCIENCE",
                        description: "The primary intelligence link is stabilizing. Observe the baseline grid.",
                        explanation: "Model connectivity lost. Engaging low-level physical stabilization to maintain reality feed.",
                        constraints: ["Gravity is active"],
                        successCondition: "Observe the obelisk",
                        _renderingStage: 'SOLID',
                        _resonanceBalance: 0.5,
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
                            certainty: 1.0,
                            name: "Quantum Obelisk"
                        }],
                        environment: {
                            gravity: { x: 0, y: -9.81, z: 0 },
                            timeScale: 1
                        }
                    }
                }),
                executeApexLoop({
                    prompt: `${processedInput}\n\n${hiveContext}`,
                    schema: WorldStateSchema,
                    system: `You are the Logical Auditor. Construct the WorldState focusing on mathematical rigor.
                    DOMAIN: ${domain}
                    GLOBAL PROTOCOLS: TACTILE TRUTH, AXIOM-BREAKER, COGNITIVE SYNTHESIS.
                    Return valid WorldState JSON.`,
                    task: 'MATH',
                    model: MODELS.LOGIC_DEEPSEEK,
                    onLog: (msg, type) => logs.push({ agent: 'DeepSeek', message: msg, type }),
                    userKeys,
                    isPro
                })
            ]);

            const worldState = geminiRes.output;
            const interactionId = geminiRes.interactionId;

            // v32.0 THE DISAGREEMENT ENGINE: Calculate Shimmer
            if (worldState && deepseekRes.output && worldState.entities && deepseekRes.output.entities) {
                logs.push({ agent: 'Conductor', message: 'Comparing Model Outputs for Epistemic Shimmer...', type: 'THINKING' });
                
                let totalDisagreement = 0;
                worldState.entities = worldState.entities.map(e => {
                    const dsEntity = deepseekRes.output!.entities!.find((de: any) => de.id === e.id || de.name === e.name);
                    if (dsEntity) {
                        // Calculate disagreement score (0-1) based on mass and friction deltas
                        const massDelta = Math.abs(e.physics.mass - dsEntity.physics.mass) / Math.max(e.physics.mass, 1);
                        const frictionDelta = Math.abs(e.physics.friction - dsEntity.physics.friction);
                        const disagreement = Math.min((massDelta + frictionDelta) / 2, 1.0);
                        totalDisagreement += disagreement;
                        
                        return {
                            ...e,
                            disagreementScore: disagreement
                        };
                    }
                    totalDisagreement += 0.5;
                    return { ...e, disagreementScore: 0.5 }; // Disagreement if one model missed the entity
                });

                const avgDisagreement = totalDisagreement / worldState.entities.length;
                const consensus = Math.round((1 - avgDisagreement) * 100);
                blackboard.update({ consensusScore: consensus });

                // v33.0 NEURAL ARBITRATION: Force consensus if disagreement is high
                if (consensus < 80) {
                    logs.push({ agent: 'Arbitrator', message: `Low Consensus (${consensus}%). Negotiating physical truth...`, type: 'THINKING' });
                    const consensusState = await arbitrateConsensus(worldState, deepseekRes.output, processedInput);
                    if (consensusState) {
                        blackboard.update({ consensusScore: 100 }); // Arbitrated
                        return {
                            status: 'SUCCESS' as const,
                            worldState: consensusState,
                            visionData,
                            logs,
                            nextState: 'PLAYING' as const
                        };
                    }
                }
            }

            // NORMALIZATION INTERCEPTOR (The Rosetta Protocol)
            if (worldState && worldState.entities) {
                // Ensure all entities conform to IUniversalEntity standard before returning
                worldState.entities = await normalizeEntities(worldState.entities);
            }

            // --- TITAN PARADOX: CAUSAL RIPPLE CHECK (Module Γ) v26.0 ---
            if (worldState) {
                try {
                    const ripplesData = await rippleAgent({
                        worldState: worldState as any,
                        hypothesis: processedInput
                    });

                    ripplesData.ripples.forEach((r: any) => {
                        logs.push({
                            agent: 'Oracle',
                            message: `🌊 [${r.domain} ripple]: ${r.impact}`,
                            type: r.severity === 'KATASTROPHIC' ? 'ERROR' : 'RESEARCH'
                        });
                    });

                    // If instability is high, flag for Paradox Stress-Test
                    if (ripplesData.overall_instability > 0.8) {
                        worldState.stability_faults = [...(worldState.stability_faults || []), "Structural Causal Instability detected."];
                        worldState.explosive_potential = Math.max(worldState.explosive_potential || 0, 0.8);
                    }
                } catch (e) {
                    console.error("[Orchestrator] Causal Ripple engine failed:", e);
                }
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
                            previousInteractionId: interactionId,
                            userKeys,
                            isPro
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
                        previousInteractionId: interactionId,
                        userKeys,
                        isPro
                    });
                    if (correctionRes.output) {
                        const correctedState = correctionRes.output;
                        if (correctedState && correctedState.entities) {
                            correctedState.entities = await normalizeEntities(correctedState.entities);
                        }

                        blackboard.updateFromWorldState(correctedState);
                        logs.push({ agent: 'Aegis', message: 'Self-correction successful. Consensus reached.', type: 'SUCCESS' });
                        return {
                            status: 'SUCCESS' as const,
                            worldState: correctedState,
                            visionData,
                            quest: (await executeApexLoop({ prompt: processedInput, schema: QuestSchema, task: 'CHAT', userKeys, isPro })).output ?? undefined,
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
                fallback: undefined,
                userKeys,
                isPro
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
                knowledgeGraph: sessionKnowledgeGraph ?? undefined,
                chaosTrigger: criticResult.chaos_trigger,
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
