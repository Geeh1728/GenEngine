import dotenv from 'dotenv';
import path from 'path';

// Load .env.local explicitly before importing ai config
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { ai, MODELS } from './src/lib/genkit/config';

async function testModel(modelName: string, label: string) {
    console.log(`Testing ${label} (${modelName})...`);
    try {
        const result = await ai.generate({
            model: modelName,
            prompt: "Return ONLY the word 'STABLE'.",
            config: { maxOutputTokens: 10 }
        });
        console.log(`- Result: ${result.text.trim()}`);
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
    console.log("🚀 STARTING COMPREHENSIVE MODEL VERIFICATION...\n");

    const modelsToTest = [
        { id: MODELS.BRAIN_ELITE, label: 'Elite Brain (2.0 Pro)' },
        { id: MODELS.BRAIN_FLASH_3, label: 'Flash 3 (Restored)' },
        { id: MODELS.BRAIN_FLASH_25, label: 'Flash 2.5 (Restored)' },
        { id: MODELS.BRAIN_AUDIO, label: 'Unlimited Audio (Restored)' },
        { id: MODELS.ROBOTICS_ER, label: 'Robotics ER (Specialized)' },
        { id: MODELS.GROQ_GPT_OSS, label: 'Groq GPT-OSS (Heavy Reasoning)' },
        { id: MODELS.GROQ_LLAMA_4_SCOUT, label: 'Groq Llama 4 Scout (Low Latency)' },
        { id: MODELS.LOGIC_DEEPSEEK, label: 'OpenRouter DeepSeek-R1' }
    ];

    for (const m of modelsToTest) {
        await testModel(m.id, m.label);
    }

    console.log("\n✨ COMPREHENSIVE VERIFICATION COMPLETE.");
}

runTests();
