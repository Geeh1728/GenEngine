import { ecsWorld, ECSEntity, clearWorld, dynamicEntities, renderableEntities, jointEntities } from './world';
import { WorldState } from '@/lib/simulation/schema';
import { RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';

/**
 * ECS Systems: Data transformation pipelines for high-performance simulation.
 * 
 * These systems operate on raw data arrays instead of React components,
 * enabling 60fps performance with 1000+ entities.
 */

/**
 * SYSTEM: Sync From WorldState
 * 
 * Converts the AI-generated WorldState JSON into ECS entities.
 * This is the bridge between the AI pipeline and the physics engine.
 */
export function syncFromWorldState(worldState: WorldState): void {
    // Clear existing entities
    clearWorld();

    if (!worldState.entities || worldState.entities.length === 0) {
        return;
    }

    // Convert each schema entity to an ECS entity
    const globalConsensus = (worldState as any).consensus_score !== undefined ? (worldState as any).consensus_score / 100 : 1.0;

    for (const entity of worldState.entities) {
        // v60.0 GOLD: Epistemic Crystallization
        // Modulate individual certainty by the global consensus score
        const finalCertainty = (entity.certainty ?? 1.0) * globalConsensus;

        const ecsEntity: ECSEntity = {
            id: entity.id,
            position: { ...entity.position },
            rotation: entity.rotation ? { ...entity.rotation } : undefined,
            dimensions: entity.dimensions ? { ...entity.dimensions } : undefined,
            physics: {
                mass: entity.physics.mass,
                friction: entity.physics.friction,
                restitution: entity.physics.restitution,
                isStatic: entity.physics.isStatic || false,
                isRemote: entity.isRemote || false
            },
            visual: {
                color: entity.visual?.color || (entity as any).color || '#3b82f6',
                texture: entity.visual?.texture || entity.texturePrompt
            },
            certainty: finalCertainty,
            disagreementScore: entity.disagreementScore ?? 0,
            probabilitySnapshots: entity.probabilitySnapshots ? [...entity.probabilitySnapshots] : undefined,
            renderable: {
                shape: entity.shape,
                color: entity.visual?.color || (entity as any).color || '#3b82f6',
                shaderCode: entity.shaderCode,
                texturePrompt: entity.visual?.texture || entity.texturePrompt,
                analogyLabel: entity.analogyLabel,
                truthSource: entity.truthSource
            },
            selectable: {
                isSelected: false,
                name: entity.name
            },
            citation: entity.citation ? { ...entity.citation } : undefined,
            harmonic: entity.harmonic ? { ...entity.harmonic } : undefined,
            personality: entity.personality ? {
                ...entity.personality,
                timeDilation: entity.personality.timeDilation || 1.0,
                evolutionaryStatus: entity.personality.evolutionaryStatus || { blessed: 0, cursed: 0 }
            } : undefined,
            behavior: entity.behavior ? { ...entity.behavior } : undefined
        };

        ecsWorld.add(ecsEntity);
    }

    // Sync Joints
    if (worldState.joints) {
        for (const joint of worldState.joints) {
            const ecsEntity: ECSEntity = {
                id: joint.id,
                position: { x: 0, y: 0, z: 0 },
                visual: { color: 'transparent' },
                certainty: 1.0,
                renderable: { shape: 'box', color: 'transparent' },
                physics: { mass: 0, friction: 0, restitution: 0, isStatic: true },
                joint: { ...joint }
            };
            ecsWorld.add(ecsEntity);
        }
    }

    console.log(`[ECS] Synced ${worldState.entities.length} entities and ${worldState.joints?.length || 0} joints from WorldState.`);

    // Trigger Sentinel Stress Test
    runSentinelCheck();
}

/**
 * SYSTEM: Sentinel Structural Redline
 * 
 * Performs a "Zero-Second Stress Test" by analyzing mass-to-joint ratios.
 * Marks entities as 'unstable' (Red) if they are likely to fail.
 */
export function runSentinelCheck(): void {
    console.log("[Sentinel] Performing structural stress test...");

    for (const entity of renderableEntities) {
        const joints = ecsWorld.entities.filter(e => e.joint && (e.joint.bodyA === entity.id || e.joint.bodyB === entity.id));

        let stabilityScore = 100;

        if (joints.length > 0) {
            const hasFixed = joints.some(j => j.joint?.type === 'fixed');
            if (!hasFixed && entity.physics.mass > 5) {
                stabilityScore -= 40;
            }
        }

        entity.renderable.isUnstable = stabilityScore < 70;
    }
}

/**
 * SYSTEM: Chronesthesia (v29.0)
 * 
 * Adjusts local time dilation based on prediction drift.
 * Chaotic entities move in "Bullet Time".
 */
import { physicsEntities } from './world';

export function applyChronesthesia(): void {
    const vibe = blackboard.getContext().userVibe;
    const drift = vibe.intensity; // Simplified global drift from user agitation

    for (const entity of physicsEntities) {
        if (!entity.personality) continue;

        // If drift is high, increase time dilation (slow down)
        // Bullet Time Factor: 1.0 (Normal) to 0.1 (Slow)
        const targetDilation = 1.0 - (drift * 0.9);
        entity.personality.timeDilation = THREE.MathUtils.lerp(
            entity.personality.timeDilation || 1.0,
            targetDilation,
            0.1
        );

        // Apply to Rapier body if it supports it, or scale forces
        const rb = entity.rigidBodyRef?.ref;
        if (rb) {
            // We scale the damping to simulate time-dilation resistance
            const baseDamping = entity.personality.linearDamping || 0;
            const dilatedDamping = baseDamping + (drift * 5.0);
            rb.setLinearDamping(dilatedDamping);
        }
    }
}

/**
 * SYSTEM: Egregor Protocol (v29.0)
 * 
 * Detects large groups of synchronized entities and merges them.
 */
export function runEgregorCheck(): void {
    const entities = harmonicEntities.entities;
    const groups: Record<string, ECSEntity[]> = {};

    // Group by vibeGroup
    for (const e of entities) {
        if (!e.harmonic?.vibeGroup) continue;
        if (!groups[e.harmonic.vibeGroup]) groups[e.harmonic.vibeGroup] = [];
        groups[e.harmonic.vibeGroup].push(e);
    }

    for (const [vibeId, group] of Object.entries(groups)) {
        if (group.length < 5) continue;

        // Check Phase Sync (variance of phases)
        const phases = group.map(e => e.harmonic!.phase);
        const mean = phases.reduce((a, b) => a + b, 0) / phases.length;
        const variance = phases.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / phases.length;

        // If highly synchronized (low variance)
        if (variance < 0.05) {
            console.log(`[Egregor] VibeGroup ${vibeId} has achieved Transcendence!`);
            
            // Visual feedback: Make them glow gold
            for (const e of group) {
                e.renderable.color = '#fbbf24'; // Gold
                if (e.personality) e.personality.isEgregor = true;
                
                // Physically link them if not already
                // (Implementation: Use joints or attract to centroid)
            }
        }
    }
}

/**
 * SYSTEM: Evolutionary Selection (v29.0)
 * 
 * Maps User Focus and Vibe to evolutionary pressure.
 */
export function runEvolutionarySelection(focusedEntityId: string | null): void {
    if (!focusedEntityId) return;

    const entity = ecsWorld.entities.find(e => e.id === focusedEntityId);
    if (!entity || !entity.personality) return;

    const vibe = blackboard.getContext().userVibe;
    const status = entity.personality.evolutionaryStatus || { blessed: 0, cursed: 0 };

    // High Agitation = Cursed, Low Agitation = Blessed
    if (vibe.intensity > 0.7) {
        status.cursed += 0.01;
        entity.renderable.color = '#ef4444'; // Red-ish warning
    } else if (vibe.intensity < 0.3) {
        status.blessed += 0.01;
        entity.renderable.color = '#10b981'; // Green-ish blessing
    }

    entity.personality.evolutionaryStatus = status;

    // Mutation Logic: If highly blessed, increase scale or change shape
    if (status.blessed > 5.0) {
        if (entity.dimensions) {
            entity.dimensions.x *= 1.01;
            entity.dimensions.y *= 1.01;
            entity.dimensions.z *= 1.01;
            status.blessed = 0; // Reset after mutation
            console.log(`[Evolution] Entity ${entity.id} grew from your focus!`);
        }
    }
}

/**
 * SYSTEM: Sync To Rapier
 * 
 * Updates Rapier physics bodies from ECS position data.
 * Called before physics step when external forces modify positions.
 */
export function syncToRapier(): void {
    for (const entity of dynamicEntities) {
        if (entity.rigidBodyRef?.ref) {
            const rb = entity.rigidBodyRef.ref;

            // AUTHORITY LOGIC: Remote entities are Kinematic and teleported to network position
            if (entity.physics.isRemote) {
                if (rb.bodyType() !== 3) rb.setBodyType(3, true);

                rb.setNextKinematicTranslation({ x: entity.position.x, y: entity.position.y, z: entity.position.z });
                if (entity.rotation && entity.rotation.w !== undefined) {
                    rb.setNextKinematicRotation({ x: entity.rotation.x, y: entity.rotation.y, z: entity.rotation.z, w: entity.rotation.w });
                }
            } else if (!entity.physics.isStatic) {
                rb.setTranslation(
                    { x: entity.position.x, y: entity.position.y, z: entity.position.z },
                    true
                );
            }
        }
    }
}

/**
 * SYSTEM: Sync From Rapier
 * 
 * Reads Rapier physics positions back into ECS.
 * Called after physics step to update entity transforms.
 */
export function syncFromRapier(): void {
    for (const entity of dynamicEntities) {
        if (entity.rigidBodyRef?.ref && !entity.physics.isStatic && !entity.physics.isRemote) {
            const rb = entity.rigidBodyRef.ref;
            
            // Sync Position
            const pos = rb.translation();
            entity.position.x = pos.x;
            entity.position.y = pos.y;
            entity.position.z = pos.z;

            // Sync Rotation
            const rot = rb.rotation();
            if (entity.rotation) {
                entity.rotation.x = rot.x;
                entity.rotation.y = rot.y;
                entity.rotation.z = rot.z;
                entity.rotation.w = rot.w;
            }

            // Sync Velocity
            const vel = rb.linvel();
            entity.physics.velocity = { x: vel.x, y: vel.y, z: vel.z };
        }
    }
}

/**
 * SYSTEM: Register Rigid Body
 * 
 * Associates a Rapier RigidBody with an ECS entity.
 */
export function registerRigidBody(entityId: string, rb: RapierRigidBody | null): void {
    const entity = ecsWorld.entities.find(e => e.id === entityId);
    if (entity) {
        entity.rigidBodyRef = { ref: rb };
    }
}

/**
 * SYSTEM: Select Entity
 */
export function selectEntity(entityId: string): void {
    for (const entity of ecsWorld.entities) {
        if (entity.selectable) {
            entity.selectable.isSelected = false;
        }
    }

    const entity = ecsWorld.entities.find(e => e.id === entityId);
    if (entity?.selectable) {
        entity.selectable.isSelected = true;
    }
}

/**
 * SYSTEM: Deselect All
 */
export function deselectAll(): void {
    for (const entity of ecsWorld.entities) {
        if (entity.selectable) {
            entity.selectable.isSelected = false;
        }
    }
}

/**
 * SYSTEM: Get Renderable Transforms
 */
export interface RenderTransform {
    id: string;
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
    color: string;
    shape: string;
    isSelected: boolean;
    isUnstable?: boolean;
    stress_intensity?: number;
    shaderCode?: string;
    drift?: number;
}

/**
 * SYSTEM: Harmonic Sync (v28.0)
 * 
 * Synchronizes the phases of nearby entities in the same vibeGroup.
 * Results in coordinated "visual heartbeats".
 */
import { harmonicEntities } from './world';

export function runHarmonicSync(dt: number): void {
    /*
     # Project Genesis v28.0 - The Soul Update & Synthetic Life

    ## Tasks
    - [x] Refine `breedEntities` with Behavioral Genetics
    - [x] Track 1: Emotional Inference Engine (Intention Monitor)
    - [x] Track 2: Bio-Physical Softbodies (Pressure & Volume)
    - [x] Track 3: Harmonic Choral Physics (ECS System)
    - [x] Track 4: Personality Tails (Dynamic Ghost Shaders)
    - [ ] Final Verification & "Living Lab" Report
    */
    const entities = harmonicEntities.entities;
    if (entities.length < 2) return;

    for (let i = 0; i < entities.length; i++) {
        const a = entities[i];
        if (!a.harmonic) continue;

        // Update phase based on frequency
        a.harmonic.phase += a.harmonic.frequency * dt;

        // Pull toward neighbors with same vibeGroup
        for (let j = i + 1; j < entities.length; j++) {
            const b = entities[j];
            if (!b.harmonic || a.harmonic.vibeGroup !== b.harmonic.vibeGroup) continue;

            const dx = a.position.x - b.position.x;
            const dy = a.position.y - b.position.y;
            const dz = a.position.z - b.position.z;
            const distSq = dx * dx + dy * dy + dz * dz;

            if (distSq < 25) { // 5 unit radius
                // Kuramoto-esque coupling
                const diff = b.harmonic.phase - a.harmonic.phase;
                const coupling = Math.sin(diff) * 0.1;

                a.harmonic.phase += coupling;
                b.harmonic.phase -= coupling;
            }
        }

        // Wrap phase
        a.harmonic.phase %= Math.PI * 2;
    }
}

import { blackboard } from '@/lib/genkit/context';

export function getRenderTransforms(): RenderTransform[] {
    const transforms: RenderTransform[] = [];
    const dummyEuler = new THREE.Euler();
    const dummyQuat = new THREE.Quaternion();
    const vibe = blackboard.getContext().userVibe;

    for (const entity of renderableEntities) {
        if (entity.isHidden) continue;

        let rot: [number, number, number] = [0, 0, 0];

        if (entity.rotation) {
            if (entity.rotation.w !== undefined) {
                dummyQuat.set(entity.rotation.x, entity.rotation.y, entity.rotation.z, entity.rotation.w);
                dummyEuler.setFromQuaternion(dummyQuat);
                rot = [dummyEuler.x, dummyEuler.y, dummyEuler.z];
            } else {
                rot = [entity.rotation.x, entity.rotation.y, entity.rotation.z];
            }
        }

        // MODULE S: Map mass to stress for now, or use real-time stress from worker
        const stress = entity.stress_intensity !== undefined 
            ? entity.stress_intensity 
            : (entity.physics.mass > 50 ? 0.8 : (entity.renderable.isUnstable ? 0.5 : 0.0));

        transforms.push({
            id: entity.id,
            position: [entity.position.x, entity.position.y, entity.position.z],
            rotation: rot,
            scale: entity.dimensions
                ? [entity.dimensions.x, entity.dimensions.y, entity.dimensions.z]
                : [1, 1, 1],
            color: entity.renderable.color,
            shape: entity.renderable.shape,
            isSelected: entity.selectable?.isSelected || false,
            isUnstable: entity.renderable.isUnstable,
            stress_intensity: stress,
            shaderCode: entity.renderable.shaderCode,
            drift: vibe.intensity
        });
    }

    return transforms;
}

