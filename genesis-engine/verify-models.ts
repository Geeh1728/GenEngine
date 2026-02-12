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
        { id: MODELS.BRAIN_ELITE, label: 'Gemini 3 Pro (Elite)' },
        { id: MODELS.BRAIN_FLASH_20, label: 'Gemini 2 Flash (1.5K RPD Speed King)' },
        { id: MODELS.BRAIN_AUDIO, label: 'Native Audio (Unlimited)' },
        { id: MODELS.GROQ_LLAMA_31_8B, label: 'Groq Llama 3.1 8B (14.4K RPD Instant)' },
        { id: MODELS.GROQ_GPT_OSS, label: 'Groq GPT-OSS 120B (Heavy Reasoning)' },
        { id: MODELS.GEMMA_3_27B, label: 'Gemma 3 27B (14.4K RPD Nuclear)' },
        { id: MODELS.BRAIN_REASONING, label: 'DeepSeek R1 (Logic Master)' }
    ];

    for (const m of modelsToTest) {
        await testModel(m.id, m.label);
    }

    console.log("\n✨ COMPREHENSIVE VERIFICATION COMPLETE.");
}

runTests();
