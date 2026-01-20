/**
 * Texture Generation Service (The "Nano Banana" Pipeline)
 * 
 * Strategy:
 * 1. Try to use on-device AI (window.ai) if available.
 * 2. Fallback to procedural generation (Canvas API) for cost/speed.
 * 3. Absolutey NO expensive video generation APIs.
 */

export interface TextureGenerator {
    generateTexture(prompt: string): Promise<string>; // Returns a Blob URL or Data URI
}

export class GeminiNanoTextureGenerator implements TextureGenerator {
    async generateTexture(prompt: string): Promise<string> {
        console.log(`[NanoBanana] Generating texture for: "${prompt}"`);

        // Check for experimental on-device AI
        if (typeof window !== 'undefined' && 'ai' in window) {
            try {
                // Hypothetical API for 2026 Chrome
                // const model = await (window as any).ai.createTextToImage();
                // const blob = await model.generate(prompt);
                // return URL.createObjectURL(blob);
                console.log('Gemini Nano detected! (Simulating implementation)');
            } catch (e) {
                console.warn('Gemini Nano failed, falling back to procedural.', e);
            }
        }

        // Fallback: Procedural "Red Dust" Noise (The Robin Hood special)
        return this.generateProceduralNoise(prompt);
    }

    private generateProceduralNoise(prompt: string): Promise<string> {
        return new Promise((resolve) => {
            if (typeof document === 'undefined') return resolve('');

            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve('');

            // Determine base color based on prompt (Quick heuristics)
            let baseColor = '#808080'; // Default Gray
            if (prompt.toLowerCase().includes('mars') || prompt.toLowerCase().includes('red')) baseColor = '#A95842'; // Mars Red
            if (prompt.toLowerCase().includes('grass') || prompt.toLowerCase().includes('green')) baseColor = '#4C8F56'; // Green
            if (prompt.toLowerCase().includes('sand') || prompt.toLowerCase().includes('desert')) baseColor = '#C2B280'; // Sand

            // Fill Background
            ctx.fillStyle = baseColor;
            ctx.fillRect(0, 0, 512, 512);

            // Add Noise
            const imageData = ctx.getImageData(0, 0, 512, 512);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                const noise = (Math.random() - 0.5) * 40; // Intensity
                data[i] = Math.min(255, Math.max(0, data[i] + noise));
                data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
                data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
            }
            ctx.putImageData(imageData, 0, 0);

            // Add some "craters" or details
            for (let i = 0; i < 50; i++) {
                const x = Math.random() * 512;
                const y = Math.random() * 512;
                const r = Math.random() * 20;
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(0,0,0,0.1)';
                ctx.fill();
            }

            resolve(canvas.toDataURL('image/jpeg', 0.8));
        });
    }
}

export const textureService = new GeminiNanoTextureGenerator();
