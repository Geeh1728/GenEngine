import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * ECS Integration Tests
 * Tests the Entity Component System synchronization with WorldState
 */

// Mock Rapier for tests
vi.mock('@dimforge/rapier3d', () => ({
    World: class {
        free() { }
    },
    RigidBodyDesc: {
        fixed: () => ({ setGravityScale: () => ({}) }),
        dynamic: () => ({
            setLinearDamping: () => ({}),
            setCcdEnabled: () => ({})
        })
    },
    ColliderDesc: {
        cuboid: () => ({ setRestitution: () => ({ setFriction: () => ({ setMass: () => ({}) }) }) }),
        cylinder: () => ({ setRestitution: () => ({ setFriction: () => ({ setMass: () => ({}) }) }) }),
        ball: () => ({ setRestitution: () => ({ setFriction: () => ({ setMass: () => ({}) }) }) })
    }
}));

// Import after mock
import { syncFromWorldState, clearWorld, addRenderableEntity, getEntity, getRenderTransforms } from '../lib/ecs/world';
import { WorldState, Entity } from '../lib/simulation/schema';

describe('ECS Integration', () => {
    beforeEach(() => {
        clearWorld();
    });

    it('should sync WorldState entities to ECS world', () => {
        const mockWorld: WorldState = {
            scenario: 'Test Scenario',
            mode: 'PHYSICS',
            domain: 'SCIENCE',
            entities: [
                {
                    id: 'test-cube',
                    shape: 'cube',
                    position: { x: 0, y: 5, z: 0 },
                    rotation: { x: 0, y: 0, z: 0, w: 1 },
                    physics: { mass: 1, friction: 0.5, restitution: 0.3 },
                    visual: { color: '#ff0000' },
                    dimensions: { x: 1, y: 1, z: 1 }
                }
            ],
            constraints: [],
            successCondition: 'Test passes',
            description: 'Test simulation',
            explanation: 'Testing ECS sync'
        };

        syncFromWorldState(mockWorld);

        const entity = getEntity('test-cube');
        expect(entity).toBeDefined();
        expect(entity?.position).toEqual({ x: 0, y: 5, z: 0 });
    });

    it('should handle multiple entities', () => {
        const entities: Entity[] = [
            {
                id: 'entity-1',
                shape: 'sphere',
                position: { x: 0, y: 1, z: 0 },
                rotation: { x: 0, y: 0, z: 0, w: 1 },
                physics: { mass: 2 },
                visual: { color: '#00ff00' }
            },
            {
                id: 'entity-2',
                shape: 'cube',
                position: { x: 3, y: 2, z: 1 },
                rotation: { x: 0, y: 0, z: 0, w: 1 },
                physics: { mass: 5 },
                visual: { color: '#0000ff' }
            }
        ];

        entities.forEach(e => addRenderableEntity(e.id, e.position, e.rotation, e.shape));

        const transforms = getRenderTransforms();
        expect(transforms.length).toBeGreaterThanOrEqual(2);
    });

    it('should return correct render transforms', () => {
        addRenderableEntity('render-test', { x: 10, y: 20, z: 30 }, { x: 0, y: 0, z: 0, w: 1 }, 'cylinder');

        const transforms = getRenderTransforms();
        const testTransform = transforms.find(t => t.id === 'render-test');

        expect(testTransform).toBeDefined();
        expect(testTransform?.position).toEqual({ x: 10, y: 20, z: 30 });
        expect(testTransform?.shape).toBe('cylinder');
    });

    it('should clear all entities on clearWorld', () => {
        addRenderableEntity('temp-1', { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0, w: 1 }, 'cube');
        addRenderableEntity('temp-2', { x: 1, y: 1, z: 1 }, { x: 0, y: 0, z: 0, w: 1 }, 'sphere');

        clearWorld();

        const transforms = getRenderTransforms();
        expect(transforms).toHaveLength(0);
    });
});
