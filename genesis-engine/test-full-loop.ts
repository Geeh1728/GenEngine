import { orchestratorFlow } from './src/lib/genkit/agents/orchestrator';
import { ai } from './src/lib/genkit/config';

async function testFullLoop() {
    console.log("🚀 STARTING END-TO-END SIMULATION TEST...");

    const testPrompt = "Simulate a 50kg sphere falling from 10 meters on Mars. Ground it with real Mars gravity data.";

    console.log(`\n1. INPUT PROMPT: "${testPrompt}"`);

    try {
        console.log("\n2. EXECUTING ORCHESTRATOR FLOW...");
        const result = await orchestratorFlow({
            text: testPrompt,
            mode: 'AUTO',
            isSabotageMode: false,
            isSaboteurReply: false
        });

        console.log("\n3. ORCHESTRATOR STATUS:", result.status);

        if (result.logs) {
            console.log("\n4. MISSION LOGS:");
            result.logs.forEach(log => {
                console.log(`   [${log.agent}] (${log.type}): ${log.message}`);
            });
        }

        if (result.worldState) {
            console.log("\n5. COMPILED WORLD STATE:");
            console.log(`   Scenario: ${result.worldState.scenario}`);
            console.log(`   Mode: ${result.worldState.mode}`);
            console.log(`   Gravity: Y=${result.worldState.environment?.gravity.y}`);
            console.log(`   Entities: ${result.worldState.entities?.length || 0}`);

            if (result.worldState.entities && result.worldState.entities.length > 0) {
                const entity = result.worldState.entities[0];
                if (entity.citation) {
                    console.log(`\n6. GROUNDING CITATION DETECTED:`);
                    console.log(`   Source: ${entity.citation.source}`);
                }
            }

            console.log("\n✅ TEST SUCCESSFUL: Reality successfully compiled.");
        } else if (result.mutation) {
            console.log("\n5. COMPILED MUTATION:");
            console.log(`   Type: ${result.mutation.type}`);
            console.log(`   Explanation: ${result.mutation.explanation}`);
            console.log("\n✅ TEST SUCCESSFUL: Mutation successfully compiled.");
        } else {
            console.log("\n❌ TEST FAILED: No world state or mutation generated.");
        }

    } catch (error) {
        console.error("\n💥 CRITICAL TEST FAILURE:", error);
    }
}

// Note: This needs to be run in a Node environment with environment variables loaded.
testFullLoop();
