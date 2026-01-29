import { z } from 'zod';

/**
 * CRITICAL FIX FOR GEMINI API: 
 * We must avoid reusing schemas (like Vector3Schema) directly in multiple places,
 * as Zod-to-JSON-Schema will generate "$ref" pointers which Gemini 2.5 does not support.
 * We manually inline or use factory functions to keep the schema "Flat" from a reference perspective.
 */

// --- Atomic Schemas (Exported for Reusability) ---

export const Vector3Schema = z.object({ x: z.number(), y: z.number(), z: z.number() });

export const EntitySchema = z.object({
    id: z.string(),
    type: z.enum(['cube', 'box', 'sphere', 'cylinder', 'plane', 'fluid', 'softbody']),
    name: z.string().optional(),
    physics: z.object({
        mass: z.number().min(0),
        friction: z.number().min(0).max(1),
        restitution: z.number().min(0).max(1),
    }),
    position: Vector3Schema.default({ x: 0, y: 0, z: 0 }),
    rotation: Vector3Schema.optional().default({ x: 0, y: 0, z: 0 }),
    dimensions: Vector3Schema.optional(),
    color: z.string().optional(),
    texturePrompt: z.string().optional(),
    isStatic: z.boolean().optional(),
    analogyLabel: z.string().optional(),
    truthSource: z.enum(['GROUNDED', 'CALCULATED', 'METAPHOR']).optional().describe('The origin of this entity logic: GROUNDED (Verified by source), CALCULATED (Python/Math), METAPHOR (AI Generative)'),
    citation: z.object({
        source: z.string(),
        snippet: z.string().optional(),
        url: z.string().optional(),
    }).optional().describe('Grounding information for this entity.'),
});

export const VoxelSchema = z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
    color: z.string(),
});

export const JointSchema = z.object({
    id: z.string(),
    type: z.enum(['fixed', 'spherical', 'revolute', 'prismatic']),
    bodyA: z.string(),
    bodyB: z.string(),
    anchorA: Vector3Schema,
    anchorB: Vector3Schema,
});

export const ScientificParamsSchema = z.object({
    l1: z.number().optional(),
    l2: z.number().optional(),
    m1: z.number().optional(),
    m2: z.number().optional(),
    g: z.number().optional(),
    initialState: z.array(z.number()).optional(),
});

export const EnvironmentSchema = z.object({
    gravity: Vector3Schema,
    timeScale: z.number().default(1),
});

// --- WorldState Schema: The complete snapshot of a simulation frame ---

export const WorldStateSchema = z.object({
    scenario: z.string().min(10),
    mode: z.enum(["IDLE", "PHYSICS", "METAPHOR", "SCIENTIFIC", "VOXEL", "ASSEMBLER"]),
    entities: z.array(EntitySchema).optional(),
    voxels: z.array(VoxelSchema).optional(),
    joints: z.array(JointSchema).optional(),
    scientificParams: ScientificParamsSchema.optional(),
    constraints: z.array(z.string()),
    environment: EnvironmentSchema.optional(),
    successCondition: z.string(),
    description: z.string(),
    explanation: z.string(),
    python_code: z.string().optional().describe('Python code to execute for mathematical verification or plotting.'),
    python_result: z.string().optional().describe('The result of the python execution.'),
    custom_canvas_code: z.string().optional().describe('Dynamic HTML5 Canvas JS code for custom math visualizations.'),
    sabotage_reveal: z.string().optional(),
    societalImpact: z.string().optional(),
});

// --- Type Definitions (Exported for TypeScript Strictness) ---

export type Vector3 = z.infer<typeof Vector3Schema>;
export type Entity = z.infer<typeof EntitySchema>;
export type WorldState = z.infer<typeof WorldStateSchema>;
export type Constants = Record<string, number>;
export type VoxelData = z.infer<typeof VoxelSchema>;
export type ScientificParams = z.infer<typeof ScientificParamsSchema>;
export type Joint = z.infer<typeof JointSchema>;

// The "NodeData" Union Type requested for Strict Safety
export type NodeData = ScientificParams | VoxelData[] | WorldState;

export type Force = {
    id: string;
    type: 'gravity' | 'wind' | 'point_force' | 'heat_flux';
    vector: Vector3;
    magnitude: number;
    targetEntityId?: string;
};
