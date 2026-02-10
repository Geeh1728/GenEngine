import { z } from 'zod';

/**
 * CRITICAL FIX FOR GEMINI API: 
 * We must avoid reusing schemas (like Vector3Schema) directly in multiple places,
 * as Zod-to-JSON-Schema will generate "$ref" pointers which Gemini 2.5 does not support.
 * We manually inline or use factory functions to keep the schema "Flat" from a reference perspective.
 */

// --- Atomic Schemas (Exported for Reusability) ---

export const Vector3Schema = z.object({ x: z.number(), y: z.number(), z: z.number() });
export const QuaternionSchema = z.object({ x: z.number(), y: z.number(), z: z.number(), w: z.number() });

export const EntitySchema = z.object({
    id: z.string().describe('Unique identifier for the entity'),
    // Universal Entity Standard: 'shape' instead of 'type'
    shape: z.enum(['cube', 'box', 'sphere', 'cylinder', 'plane', 'fluid', 'softbody']).describe('Primary physical shape'),
    // Legacy support for 'type' (Mapped by Normalizer, but kept for Schema validation if AI slips up)
    type: z.string().optional().describe('Alias for shape (legacy)'),

    name: z.string().optional().describe('Display name of the object'),
    physics: z.object({
        mass: z.number().min(0).describe('Mass in kg'),
        friction: z.number().min(0).max(1).describe('Surface friction'),
        restitution: z.number().min(0).max(1).describe('Bounciness factor'),
        isStatic: z.boolean().optional().describe('If true, object is unmoveable'),
    }),
    position: z.object({ x: z.number(), y: z.number(), z: z.number() }).default({ x: 0, y: 0, z: 0 }),
    // Universal Entity Standard: Quaternion Rotation
    rotation: z.object({ x: z.number(), y: z.number(), z: z.number(), w: z.number() }).optional().default({ x: 0, y: 0, z: 0, w: 1 }),
    dimensions: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),

    // Universal Entity Standard: Visual Object
    visual: z.object({
        color: z.string().default('#3b82f6').describe('Hex or CSS color'),
        texture: z.string().optional().describe('Text description for procedural texture generation'),
    }).default({ color: '#3b82f6' }),

    // Legacy flat fields (Mapped by Normalizer)
    color: z.string().optional(),
    texturePrompt: z.string().optional(),
    isRemote: z.boolean().optional().describe('Flag if the entity is owned by another peer.'),
    isUnstable: z.boolean().optional().describe('Flag if the entity is structuraly unstable.'),
    isControllable: z.boolean().optional().describe('Flag if Astra can operate this entity via SIMA.'),

    analogyLabel: z.string().optional().describe('A label explaining what this object represents in a metaphor'),
    truthSource: z.enum(['GROUNDED', 'CALCULATED', 'METAPHOR']).optional().describe('The origin of this entity logic'),
    frequency_map: z.array(z.object({
        trigger: z.string().describe('The physical state or coordinate (e.g., "fret_3", "impact")'),
        note: z.string().describe('The musical note (e.g., "G4", "C2")')
    })).optional().describe('Maps physical states to musical notes.'),
    neuralPhysics: z.object({
        elasticity: z.number().optional(),
        fracturePoint: z.number().optional(),
        thermalConductivity: z.number().optional(),
    }).optional().describe('Neural physics guesses from MLLM-P3'),
    shaderCode: z.string().optional().describe('Custom GLSL fragment shader code for this entity.'),
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
    bodyA: z.string().describe('ID of the parent entity'),
    bodyB: z.string().describe('ID of the child entity'),
    anchorA: z.object({ x: z.number(), y: z.number(), z: z.number() }),
    anchorB: z.object({ x: z.number(), y: z.number(), z: z.number() }),
});

export const ScientificParamsSchema = z.object({
    l1: z.number().optional(),
    l2: z.number().optional(),
    m1: z.number().optional(),
    m2: z.number().optional(),
    g: z.number().optional(),
    initialState: z.array(z.number()).optional(),
    substance: z.string().optional(),
    boilingPoint: z.number().optional(),
    meltingPoint: z.number().optional(),
    liquidColor: z.string().optional(),
    gasColor: z.string().optional(),
    initialTemp: z.number().optional(),
});

export const EnvironmentSchema = z.object({
    gravity: z.object({ x: z.number(), y: z.number(), z: z.number() }),
    timeScale: z.number().default(1),
    biome: z.enum(['SPACE', 'EARTH', 'OCEAN', 'FACTORY', 'JUPITER']).optional().describe('The environmental preset'),
});

// --- WorldState Schema: The complete snapshot of a simulation frame ---

export const WorldStateSchema = z.object({
    scenario: z.string().min(10).describe('Name of the simulation'),
    mode: z.enum(["IDLE", "PHYSICS", "METAPHOR", "SCIENTIFIC", "VOXEL", "ASSEMBLER"]).describe('Active simulation engine'),
    domain: z.enum(["SCIENCE", "HISTORY", "MUSIC", "TRADE", "ABSTRACT"]).default("SCIENCE").describe('The semantic domain of the reality'),
    entities: z.array(EntitySchema).optional(),
    voxels: z.array(VoxelSchema).optional(),
    joints: z.array(JointSchema).optional(),
    scientificParams: ScientificParamsSchema.optional(),
    constraints: z.array(z.string()).describe('Physical constraints for verification'),
    environment: EnvironmentSchema.optional(),
    successCondition: z.string().describe('Target outcome for mastery'),
    description: z.string().describe('Brief visual overview'),
    explanation: z.string().describe('Deep dive into the underlying physics'),
    python_code: z.string().optional().describe('Python code for mathematical verification.'),
    python_result: z.string().optional().describe('The result of the python execution.'),
    custom_canvas_code: z.string().optional().describe('Dynamic HTML5 Canvas JS code for custom visualizations.'),
    sabotage_reveal: z.string().optional().describe('Hidden flaw or error revealed by the Saboteur'),
    societalImpact: z.string().optional().describe('Macro-scale implications of this physical concept'),
    _computedTrajectories: z.array(z.object({
        id: z.string(),
        path: z.array(z.object({ x: z.number(), y: z.number(), z: z.number() }))
    })).optional(),
});

// --- Type Definitions (Exported for TypeScript Strictness) ---

export type Vector3 = z.infer<typeof Vector3Schema>;
export type Quaternion = z.infer<typeof QuaternionSchema>;
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