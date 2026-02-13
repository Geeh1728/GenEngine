import { Entity, WorldState } from './schema';

/**
 * SimulationFactory: Unifies the creation of physical entities.
 * Resolves "Scenario Schizophrenia" by centralizing default definitions.
 */
export const SimulationFactory = {
    createGround: (overrides: Partial<Entity> = {}): Entity => ({
        id: 'ground',
        name: 'The Foundation',
        shape: 'plane',
        position: { x: 0, y: -0.5, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        dimensions: { x: 100, y: 1, z: 100 },
        physics: { mass: 0, friction: 0.8, restitution: 0.2, isStatic: true },
        visual: {
            color: '#111115',
        },
        certainty: 1.0,
        ...overrides
    }),

    createTestCube: (overrides: Partial<Entity> = {}): Entity => ({
        id: `cube-${Date.now()}`,
        name: 'Test Subject',
        shape: 'cube',
        position: { x: 0, y: 5, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        dimensions: { x: 1, y: 1, z: 1 },
        physics: { mass: 1, friction: 0.5, restitution: 0.7, isStatic: false },
        visual: {
            color: '#3b82f6',
        },
        certainty: 1.0,
        ...overrides
    }),

    createEmptyWorld: (scenarioName = "New Simulation"): WorldState => ({
        scenario: scenarioName,
        mode: 'PHYSICS',
        domain: 'SCIENCE',
        entities: [SimulationFactory.createGround()],
        constraints: [],
        environment: {
            gravity: { x: 0, y: -9.81, z: 0 },
            timeScale: 1
        },
        successCondition: "Exploration",
        description: "A blank slate for physical testing.",
        explanation: "This world contains only a floor and standard gravity.",
        _renderingStage: 'SOLID',
        _resonanceBalance: 0.5
    })
};
