import * as THREE from 'three';
import { v4 as uuidv4 } from 'uuid';
import { getPhysicsForMaterial } from './material-library';
import { Entity } from './schema';

export interface IUniversalEntity extends Entity {
    // Inherits everything from Entity schema
}

interface RawEntity {
    id?: string;
    type?: string;
    shape?: string;
    position?: { x?: number; y?: number; z?: number };
    pos?: { x?: number; y?: number; z?: number };
    rotation?: { x?: number; y?: number; z?: number; w?: number };
    rot?: { x?: number; y?: number; z?: number; w?: number };
    physics?: {
        mass?: number;
        friction?: number;
        restitution?: number;
        isStatic?: boolean;
    };
    mass?: number;
    weight?: number;
    friction?: number;
    restitution?: number;
    bounciness?: number;
    isStatic?: boolean;
    visual?: {
        color?: string;
        texture?: string;
    };
    color?: string;
    texture?: string;
    texturePrompt?: string;
    material?: string;
    properties?: {
        material?: string;
    };
    dimensions?: { x?: number; y?: number; z?: number };
    scale?: { x?: number; y?: number; z?: number };
    isRemote?: boolean;
    isUnstable?: boolean;
    isControllable?: boolean;
    analogyLabel?: string;
    frequency_map?: Array<{ trigger: string, note: string }>;
    truthSource?: 'GROUNDED' | 'CALCULATED' | 'METAPHOR';
    neuralPhysics?: {
        elasticity_range?: number[];
        elasticity?: number;
        fracture_point?: number;
        fracturePoint?: number;
        thermal_conductivity?: number;
        thermalConductivity?: number;
    };
    shaderCode?: string;
}

/**
 * THE ROSETTA NORMALIZER
 * Objective: Force all AI agents (Liquid, Molmo, Gemini) to speak the same language.
 * Maps aliases (weight -> mass, cube -> box) and ensures Quaternions.
 */
export function normalizeEntities(rawEntities: RawEntity[]): Entity[] {
    if (!Array.isArray(rawEntities)) return [];

    return rawEntities.map(raw => {
        // 1. ID Normalization
        const id = raw.id || uuidv4();

        // 2. Shape Normalization
        let shapeStr = (raw.type || raw.shape || 'box').toLowerCase();
        if (shapeStr === 'cube') shapeStr = 'box';
        if (shapeStr === 'floor') shapeStr = 'plane';

        type ValidShape = 'cube' | 'box' | 'sphere' | 'cylinder' | 'plane' | 'fluid' | 'softbody';
        const validShapes: ValidShape[] = ['cube', 'box', 'sphere', 'cylinder', 'plane', 'fluid', 'softbody'];
        const shape = (validShapes.includes(shapeStr as ValidShape) ? shapeStr : 'box') as ValidShape;

        // 3. Position Normalization
        const pos = raw.position || raw.pos || { x: 0, y: 0, z: 0 };
        const position = {
            x: Number(pos.x || 0),
            y: Number(pos.y || 0),
            z: Number(pos.z || 0)
        };

        // 4. Rotation Normalization (Euler -> Quaternion)
        const rot = raw.rotation || raw.rot || { x: 0, y: 0, z: 0 };
        const quaternion = new THREE.Quaternion();

        // If raw has w, assume it's already a quaternion
        if (typeof rot.w === 'number') {
            quaternion.set(rot.x || 0, rot.y || 0, rot.z || 0, rot.w);
        } else {
            const euler = new THREE.Euler(
                Number(rot.x || 0),
                Number(rot.y || 0),
                Number(rot.z || 0)
            );
            quaternion.setFromEuler(euler);
        }

        const rotation = {
            x: quaternion.x,
            y: quaternion.y,
            z: quaternion.z,
            w: quaternion.w
        };

        // 6. Visual Normalization
        const material = raw.material || raw.properties?.material;
        const color = raw.color || raw.visual?.color || '#3b82f6'; // Default Blue
        const texture = raw.texture || raw.visual?.texture || raw.texturePrompt;

        // Apply Physical LUT if material is detected
        const materialPhysics = getPhysicsForMaterial(material);

        // 5. Physics Normalization
        const phys = raw.physics || {};
        const mass = Number(phys.mass ?? raw.mass ?? raw.weight ?? (materialPhysics?.density ? (materialPhysics.density / 1000) : 1));
        const friction = Number(phys.friction ?? raw.friction ?? materialPhysics?.friction ?? 0.5);
        const restitution = Number(phys.restitution ?? raw.restitution ?? raw.bounciness ?? materialPhysics?.restitution ?? 0.2);
        const isStatic = Boolean(phys.isStatic ?? raw.isStatic ?? false);

        // 7. Dimensions (for box/cylinder)
        const dims = raw.dimensions || raw.scale || { x: 1, y: 1, z: 1 };
        const dimensions = {
            x: Number(dims.x || 1),
            y: Number(dims.y || 1),
            z: Number(dims.z || 1)
        };

        return {
            id,
            shape,
            position,
            rotation,
            physics: {
                mass,
                friction,
                restitution,
                isStatic
            },
            visual: {
                color,
                texture
            },
            dimensions,
            isRemote: raw.isRemote,
            isUnstable: raw.isUnstable,
            isControllable: raw.isControllable,
            analogyLabel: raw.analogyLabel,
            frequency_map: raw.frequency_map,
            truthSource: raw.truthSource,
            neuralPhysics: raw.neuralPhysics ? {
                elasticity: (raw.neuralPhysics.elasticity_range && raw.neuralPhysics.elasticity_range.length >= 2) 
                    ? (raw.neuralPhysics.elasticity_range[0] + raw.neuralPhysics.elasticity_range[1]) / 2 
                    : raw.neuralPhysics.elasticity,
                fracturePoint: raw.neuralPhysics.fracture_point || raw.neuralPhysics.fracturePoint,
                thermalConductivity: raw.neuralPhysics.thermal_conductivity || raw.neuralPhysics.thermalConductivity
            } : undefined,
            shaderCode: raw.shaderCode
        };
    });
}

