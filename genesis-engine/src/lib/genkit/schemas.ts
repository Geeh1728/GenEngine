import { z } from 'zod';
import { NodeData, EntitySchema, WorldStateSchema, Entity } from '../simulation/schema';

export { WorldStateSchema, EntitySchema } from '../simulation/schema';
export type { Entity } from '../simulation/schema';

export const ComplexityLevelSchema = z.enum(['fundamental', 'standard', 'expert']);

// Schema for a single "World Rule"
export const WorldRuleSchema = z.object({
    id: z.string().describe('Unique identifier for the rule'),
    rule: z.string().describe('The core rule or principle'),
    description: z.string().describe('Detailed explanation of the rule'),
    grounding_source: z.string().describe('Direct reference or citation from the source material'),
    isActive: z.boolean().default(true).describe('Whether this rule is currently applied to the simulation'),
});

// ECS Component Definition
export const ECSComponentSchema = z.object({
    type: z.string().describe('Component Type (e.g., PhaseState, Volatility)'),
    properties: z.record(z.string(), z.union([z.number(), z.string(), z.boolean(), z.array(z.number())]))
        .describe('Key-value pairs for component properties'),
    trigger: z.string().optional().describe('Condition to trigger this component (e.g., "temp > 100")'),
    effect: z.string().optional().describe('Visual or logic effect (e.g., "bubble_emitter")')
});

// ECS Entity Definition
export const SimEntitySchema = z.object({
    name: z.string(),
    components: z.array(ECSComponentSchema)
});

// Simulation Configuration (The Output of Text-to-ECS)
export const SimConfigSchema = z.object({
    entities: z.array(SimEntitySchema),
    globalParameters: z.record(z.string(), z.number()).describe('Global constants like gravity, temperature'),
    scenarios: z.array(z.string()).describe('Description of testable scenarios')
});

// Schema for the ingestion flow output
export const IngestionOutputSchema = z.object({
    rules: z.array(WorldRuleSchema),
    simulationConfig: SimConfigSchema.optional().describe('Compiled ECS data for the simulation'),
    metadata: z.object({
        source_type: z.enum(['pdf', 'youtube']),
        title: z.string(),
    }),
});

// Schema for the Simulation Card
export const SimulationCardSchema = z.object({
    title: z.string().describe('The name of the simulation mechanic or rule set'),
    description: z.string().describe('A brief explanation of the rules'),
    rules: z.array(z.object({
        name: z.string(),
        effect: z.string(),
        verified: z.boolean().describe('Whether this rule was successfully verified against the source text'),
        source_citation: z.string().optional().describe('Direct quote or page reference from the PDF'),
    })),
    actions: z.array(z.string()).describe('Available interactive handles for the user'),
});

// Schema for the global God Mode / Intervention state
export const GodModeStateSchema = z.object({
    complexity: ComplexityLevelSchema,
    constants: z.array(z.object({
        name: z.string(),
        value: z.number()
    })).describe('Dynamically mapped constants from the WorldState'),
    overrides: z.array(z.string()).describe('IDs of World Rules that are currently disabled'),
});

// --- MASTERY OS SCHEMAS ---

export const SkillNodeSchema = z.object({
    id: z.string(),
    label: z.string(),
    description: z.string(),
    dependencies: z.array(z.string()).describe('IDs of prerequisite nodes'),
    type: z.enum(['CONCEPT', 'MATH', 'SIMULATION', 'PROJECT']),
    engineMode: z.enum(['LAB', 'RAP', 'VOX', 'ASM']).optional().describe('The simulation engine to use for this node.'),
    estimatedMinutes: z.number().default(15),
    needs_oracle: z.boolean().optional().describe('Flag if this node requires deeper research via the Librarian (Oracle).'),
    crossReferences: z.array(z.object({
        targetId: z.string(),
        reason: z.string(),
        subject: z.string().describe('The related subject area, e.g. "Biology", "Economics"')
    })).optional().describe('Semantic links to other subjects or previous simulations.'),
    data: z.custom<NodeData>().optional().describe('Simulation data associated with this node (PhysicsParams, VoxelData[], or WorldState)'),
});

