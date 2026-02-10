import { World } from 'miniplex';
import { RapierRigidBody } from '@react-three/rapier';

/**
 * ECS World Definition (Entity Component System)
 * 
 * Objective: Replace React component mapping with a high-performance
 * data-oriented architecture that can handle 1000+ entities at 60fps.
 */

// Component Types
export interface PositionComponent {
    x: number;
    y: number;
    z: number;
}

export interface RotationComponent {
    x: number;
    y: number;
    z: number;
    w?: number; // Added for Quaternion support
}

export interface DimensionsComponent {
    x: number;
    y: number;
    z: number;
}

export interface PhysicsComponent {
    mass: number;
    friction: number;
    restitution: number;
    isStatic: boolean;
    isRemote?: boolean;
}

export interface RenderableComponent {
    shape: 'cube' | 'box' | 'sphere' | 'cylinder' | 'plane' | 'fluid' | 'softbody';
    color: string;
    shaderCode?: string;
    texturePrompt?: string;
    analogyLabel?: string;
    truthSource?: 'GROUNDED' | 'CALCULATED' | 'METAPHOR';
    isUnstable?: boolean;
}

export interface RigidBodyRefComponent {
    ref: RapierRigidBody | null;
}

export interface SelectableComponent {
    isSelected: boolean;
    name?: string;
}

export interface CitationComponent {
    source: string;
    snippet?: string;
    url?: string;
}

export interface JointComponent {
    type: 'fixed' | 'spherical' | 'revolute' | 'prismatic';
    bodyA: string;
    bodyB: string;
    anchorA: { x: number; y: number; z: number };
    anchorB: { x: number; y: number; z: number };
}

// The Entity Type - Union of all possible components
export interface ECSEntity {
    // Core ID
    id: string;

    // Transform
    position: PositionComponent;
    rotation?: RotationComponent;
    dimensions?: DimensionsComponent;

    // Physics
    physics: PhysicsComponent;
    rigidBodyRef?: RigidBodyRefComponent;

    // Rendering
    renderable: RenderableComponent;
    selectable?: SelectableComponent;
    citation?: CitationComponent;
    joint?: JointComponent;
}

// Create the ECS World
export const ecsWorld = new World<ECSEntity>();

// Query Archetypes for efficient iteration
export const renderableEntities = ecsWorld.with('position', 'renderable');
export const physicsEntities = ecsWorld.with('position', 'physics');
export const selectableEntities = ecsWorld.with('selectable');
export const dynamicEntities = ecsWorld.with('position', 'physics', 'rigidBodyRef');
export const jointEntities = ecsWorld.with('joint');

/**
 * Get entity count for performance monitoring.
 */
export function getEntityCount(): number {
    return ecsWorld.entities.length;
}

/**
 * Clear all entities from the world.
 */
export function clearWorld(): void {
    for (const entity of [...ecsWorld.entities]) {
        ecsWorld.remove(entity);
    }
}

/**
 * Batch add entities for performance.
 */
export function batchAddEntities(entities: ECSEntity[]): void {
    for (const entity of entities) {
        ecsWorld.add(entity);
    }
}

/**
 * Helper: Add a simple renderable entity.
 */
export function addRenderableEntity(
    id: string,
    position: { x: number; y: number; z: number },
    rotation: { x: number; y: number; z: number; w: number },
    shape: 'cube' | 'box' | 'sphere' | 'cylinder' | 'plane' | 'fluid' | 'softbody',
    color = '#ffffff'
): ECSEntity {
    const entity: ECSEntity = {
        id,
        position,
        rotation,
        physics: {
            mass: 1,
            friction: 0.5,
            restitution: 0.3,
            isStatic: false
        },
        renderable: {
            shape,
            color
        }
    };
    ecsWorld.add(entity);
    return entity;
}

/**
 * Helper: Get an entity by ID.
 */
export function getEntity(id: string): ECSEntity | undefined {
    return ecsWorld.entities.find(e => e.id === id);
}