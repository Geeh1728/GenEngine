import { z } from 'genkit';

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
    mode: z.enum(['PHYSICS', 'METAPHOR']).describe('Whether to simulate literal physics or abstract metaphors'),
    entities: z.array(z.object({
        id: z.string(),
        type: z.enum(['cube', 'sphere', 'fluid', 'softbody', 'complex']),
        physics: z.object({
            mass: z.number(),
            friction: z.number(),
            restitution: z.number(),
            initialPosition: z.tuple([z.number(), z.number(), z.number()]).optional(),
        }),
        visuals: z.object({
            color: z.string(),
            scale: z.tuple([z.number(), z.number(), z.number()]),
            modelUrl: z.string().optional(),
        }).optional(),
        analogyLabel: z.string().optional().describe('Label for metaphor mode (e.g., "Money Supply")'),
    })),
    constraints: z.array(z.string()).describe('Rules for the Saboteur to check'),
    successCondition: z.string().describe('What defines winning the simulation'),
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
});