export const SkillTreeSchema = z.object({
    goal: z.string(),
    nodes: z.array(SkillNodeSchema),
    recommendedPath: z.array(z.string()).describe('Ordered list of Node IDs to follow'),
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
    }).optional().describe('Module Spider: 3D Knowledge Graph structure for visual manifestation.')
});

// --- AGENTIC VISION & SENTINEL SCHEMAS ---

export const StructuralHeatmapSchema = z.object({
    points: z.array(z.object({
        x: z.number(),
        y: z.number(),
        z: z.number(),
        severity: z.number().min(0).max(1), // 0 = Safe, 1 = Critical Failure Point
        reason: z.string().optional()
    })),
    overallStability: z.number().min(0).max(100),
    remediationAdvice: z.string().optional()
});

export const KinematicGraphSchema = z.object({
    mechanisms: z.array(z.object({
        type: z.enum(['gear', 'lever', 'pulley', 'pivot', 'linkage']),
        points: z.array(z.object({ x: z.number(), y: z.number(), z: z.number() })),
        parentEntityId: z.string().optional(),
        interactionLogic: z.string().describe('JS logic for how this mechanism moves')
    })),
    constraints: z.array(z.string())
});

export const StructuralAnalysisSchema = z.object({
    elements: z.array(z.object({
        id: z.string(),
        type: z.enum(['beam', 'joint', 'support', 'load', 'mechanism']),
        box_2d: z.array(z.number()).describe('[ymin, xmin, ymax, xmax]'),
        properties: z.object({
            material: z.string().optional(),
            connectionType: z.string().optional(),
            magnitude: z.number().optional(),
        }).optional(),
        neuralPhysics: z.object({
            elasticity_range: z.array(z.number()).describe('[min, max]'),
            fracture_point: z.number(),
            thermal_conductivity: z.number(),
        }).optional().describe('Predicted physical probability distribution from MLLM-P3'),
        kinematics: KinematicGraphSchema.optional()
    })),
    joints: z.array(z.object({
        parent_id: z.string(),
        child_id: z.string(),
        connection_type: z.enum(['fixed', 'revolute', 'spherical']),
        anchor_point: z.object({
            x: z.number(),
            y: z.number(),
            z: z.number()
        })
    })).optional().describe('Inferred connections between objects'),
    physicsConstraints: z.array(z.string()).describe('Inferred physical rules (e.g., "Fixed support at base")'),
    stabilityScore: z.number().min(0).max(100).optional(),
    analysis: z.string().optional().describe('Mental model of the structure.'),
    suggestion: z.string().optional().describe('Advice for the user.'),
});

export const SummaryOutputSchema = z.object({
    summary: z.string().describe('The generated summary of the text chunk')
});

export const SimulationMutationSchema = z.object({
    type: z.enum(['ENTITY_UPDATE', 'ENVIRONMENT_UPDATE', 'JOINT_REMOVE', 'ENTITY_ADD']),
    targetId: z.string().optional().describe('ID of the entity or joint to mutate'),
    patch: z.record(z.string(), z.any()).optional().describe('The delta to apply'),
    biome: z.enum(['SPACE', 'EARTH', 'OCEAN', 'FACTORY', 'JUPITER']).optional(),
    explanation: z.string().optional().describe('AI explanation of why this change was made')
});

export type SkillTree = z.infer<typeof SkillTreeSchema>;
export type ComplexityLevel = z.infer<typeof ComplexityLevelSchema>;
export type SkillNode = z.infer<typeof SkillNodeSchema>;
export type StructuralAnalysis = z.infer<typeof StructuralAnalysisSchema>;
export type StructuralHeatmap = z.infer<typeof StructuralHeatmapSchema>;
