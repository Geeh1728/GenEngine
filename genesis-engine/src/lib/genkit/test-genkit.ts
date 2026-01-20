import { ai, geminiFlash } from './config';

async function test() {
    try {
        console.log('Testing Genkit generate...');
        const { text } = await ai.generate({
            model: geminiFlash.name,
            prompt: 'Hello, are you online?'
        });
        console.log('Response:', text);
    } catch (error) {
        console.error('Genkit Error:', error);
    }
}

test();
