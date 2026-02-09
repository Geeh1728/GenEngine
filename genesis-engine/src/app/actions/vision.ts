'use server';

import { ai, geminiFlash } from "@/lib/genkit/config";
import { z } from "zod";

// --- The Reality Lens: Server-Side Vision Analysis ---

/**
 * Analyzes an image for physical objects using Gemini 2.5 Flash.
 * Returns raw JSON compatible with the Google Robotics demo parser.
 */
export async function analyzeReality(imageBase64: string, isPremium: boolean = false) {
    try {
        console.log(`[RealityLens] Analyzing image (Premium: ${isPremium})...`);
        
        // 1. Select Model (Tiered Intelligence)
        // Premium users get the high-fidelity model (simulated here as the same for now, but ready for upgrade)
        const modelName = isPremium ? geminiFlash.name : geminiFlash.name;

        // 2. Define System Prompt based on Tier
        // The Robotics/Spatial prompt requires specific output formatting
        const systemPrompt = isPremium
            ? "You are a Spatial Robotics Engine. Output 3D bounding boxes [cx, cy, cz, w, h, d, r, p, y] and labels."
            : "You are a 2D Vision Engine. Detect physical objects (boxes, cups, balls). Output a JSON list: { box_2d: [ymin, xmin, ymax, xmax], label: string, estimatedMass: number }.";

        // 3. Call Genkit
        const response = await ai.generate({
            model: modelName,
            prompt: [
                { text: systemPrompt },
                { media: { url: imageBase64, contentType: 'image/jpeg' } }
            ],
            output: { format: "json" } // Enforce JSON mode
        });

        if (!response.output) {
            throw new Error("Gemini returned empty output.");
        }

        return { success: true, data: response.output };

    } catch (error) {
        console.error("[RealityLens] Analysis Failed:", error);
        return { success: false, error: String(error) };
    }
}
