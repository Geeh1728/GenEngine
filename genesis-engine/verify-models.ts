import { ai, MODELS } from './src/lib/genkit/config';

async function testModel(modelName: string, label: string) {
    console.log(`Testing ${label} (${modelName})...`);
    try {
        const result = await ai.generate({
            model: modelName,
            prompt: "Return the word 'STABLE' if you can read this.",
            config: { maxOutputTokens: 10 }
        });
        console.log(`- Result: ${result.text}`);
        if (result.text.includes('STABLE')) {
            console.log(`✅ ${label} is FUNCTIONAL`);
        } else {
            console.log(`⚠️ ${label} returned unexpected response: ${result.text}`);
        }
    } catch (error) {
        console.error(`❌ ${label} FAILED:`, error instanceof Error ? error.message : error);
    }
    console.log('---');
}

async function runTests() {
    console.log("🚀 STARTING MODEL FUNCTIONALITY VERIFICATION...\n");

    const modelsToTest = [
        { id: MODELS.BRAIN_ELITE, label: 'Elite Brain (2.0 Pro)' },
        { id: MODELS.BRAIN_PRO, label: 'Pro Brain (2.0 Flash)' },
        { id: MODELS.BRAIN_FLASH_3, label: 'Flash 3' },
        { id: MODELS.BRAIN_AUDIO, label: 'Unlimited Audio' },
        { id: MODELS.ROBOTICS_ER, label: 'Robotics ER' },
        { id: MODELS.GROQ_LLAMA_4_SCOUT, label: 'Groq Llama 4 Scout' },
        { id: MODELS.GROQ_GPT_OSS, label: 'Groq GPT-OSS' }
    ];

    for (const m of modelsToTest) {
        await testModel(m.id, m.label);
    }

    console.log("\n✨ VERIFICATION SEQUENCE COMPLETE.");
}

runTests();
