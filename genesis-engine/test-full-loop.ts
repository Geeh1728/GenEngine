import { orchestratorFlow } from './src/lib/genkit/agents/orchestrator';

async function runTests() {
    console.log('--- STARTING FULL LOOP TESTS ---');

    try {
        // Test 1: Voxel Concept
        console.log('\n[Test 1] Topic: "The Heat Death of the Universe" (Voxel Mode Expected)');
        const voxelResult = await orchestratorFlow.run({
            text: 'The Heat Death of the Universe',
            mode: 'AUTO',
            isSabotageMode: false
        });
        console.log('FULL RESULT:', JSON.stringify(voxelResult, null, 2));

        // Test 2: Scientific Accuracy
        console.log('\n[Test 2] Topic: "Double Pendulum" (Scientific Mode Expected)');
        const scienceResult = await orchestratorFlow.run({
            text: 'Double Pendulum',
            mode: 'SCIENTIFIC',
            isSabotageMode: false
        });
        console.log('FULL RESULT:', JSON.stringify(scienceResult, null, 2));

    } catch (error) {
        console.error('CRITICAL TEST ERROR:', error);
    }

    console.log('\n--- TESTS COMPLETE ---');
}

runTests();