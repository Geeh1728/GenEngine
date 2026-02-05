import { processMultimodalIntent } from './src/app/actions';

async function validate() {
    console.log("🚀 STARTING PIANO VALIDATION (Step 1)...");
    try {
        const step1 = await processMultimodalIntent({
            text: "Manifest a grand piano. Every key must be a RigidBody with a revolute joint. Show me how to play a C-Major chord. Map the harmonic relationship to physical stability.",
            mode: 'AUTO'
        });

        if (!step1.success && 'isBlocked' in step1 && step1.isBlocked) {
            console.log("🔍 SABOTEUR CHALLENGE DETECTED. Formulating reply...");
            const reply = "We map the integer ratios of frequencies (4:5:6) to spring stiffness coefficients. Higher consonance equals lower potential energy in the joints, resulting in visual stability.";
            
            console.log("🚀 SENDING SABOTEUR REPLY (Step 2)...");
            const result = await processMultimodalIntent({
                text: reply,
                isSaboteurReply: true,
                previousInteractionId: step1.interactionId
            });

            if (result.success) {
                console.log("✅ SUCCESS");
                console.log(`Scenario: ${result.worldState.scenario}`);
                console.log(`Domain: ${result.worldState.domain}`);
                console.log(`Entities: ${result.worldState.entities?.length}`);
                console.log(`Explanation: ${result.worldState.explanation.substring(0, 200)}...`);
            } else {
                console.error("❌ FAILED STEP 2:", JSON.stringify(result, null, 2));
            }
        } else if (step1.success) {
            console.log("✅ SUCCESS (Step 1 passed directly)");
        } else {
            console.error("❌ FAILED STEP 1:", JSON.stringify(step1, null, 2));
        }
    } catch (e) {
        console.error("❌ ERROR:", e);
    }
}

validate();
