'use server';

import { visualCortexFlow } from '@/lib/genkit/agents/visualCortex';
import { visionFlow } from '@/lib/genkit/agents/vision';

export async function analyzeReality(imageBase64: string) {
    try {
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        const result = await visionFlow({ imageBase64: base64Data });
        return { success: true, data: result };
    } catch (error) {
        console.error("Vision API Error:", error);
        return { success: false, error: "Failed to analyze reality." };
    }
}

export async function analyzeStructuralIntegrity(imageBase64: string, context?: string) {
    try {
        // Strip data:image/png;base64, prefix if present
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        
        const result = await visualCortexFlow({
            imageBase64: base64Data,
            context
        });

        return { success: true, data: result };
    } catch (error) {
        console.error("Structural Analysis Error:", error);
        return { success: false, error: "Failed to analyze structure." };
    }
}