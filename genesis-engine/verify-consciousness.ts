import { ecsWorld } from './src/lib/ecs/world';
import { syncFromWorldState, runEvolutionarySelection, applyChronesthesia, runEgregorCheck } from './src/lib/ecs/systems';
import { WorldState } from './src/lib/simulation/schema';
import { blackboard } from './src/lib/genkit/context';

console.log("🚀 STARTING CONSCIOUSNESS HORIZON VERIFICATION (v29.0)...");

// 1. Mock WorldState
const mockWorld: WorldState = {
    scenario: "Consciousness Test",
    mode: "PHYSICS",
    domain: "SCIENCE",
    explanation: "Testing v29 systems",
    description: "Consciousness Horizon Verification",
    constraints: [],
    successCondition: "Ascension",
    _renderingStage: 'SOLID',
    _resonanceBalance: 0.5,
    entities: [
        {
            id: 'ego-1',
            shape: 'sphere',
            name: 'Conscious Entity',
            physics: { mass: 1, friction: 0.5, restitution: 0.5 },
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
            visual: { color: '#3b82f6' },
            personality: { 
                evolutionaryStatus: { blessed: 0, cursed: 0 },
                timeDilation: 1.0 
            },
            harmonic: { phase: 0, frequency: 1, amplitude: 1, vibeGroup: 'OMEGA' }
        },
        {
            id: 'ego-2',
            shape: 'sphere',
            physics: { mass: 1, friction: 0.5, restitution: 0.5 },
            position: { x: 1, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
            visual: { color: '#3b82f6' },
            harmonic: { phase: 0.01, frequency: 1, amplitude: 1, vibeGroup: 'OMEGA' }
        },
         { id: 'ego-3', shape: 'sphere', physics: { mass: 1, friction: 0.5, restitution: 0.5 }, position: { x: 2, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0, w: 1 }, visual: { color: '#3b82f6' }, harmonic: { phase: 0.02, frequency: 1, amplitude: 1, vibeGroup: 'OMEGA' } },
         { id: 'ego-4', shape: 'sphere', physics: { mass: 1, friction: 0.5, restitution: 0.5 }, position: { x: 3, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0, w: 1 }, visual: { color: '#3b82f6' }, harmonic: { phase: 0.01, frequency: 1, amplitude: 1, vibeGroup: 'OMEGA' } },
         { id: 'ego-5', shape: 'sphere', physics: { mass: 1, friction: 0.5, restitution: 0.5 }, position: { x: 4, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0, w: 1 }, visual: { color: '#3b82f6' }, harmonic: { phase: 0.03, frequency: 1, amplitude: 1, vibeGroup: 'OMEGA' } }
    ],
};

// 2. Sync
syncFromWorldState(mockWorld);
console.log(`✅ ECS Sync: ${ecsWorld.entities.length} entities loaded.`);

// 3. Test Chronesthesia
blackboard.update({ userVibe: { intensity: 1.0, velocity: 0, focus: { x: 0.5, y: 0.5 } } });
for (let i = 0; i < 20; i++) applyChronesthesia();
const e1 = ecsWorld.entities.find(e => e.id === 'ego-1');
console.log(`⏳ Chronesthesia: Time Dilation = ${e1?.personality?.timeDilation?.toFixed(2)} (Expected < 0.5)`);

// 4. Test Evolutionary Selection
for (let i = 0; i < 5; i++) runEvolutionarySelection('ego-1');
console.log(`🧬 Evolution: Cursed status = ${e1?.personality?.evolutionaryStatus?.cursed.toFixed(2)} (Expected > 0)`);

// 5. Test Egregor Protocol
runEgregorCheck();
console.log(`🧠 Egregor: Entity 1 Color = ${e1?.renderable.color} (Expected #fbbf24/Gold)`);

if ((e1?.personality?.timeDilation || 1) < 1.0 && (e1?.personality?.evolutionaryStatus?.cursed || 0) > 0 && e1?.renderable.color === '#fbbf24') {
    console.log("✨ ALL CONSCIOUSNESS TESTS PASSED.");
} else {
    console.log("❌ CONSCIOUSNESS VERIFICATION FAILED.");
    process.exit(1);
}
