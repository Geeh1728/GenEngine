import { WorldState } from '../simulation/schema';

export const bridgeScenario: WorldState = {
    scenario: "Suspension Bridge Test",
    mode: "PHYSICS",
    description: "A suspension bridge with 10 dynamic segments connected by fixed joints between two static towers.",
    explanation: "Simulation of a bridge structure to test joint constraints and structural integrity.",
    entities: [
        // Tower A
        {
            id: 'tower-a',
            type: 'cube',
            name: 'Tower A',
            position: { x: -5.5, y: 2.5, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            dimensions: { x: 1, y: 5, z: 1 },
            physics: { mass: 0, friction: 0.5, restitution: 0.1 },
            isStatic: true,
            color: 'gray'
        },
        // Tower B
        {
            id: 'tower-b',
            type: 'cube',
            name: 'Tower B',
            position: { x: 5.5, y: 2.5, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            dimensions: { x: 1, y: 5, z: 1 },
            physics: { mass: 0, friction: 0.5, restitution: 0.1 },
            isStatic: true,
            color: 'gray'
        },
        // Planks
        ...Array.from({ length: 10 }).map((_, i) => ({
            id: `plank-${i}`,
            type: 'cube' as const,
            name: i === 5 ? 'Brittle Section' : 'Steel Beam', // Special naming for material logic
            position: { x: -4.5 + i, y: 4, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            dimensions: { x: 1, y: 0.2, z: 2 },
            physics: { mass: 1, friction: 0.5, restitution: 0.2 },
            isStatic: false,
            color: i === 5 ? '#f87171' : '#94a3b8',
            texturePrompt: i === 5 ? 'cracked rusted steel' : 'brushed structural steel'
        })),
        // Ground
        {
            id: 'ground',
            type: 'cube',
            name: 'Ground',
            position: { x: 0, y: -0.5, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            dimensions: { x: 20, y: 1, z: 20 },
            physics: { mass: 0, friction: 0.8, restitution: 0.5 },
            isStatic: true,
            color: 'grass'
        }
    ],
    joints: [
        // Connect Tower A to Plank 0
        {
            id: 'joint-tower-a',
            type: 'fixed',
            bodyA: 'tower-a',
            bodyB: 'plank-0',
            anchorA: { x: 0.5, y: 2, z: 0 },
            anchorB: { x: -0.5, y: 0, z: 0 }
        },
        // Connect Planks
        ...Array.from({ length: 9 }).map((_, i) => ({
            id: `joint-plank-${i}`,
            type: 'fixed' as const, // Cast to literal type
            bodyA: `plank-${i}`,
            bodyB: `plank-${i + 1}`,
            anchorA: { x: 0.5, y: 0, z: 0 },
            anchorB: { x: -0.5, y: 0, z: 0 }
        })),
        // Connect Plank 9 to Tower B
        {
            id: 'joint-tower-b',
            type: 'fixed',
            bodyA: 'plank-9',
            bodyB: 'tower-b',
            anchorA: { x: 0.5, y: 0, z: 0 },
            anchorB: { x: -0.5, y: 2, z: 0 }
        }
    ],
    constraints: [
        "The bridge must not collapse under its own weight.",
        "The towers must remain static."
    ],
    successCondition: "The bridge stays intact.",
    environment: {
        gravity: { x: 0, y: -9.81, z: 0 },
        timeScale: 1
    },
    sabotage_reveal: "WARNING: Section 5 detected with critical micro-fractures. In a frozen environment, this brittle steel will fail under shear stress.",
    societalImpact: "Structural integrity is the foundation of civil mobility. A single flawed beam can isolate entire rural communities from healthcare and education."
};
