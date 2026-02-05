import { ai } from './src/lib/genkit/config';

async function listModels() {
    console.log("Listing available models...");
    // @ts-ignore
    const registries = ai.registry;
    // @ts-ignore
    const models = await registries.lookupType('model');
    console.log(JSON.stringify(models, null, 2));
}

listModels();
