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
    for (const entity of worldState.entities) {
        const ecsEntity: ECSEntity = {
            id: entity.id,
            position: {
                x: entity.position.x,
                y: entity.position.y,
                z: entity.position.z
            },
            rotation: entity.rotation ? {
                x: entity.rotation.x,
                y: entity.rotation.y,
                z: entity.rotation.z,
                w: entity.rotation.w
            } : undefined,
            dimensions: entity.dimensions ? {
                x: entity.dimensions.x,
                y: entity.dimensions.y,
                z: entity.dimensions.z
            } : undefined,
            physics: {
                mass: entity.physics.mass,
                friction: entity.physics.friction,
                restitution: entity.physics.restitution,
                isStatic: entity.physics.isStatic || false,
                isRemote: entity.isRemote || false
            },
            renderable: {
                shape: entity.shape,
                color: entity.visual.color,
                shaderCode: entity.shaderCode,
                texturePrompt: entity.visual.texture,
                analogyLabel: entity.analogyLabel,
                truthSource: entity.truthSource
            },
            selectable: {
                isSelected: false,
                name: entity.name
            },
            citation: entity.citation ? {
                source: entity.citation.source,
                snippet: entity.citation.snippet,
                url: entity.citation.url
            } : undefined
        };

        ecsWorld.add(ecsEntity);
    }

    // Sync Joints
    if (worldState.joints) {
        for (const joint of worldState.joints) {
            const ecsEntity: ECSEntity = {
                id: joint.id,
                position: { x: 0, y: 0, z: 0 },
                renderable: { shape: 'box', color: 'transparent' },
                physics: { mass: 0, friction: 0, restitution: 0, isStatic: true },
                joint: {
                    type: joint.type as 'fixed' | 'spherical' | 'revolute' | 'prismatic',
                    bodyA: joint.bodyA,
                    bodyB: joint.bodyB,
                    anchorA: joint.anchorA,
                    anchorB: joint.anchorB
                }
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
            const pos = rb.translation();
            entity.position.x = pos.x;
            entity.position.y = pos.y;
            entity.position.z = pos.z;

            const rot = rb.rotation();
            if (entity.rotation) {
                entity.rotation.x = rot.x;
                entity.rotation.y = rot.y;
                entity.rotation.z = rot.z;
                entity.rotation.w = rot.w;
            }
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
}

export function getRenderTransforms(): RenderTransform[] {
    const transforms: RenderTransform[] = [];
    const dummyEuler = new THREE.Euler();
    const dummyQuat = new THREE.Quaternion();

    for (const entity of renderableEntities) {
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

        // MODULE S: Map mass to stress for now
        const stress = entity.physics.mass > 50 ? 0.8 : (entity.renderable.isUnstable ? 0.5 : 0.0);

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
            shaderCode: entity.renderable.shaderCode
        });
    }

    return transforms;
}

