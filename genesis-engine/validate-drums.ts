import { processMultimodalIntent } from './src/app/actions';

async function validateDrums() {
    console.log("🚀 STARTING DRUM MANIFESTATION VALIDATION (Step 1)...");
    try {
        const step1 = await processMultimodalIntent({
            text: "Manifest a 3D drum kit. Use membrane entities for the snare and bass drum. Map strike velocity to impact force and sound volume. Show me how to play a basic rock beat.",
            mode: 'AUTO'
        });

        if (!step1.success && 'isBlocked' in step1 && step1.isBlocked) {
            console.log("🔍 SABOTEUR CHALLENGE DETECTED. Formulating reply...");
            console.log(`Question: ${step1.message}`);

            const reply = "We use high restitution (0.8) for the snare membrane and high mass (20kg) for the bass drum. Impact velocity is mapped to impulse magnitude in Rapier.js. This is a scientific simulation of a rock beat.";
            
            console.log("🚀 SENDING SABOTEUR REPLY (Step 2)...");
            const result = await processMultimodalIntent({
                text: reply,
                isSaboteurReply: true,
                previousInteractionId: step1.interactionId
            });

            if (result.success && 'worldState' in result && result.worldState) {
                console.log("✅ SUCCESS");
                console.log(`Scenario: ${result.worldState.scenario}`);
                console.log(`Domain: ${result.worldState.domain}`);
                console.log(`Entities: ${result.worldState.entities?.length}`);
                
                const membranes = result.worldState.entities?.filter(e => 
                    e.name?.toLowerCase().includes('drum') || 
                    e.analogyLabel?.toLowerCase().includes('membrane')
                );
                
                console.log(`Membrane Entities Found: ${membranes?.length || 0}`);
                membranes?.forEach(m => {
                    console.log(`- [${m.name}] Shape: ${m.shape} | Restitution: ${m.physics.restitution} | Freq Map: ${JSON.stringify(m.frequency_map)}`);
                });

                console.log("\n--- ASTRA'S GUIDANCE ---");
                if (result.worldState.explanation) {
                    console.log(result.worldState.explanation.substring(0, 300) + "...");
                }
            } else if (result.success && 'mutation' in result) {
                console.log("✅ SUCCESS (Mutation Applied)");
                console.log(`Explanation: ${result.mutation.explanation}`);
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

validateDrums();
