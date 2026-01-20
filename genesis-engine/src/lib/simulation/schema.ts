import { z } from 'zod';

/**
 * CRITICAL FIX FOR GEMINI API: 
 * We must avoid reusing schemas (like Vector3Schema) directly in multiple places,
 * as Zod-to-JSON-Schema will generate "$ref" pointers which Gemini 2.5 does not support.
 * We manually inline or use factory functions to keep the schema "Flat" from a reference perspective.
 */

// Entity Schema: Material objects in the simulation
export const EntitySchema = z.object({
    id: z.string(),
    type: z.enum(['cube', 'box', 'sphere', 'cylinder', 'plane', 'fluid', 'softbody']),
    name: z.string().optional(),
    physics: z.object({
        mass: z.number().min(0),
        friction: z.number().min(0).max(1),
        restitution: z.number().min(0).max(1),
    }),
    position: z.object({ x: z.number(), y: z.number(), z: z.number() }).default({ x: 0, y: 0, z: 0 }),
    rotation: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional().default({ x: 0, y: 0, z: 0 }),
    dimensions: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
    color: z.string().optional(),
    texturePrompt: z.string().optional(),
    isStatic: z.boolean().optional(),
    analogyLabel: z.string().optional(),
});

// WorldState Schema: The complete snapshot of a simulation frame
export const WorldStateSchema = z.object({
    scenario: z.string().min(10),
    mode: z.enum(["PHYSICS", "METAPHOR", "SCIENTIFIC", "VOXEL"]),
    entities: z.array(z.object({
        id: z.string(),
        type: z.enum(['cube', 'box', 'sphere', 'cylinder', 'plane', 'fluid', 'softbody']),
        name: z.string().optional(),
        physics: z.object({
            mass: z.number(),
            friction: z.number(),
            restitution: z.number(),
        }),
        position: z.object({ x: z.number(), y: z.number(), z: z.number() }),
        rotation: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional().default({ x: 0, y: 0, z: 0 }),
        dimensions: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
        color: z.string().optional(),
        texturePrompt: z.string().optional(),
        isStatic: z.boolean().optional(),
        analogyLabel: z.string().optional(),
    })).optional(),
    voxels: z.array(z.object({
        x: z.number(),
        y: z.number(),
        z: z.number(),
        color: z.string(),
    })).optional(),
    joints: z.array(z.object({
        id: z.string(),
        type: z.enum(['fixed', 'spherical', 'revolute', 'prismatic']),
        bodyA: z.string(),
        bodyB: z.string(),
        anchorA: z.object({ x: z.number(), y: z.number(), z: z.number() }),
        anchorB: z.object({ x: z.number(), y: z.number(), z: z.number() }),
    })).optional(),
    scientificParams: z.object({
        l1: z.number().optional(),
        l2: z.number().optional(),
        m1: z.number().optional(),
        m2: z.number().optional(),
        g: z.number().optional(),
        initialState: z.array(z.number()).optional(),
    }).optional(),
    constraints: z.array(z.string()),
    environment: z.object({
        gravity: z.object({ x: z.number(), y: z.number(), z: z.number() }),
        timeScale: z.number().default(1),
    }).optional(),
    successCondition: z.string(),
    description: z.string(),
    explanation: z.string(),
    python_code: z.string().optional().describe('Python code to execute for mathematical verification or plotting.'),
    python_result: z.string().optional().describe('The result of the python execution.'),
    sabotage_reveal: z.string().optional(),
    societalImpact: z.string().optional(),
});

export type Vector3 = { x: number; y: number; z: number };
export type Entity = z.infer<typeof EntitySchema>;
export type WorldState = z.infer<typeof WorldStateSchema>;
export type Joint = {
    id: string;
    type: 'fixed' | 'spherical' | 'revolute' | 'prismatic';
    bodyA: string;
    bodyB: string;
    anchorA: Vector3;
    anchorB: Vector3;
};
export type Force = {
    id: string;
    type: 'gravity' | 'wind' | 'point_force' | 'heat_flux';
    vector: Vector3;
    magnitude: number;
    targetEntityId?: string;
};
