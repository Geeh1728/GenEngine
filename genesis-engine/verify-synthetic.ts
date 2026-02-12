import { breedEntities } from './src/lib/simulation/normalizer';
import { Entity } from './src/lib/simulation/schema';
import * as THREE from 'three';

console.log("🚀 STARTING SYNTHETIC LIFE VERIFICATION...");

// 1. Breed Test
const entityA: Entity = {
    id: 'A',
    shape: 'cube',
    name: 'Parent A',
    physics: { mass: 10, friction: 0.5, restitution: 0.2, isStatic: false },
    visual: { color: '#ff0000' },
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 }
};

const entityB: Entity = {
    id: 'B',
    shape: 'box',
    name: 'Parent B',
    physics: { mass: 20, friction: 0.1, restitution: 0.8, isStatic: false },
    visual: { color: '#0000ff' },
    position: { x: 10, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 }
};

const child = breedEntities(entityA, entityB);

console.log("🧬 BREEDING RESULT:");
console.log(`- Mass: ${child.physics.mass} (Expected: 15)`);
console.log(`- Color: ${child.visual?.color} (Expected: #800080 or similar)`);
console.log(`- Position: ${child.position.x}, ${child.position.y}, ${child.position.z} (Expected: 5, 1, 0)`);

if (child.physics.mass === 15 && child.position.x === 5) {
    console.log("✅ BREEDING STABILITY: VERIFIED");
} else {
    console.log("❌ BREEDING STABILITY: FAILED");
    process.exit(1);
}

// 2. Behavioral Genetics Test
console.log("\n🧪 TESTING BEHAVIORAL GENETICS...");
const scaredEntity: Entity = {
    ...entityA,
    id: 'SCARED',
    behavior: { type: 'REPULSE', strength: 2.0, radius: 10.0, targetId: 'void' }
};
const curiousEntity: Entity = {
    ...entityB,
    id: 'CURIOUS',
    behavior: { type: 'ATTRACT', strength: 2.0, radius: 10.0, targetId: 'void' }
};

const hybrid = breedEntities(scaredEntity, curiousEntity);
console.log(`🧠 Hybrid Behavior Type: ${hybrid.behavior?.type}`);
console.log(`- Strength: ${hybrid.behavior?.strength}`);

if (hybrid.behavior?.type === 'VORTEX') {
    console.log("✅ BEHAVIORAL COMPLEXITY: VERIFIED (Ambivalence achieved)");
} else {
    console.log("❌ BEHAVIORAL COMPLEXITY: FAILED");
    process.exit(1);
}

console.log("✨ ALL SYNTHETIC LIFE TESTS PASSED.");
