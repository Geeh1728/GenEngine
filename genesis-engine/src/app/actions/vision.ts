'use server';

import { visualCortexFlow } from '@/lib/genkit/agents/visualCortex';

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