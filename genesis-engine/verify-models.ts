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
        const text = result.text.trim();
        console.log(`- Result: "${text}"`);
        if (text.includes('STABLE')) {
            console.log(`✅ ${label} is FUNCTIONAL`);
        } else {
            console.log(`⚠️ ${label} returned unexpected response: ${text}`);
        }
    } catch (error) {
        console.error(`❌ ${label} FAILED:`, error instanceof Error ? error.message : error);
    }
    console.log('---');
}

async function runTests() {
    console.log("🚀 STARTING COMPREHENSIVE MODEL VERIFICATION...\n");

    const modelsToTest = [
        // Testing with 'googleai/' prefix
        { id: 'googleai/gemini-2.0-flash', label: 'Gemini 2.0 Flash (Prefix)' },
        // Testing without prefix
        { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (No Prefix)' },
        
        { id: MODELS.GROQ_LLAMA_31_8B, label: 'Groq Llama 3.1 8B (Instant)' },
        { id: MODELS.GEMMA_3_27B, label: 'Gemma 3 27B (Nuclear)' },
        { id: MODELS.BRAIN_REASONING, label: 'DeepSeek R1 (Logic Master)' }
    ];

    for (const m of modelsToTest) {
        await testModel(m.id, m.label);
    }

    console.log("\n✨ COMPREHENSIVE VERIFICATION COMPLETE.");
}

runTests();
