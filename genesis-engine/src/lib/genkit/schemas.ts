import { z } from 'genkit';
import { NodeData, EntitySchema, WorldStateSchema as BaseWorldStateSchema } from '../simulation/schema';

export const ComplexityLevelSchema = z.enum(['fundamental', 'standard', 'expert']);

// Schema for a single "World Rule"
export const WorldRuleSchema = z.object({
    id: z.string().describe('Unique identifier for the rule'),
    rule: z.string().describe('The core rule or principle'),
    description: z.string().describe('Detailed explanation of the rule'),
    grounding_source: z.string().describe('Direct reference or citation from the source material'),
    isActive: z.boolean().default(true).describe('Whether this rule is currently applied to the simulation'),
});

// Schema for the ingestion flow output
export const IngestionOutputSchema = z.object({
    rules: z.array(WorldRuleSchema),
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

// Schema for the physical "Reality" of a specific topic (The Prometheus Protocol)
export const WorldStateSchema = z.object({
    scenario: z.string().describe('The name of the generated scenario'),
    mode: z.enum(['PHYSICS', 'METAPHOR', 'SCIENTIFIC', 'VOXEL', 'ASSEMBLER']).describe('The simulation engine to use.'),
    entities: z.array(EntitySchema).optional(),
    voxels: z.array(z.object({
        x: z.number(),
        y: z.number(),
        z: z.number(),
        color: z.string(),
    })).optional(),
    environment: z.object({
        gravity: z.object({ x: z.number(), y: z.number(), z: z.number() }),
        timeScale: z.number().default(1),
    }).optional(),
    constraints: z.array(z.string()).describe('Rules for the Saboteur to check'),
    successCondition: z.string().describe('What defines winning the simulation'),
    description: z.string().optional(),
    explanation: z.string().optional(),
    python_code: z.string().optional().describe('Python code to execute for mathematical verification or plotting.'),
    custom_canvas_code: z.string().optional().describe('Dynamic HTML5 Canvas JS code for custom math visualizations.'),
    sabotage_reveal: z.string().optional(),
    societalImpact: z.string().optional(),
});

// Schema for the global God Mode / Intervention state
export const GodModeStateSchema = z.object({
    complexity: ComplexityLevelSchema,
    constants: z.record(z.string(), z.number()).describe('Dynamically mapped constants from the WorldState'),
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
});

export const StructuralAnalysisSchema = z.object({
    elements: z.array(z.object({
        id: z.string(),
        type: z.enum(['beam', 'joint', 'support', 'load']),
        box_2d: z.array(z.number()).describe('[ymin, xmin, ymax, xmax]'),
        properties: z.object({
            material: z.string().optional(),
            connectionType: z.string().optional(), // for joints
            magnitude: z.number().optional(), // for loads
        }).optional(),
    })),
    physicsConstraints: z.array(z.string()).describe('Inferred physical rules (e.g., "Fixed support at base")'),
    stabilityScore: z.number().min(0).max(100).optional(),
    analysis: z.string().optional().describe('Mental model of the structure.'),
    suggestion: z.string().optional().describe('Advice for the user.'),
});

export type SkillTree = z.infer<typeof SkillTreeSchema>;
export type ComplexityLevel = z.infer<typeof ComplexityLevelSchema>;
export type SkillNode = z.infer<typeof SkillNodeSchema>;
export type StructuralAnalysis = z.infer<typeof StructuralAnalysisSchema>;
