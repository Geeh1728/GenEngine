import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Force load env from .env.local
const envPath = path.resolve(process.cwd(), 'genesis-engine', '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log("✅ Loaded .env.local");
} else {
    console.error("❌ .env.local not found at:", envPath);
    process.exit(1);
}

// satisfy openai plugin validation
if (process.env.OPENROUTER_API_KEY && !process.env.OPENAI_API_KEY) {
    process.env.OPENAI_API_KEY = process.env.OPENROUTER_API_KEY;
}

import { ai } from './genesis-engine/src/lib/genkit/config';
import { MODELS } from './genesis-engine/src/lib/genkit/models';

async function verifyOpenRouter() {
    console.log("🚀 STARTING OPENROUTER API VERIFICATION...");

    const testModels = [
        { id: MODELS.LOGIC_DEEPSEEK, label: 'DeepSeek-R1 (Free)' },
        { id: MODELS.PHYSICS_LIQUID, label: 'LiquidAI LFM (Free)' },
        { id: MODELS.REFLEX_NVIDIA, label: 'NVIDIA Nemotron (Free)' },
        { id: MODELS.GROQ_GPT_OSS, label: 'GPT-OSS (Groq)' },
        { id: MODELS.GROQ_QWEN_3, label: 'Qwen 3 (Groq)' }
    ];

    for (const model of testModels) {
        console.log(`\nTesting ${model.label} (${model.id})...`);
        try {
            const start = Date.now();
            const result = await ai.generate({
                model: model.id,
                prompt: 'Say "ACTIVE". Keep it short.',
                config: { temperature: 0 }
            });
            const duration = Date.now() - start;
            console.log(`   Result: ${result.text.trim()} (${duration}ms)`);
            if (result.text.toLowerCase().includes("active")) {
                console.log(`   ✅ ${model.label} is operational.`);
            } else {
                console.log(`   ⚠️ ${model.label} returned unexpected response: ${result.text}`);
            }
        } catch (error) {
            console.log(`   ❌ ${model.label} FAILED:`, error instanceof Error ? error.message : error);
        }
    }

    console.log("\n--- VERIFICATION COMPLETE ---");
}

verifyOpenRouter();