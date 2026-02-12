import * as THREE from 'three';
import { v4 as uuidv4 } from 'uuid';
import { getPhysicsForMaterial } from './material-library';
import { Entity } from './schema';
import { getNeuralSignature, storeNeuralSignature } from '../db/pglite';

export interface IUniversalEntity extends Entity {
    // Inherits everything from Entity schema
}

interface RawEntity {
    id?: string;
    name?: string;
    concept?: string;
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
    certainty?: number;
    isUnstable?: boolean;
    isGhost?: boolean;
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
export async function normalizeEntities(rawEntities: RawEntity[]): Promise<Entity[]> {
    if (!Array.isArray(rawEntities)) return [];

    const entities: Entity[] = [];

    for (const raw of rawEntities) {
        // 1. ID Normalization
        const id = raw.id || uuidv4();

        // 2. NEURAL MAP CHECK (v31.0 - The Registry of Truth)
        const name = raw.name || (raw as any).label || 'Entity';
        const signature = (raw as any).concept || name;
        const cachedDna = await getNeuralSignature(signature);

        // v60.0 HARMONIC REALITY SYNTHESIS (The Merge)
        // If entity is remote and relies on a specific law, check against local Canon.
        let isDissonant = false;
        if (raw.isRemote && raw.neuralPhysics) {
             // Heuristic: If remote law differs significantly from standard physics, flag it.
             // Real implementation would check 'global_axioms'.
             if (raw.neuralPhysics.elasticity && raw.neuralPhysics.elasticity > 2.0) {
                 // "Super-Bounce" law detected.
                 isDissonant = true; 
             }
        }

        if (cachedDna) {
            console.log(`[NeuralMap] Cache Hit for: ${signature}`);
            entities.push({
                ...cachedDna,
                id,
                position: raw.position || raw.pos || cachedDna.position
            });
            continue;
        }

        // 3. Shape Normalization & Universal Translator (Concept -> Shape)
        let shapeStr = (raw.type || raw.shape || 'box').toLowerCase();

        // UNIVERSAL TRANSLATOR LOGIC (v25.0)
        // Map abstract concepts to physics shapes/properties
        const concept = (raw.concept || raw.analogyLabel || '').toLowerCase();

        if (concept.includes('accumulation') || concept.includes('resource') || concept.includes('money') || concept.includes('traffic')) {
            shapeStr = 'fluid';
        }
        else if (concept.includes('connection') || concept.includes('dependency')) {
            // If an entity is a "connection", we map it to a thin cylinder (visual rope)
            // The Physics Engine should ideally treat this as a Constraint, but as an Entity, it's a visual link.
            shapeStr = 'cylinder';
        }

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

        // 5. Physics Normalization & Universal Translator (Concept -> Physics)
        const phys = raw.physics || {};

        // Default Logic
        let weightMass = Number(phys.mass ?? raw.mass ?? raw.weight ?? (materialPhysics?.density ? (materialPhysics.density / 1000) : 1));
        let surfRestitution = Number(phys.restitution ?? raw.restitution ?? raw.bounciness ?? materialPhysics?.restitution ?? 0.2);
        let surfFriction = Number(phys.friction ?? raw.friction ?? materialPhysics?.friction ?? 0.5);
        let staticState = Boolean(phys.isStatic ?? raw.isStatic ?? false);

        // TRANSLATOR: Conflict/Opposite -> High Restitution (Bounce)
        if (concept.includes('conflict') || concept.includes('opposite') || concept.includes('clash')) {
            surfRestitution = Math.max(surfRestitution, 0.9);
        }

        // TRANSLATOR: Foundation/Basis -> Static
        if (concept.includes('foundation') || concept.includes('basis') || concept.includes('ground')) {
            staticState = true;
        }

        // --- MODULE P: PERSONALITY PHYSICS (v26.0) ---
        let linearDamping = 0.0;
        let isNervous = false;

        if (concept.includes('happy') || concept.includes('energetic') || concept.includes('excited')) {
            surfRestitution = 1.2; // Gain energy on bounce
            linearDamping = 0.05;  // Low drag
        } else if (concept.includes('depressed') || concept.includes('heavy') || concept.includes('sad')) {
            surfRestitution = 0.0; // No bounce
            linearDamping = 5.0;   // Move through molasses
            weightMass *= 2.0;     // Feels heavier
        } else if (concept.includes('nervous') || concept.includes('anxious') || concept.includes('jittery')) {
            isNervous = true;
            surfRestitution = 0.8;
            linearDamping = 0.1;
        } else if (concept.includes('lazy') || concept.includes('relaxed') || concept.includes('chill')) {
            surfRestitution = 0.2;
            linearDamping = 2.0;
        }

        // --- MODULE P: SOFTBODY AUTO-DETECTION (v27.0) ---
        let isSoftBody = false;
        let pressure = 0.5;

        const softKeywords = ['flesh', 'tissue', 'muscle', 'organism', 'rubber', 'gel', 'fluid', 'cloth', 'membrane'];
        if (softKeywords.some(k => concept.includes(k)) || raw.shape === 'softbody' || raw.shape === 'fluid') {
            isSoftBody = true;
            pressure = concept.includes('tense') || concept.includes('hard') ? 0.9 : 0.3;
        }

        // --- ROSETTA FAIL-SAFE (v25.0) ---
        // Ensure numbers are valid and within reasonable bounds to prevent NaN crashes
        const mass = (isNaN(weightMass) || weightMass <= 0) ? 1.0 : weightMass;
        const friction = (isNaN(surfFriction) || surfFriction < 0) ? 0.5 : Math.min(surfFriction, 1.0);
        const restitution = (isNaN(surfRestitution) || surfRestitution < 0) ? 0.2 : Math.min(surfRestitution, 1.0);
        const isStatic = staticState;

        // 7. Dimensions (for box/cylinder)
        const dims = raw.dimensions || raw.scale || { x: 1, y: 1, z: 1 };
        const dimensions = {
            x: Number(dims.x || 1),
            y: Number(dims.y || 1),
            z: Number(dims.z || 1)
        };

        // TRANSLATOR: Connection -> Thin Cylinder
        if (concept.includes('connection') || concept.includes('dependency')) {
            if (dims && dims.x !== undefined && dims.z !== undefined && dims.x > 0.2 && dims.z > 0.2) {
                dimensions.x = 0.1;
                dimensions.z = 0.1; // Make it rope-like
            }
        }
        // --- MODULE C: COGNITIVE TEXTURE (v30.0) ---
        const certainty = Number(raw.certainty ?? 1.0);
        
        // Map truthSource to physics presets
        if (raw.truthSource === 'GROUNDED') {
            // "Polished Glass" - High reliability
            surfFriction = Math.min(surfFriction, 0.1);
            surfRestitution = Math.max(surfRestitution, 0.9);
        } else if (raw.truthSource === 'METAPHOR') {
            // "Viscous Mud" - Speculative
            linearDamping += 2.0;
            surfFriction = Math.max(surfFriction, 0.8);
        } else if (raw.truthSource === 'CALCULATED') {
            // "Active/Zing" - Derived
            surfFriction = 0.2;
        }

        // Apply certainty degradation: Lower certainty = more 'slimy' or 'jittery'
        if (certainty < 0.5) {
            surfFriction += (0.5 - certainty);
            linearDamping += 1.0;
        }

        // v60.0 HARMONIC DISSOLVE
        // If axioms conflict, the object vibrates intensely (Shatter Warning)
        if (isDissonant) {
            // Apply high-frequency noise shader
            raw.shaderCode = `
                uniform float uTime;
                void main() {
                    vec3 pos = position + normal * sin(uTime * 50.0) * 0.1;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `;
            // Red warning color
            color = '#ff0000';
        }

        const entity: Entity = {
            id,
            shape,
            position,
            rotation,
            physics: {
                mass,
                friction: surfFriction,
                restitution: surfRestitution,
                isStatic
            },
            visual: {
                color,
                texture
            },
            certainty,
            dimensions,
            isRemote: raw.isRemote,
            isUnstable: raw.isUnstable,
            isGhost: raw.isGhost,
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
            shaderCode: raw.shaderCode,
            // MODULE P: personality traits
            personality: {
                linearDamping,
                isNervous,
                isSoftBody,
                pressure,
                timeDilation: (raw as any).personality?.timeDilation || 1.0
            },
            // --- MODULE B: BEHAVIORAL PRIMITIVES (v27.0) ---
            behavior: (raw as any).behavior || (
                concept.includes('afraid') || concept.includes('fear') || concept.includes('scared') ? { type: 'REPULSE', strength: 2.0, radius: 10.0 } :
                    concept.includes('attracted') || concept.includes('love') || concept.includes('hungry') ? { type: 'ATTRACT', strength: 1.5, radius: 10.0 } :
                        concept.includes('protect') || concept.includes('guard') || concept.includes('orbit') ? { type: 'VORTEX', strength: 1.0, radius: 10.0 } :
                            concept.includes('explore') || concept.includes('lost') || concept.includes('wander') ? { type: 'WANDER', strength: 0.5, radius: 5.0 } :
                                undefined
            )
        };

        // 8. PERSIST TO NEURAL MAP
        if (raw.truthSource === 'GROUNDED') {
            await storeNeuralSignature(signature, entity, true);
        }

        entities.push(entity);
    }

    return entities;
}

/**
 * THE GENETIC FORGE (v28.0 - Synthetic Life)
 * Objective: Breed two entities to create a hybrid child.
 */
export function breedEntities(entityA: Entity, entityB: Entity): Entity {
    const id = `hybrid-${uuidv4().substring(0, 8)}`;

    // Physics Interleaving (Average)
    const mass = (entityA.physics.mass + entityB.physics.mass) / 2;
    const friction = (entityA.physics.friction + entityB.physics.friction) / 2;
    const restitution = (entityA.physics.restitution + entityB.physics.restitution) / 2;
    const isStatic = entityA.physics.isStatic || entityB.physics.isStatic;

    // Visual Mixing (Color Lerp)
    const colorA = new THREE.Color(entityA.visual?.color || '#ffffff');
    const colorB = new THREE.Color(entityB.visual?.color || '#ffffff');
    const mixedColor = colorA.lerp(colorB, 0.5).getStyle();

    // Logic Merging (Frequency Map)
    const mapA = entityA.frequency_map || [];
    const mapB = entityB.frequency_map || [];
    const mergedMap = [...mapA];

    // Add unique triggers from B
    mapB.forEach(itemB => {
        if (!mergedMap.some(itemA => itemA.trigger === itemB.trigger)) {
            mergedMap.push(itemB);
        }
    });

    // --- MODULE B: BEHAVIORAL GENETICS (v28.0) ---
    let behavior: Entity['behavior'] = undefined;
    if (entityA.behavior || entityB.behavior) {
        const behA = entityA.behavior;
        const behB = entityB.behavior;

        // If types match, average the strength/radius
        if (behA?.type === behB?.type) {
            behavior = {
                type: behA?.type,
                strength: ((behA?.strength || 1) + (behB?.strength || 1)) / 2,
                radius: ((behA?.radius || 10) + (behB?.radius || 10)) / 2,
                targetId: behA?.targetId || behB?.targetId
            };
        } else if (behA && behB) {
            // HYBRID CONFLICT: Map conflicting types to new states
            // Attract + Repulse = Ambivalence (Vortex)
            if ((behA.type === 'ATTRACT' && behB.type === 'REPULSE') || (behA.type === 'REPULSE' && behB.type === 'ATTRACT')) {
                behavior = {
                    type: 'VORTEX',
                    strength: (behA.strength + behB.strength) / 2,
                    radius: (behA.radius + behB.radius) / 2,
                    targetId: behA.targetId || behB.targetId
                };
            } else {
                // Default to a 50/50 coin flip for type
                const dominant = Math.random() > 0.5 ? behA : behB;
                behavior = { ...dominant };
            }
        } else {
            // Single parent trait with mutation
            const parent = behA || behB;
            behavior = {
                ...parent!,
                strength: parent!.strength * (0.8 + Math.random() * 0.4), // 20% variance
            };
        }
    }

    return {
        ...entityA, // Inherit base from A
        id,
        name: `Hybrid ${entityA.name || 'A'} x ${entityB.name || 'B'}`,
        behavior, // Inject hybrid behavior
        physics: {
            mass,
            friction,
            restitution,
            isStatic
        },
        visual: {
            color: mixedColor,
            texture: entityA.visual?.texture || entityB.visual?.texture
        },
        frequency_map: mergedMap.length > 0 ? mergedMap : undefined,
        position: {
            x: (entityA.position.x + entityB.position.x) / 2,
            y: (entityA.position.y + entityB.position.y) / 2 + 1, // Pop up slightly
            z: (entityA.position.z + entityB.position.z) / 2
        }
    };
}
