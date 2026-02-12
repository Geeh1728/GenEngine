import { syncFromWorldState, getRenderTransforms } from './src/lib/ecs/systems';
import { WorldState } from './src/lib/simulation/schema';

const mockWorldState: WorldState = {
    scenario: "Structural Stability Test",
    mode: "PHYSICS",
    domain: "SCIENCE",
    description: "Testing Sentinel Redline",
    explanation: "Two spheres: one light and stable, one heavy and unstable.",
    constraints: ["Gravity is active"],
    successCondition: "Observe the red vs blue entities",
    _renderingStage: 'SOLID',
    _resonanceBalance: 0.5,
    entities: [
        {
            id: "stable-entity",
            name: "Stable Sphere",
            shape: "sphere",
            position: { x: -2, y: 1, z: 0 },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
            visual: { color: "#3b82f6" },
            physics: { mass: 1, friction: 0.5, restitution: 0.5, isStatic: false },
            dimensions: { x: 1, y: 1, z: 1 }
        },
        {
            id: "unstable-entity",
            name: "Unstable Heavy Sphere",
            shape: "sphere",
            position: { x: 2, y: 5, z: 0 },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
            visual: { color: "#ef4444" },
            physics: { mass: 100, friction: 0.5, restitution: 0.5, isStatic: false },
            dimensions: { x: 2, y: 2, z: 2 }
        }
    ],
    joints: [
        {
            id: "joint-1",
            type: "revolute",
            bodyA: "unstable-entity",
            bodyB: "ground-plane",
            anchorA: { x: 0, y: -1, z: 0 },
            anchorB: { x: 2, y: 0, z: 0 }
        }
    ],
    environment: {
        gravity: { x: 0, y: -9.81, z: 0 },
        timeScale: 1
    }
};

console.log("🚀 STARTING SENTINEL REDLINE VERIFICATION...");
syncFromWorldState(mockWorldState);

const transforms = getRenderTransforms();

transforms.forEach(t => {
    console.log(`ENTITY: ${t.id} - ${t.shape}`);
    console.log(`   Stability: ${t.isUnstable ? '❌ UNSTABLE (Redline Active)' : '✅ STABLE'}`);
});

const unstable = transforms.find(t => t.id === "unstable-entity");
if (unstable && unstable.isUnstable) {
    console.log("\n✅ VERIFICATION SUCCESS: Sentinel correctly identified heavy unsupported structure.");
} else {
    console.log("\n❌ VERIFICATION FAILED: Sentinel missed the structural risk.");
}
