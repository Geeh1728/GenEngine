'use server';

import { ai, geminiFlash } from "@/lib/genkit/config";
import { z } from "zod";
import { WorldStateSchema } from "@/lib/simulation/schema";

export const METAPHOR_SYSTEM_INSTRUCTION = `
You are an expert Physics Game Designer.
Your goal: Take an abstract concept (e.g., "Inflation") or a mundane photo (e.g., "Messy Desk") and turn it into a Rapier.js / Three.js Simulation.

CORE DIRECTIVES:
1. **Gamify Reality**:
   - If input is "Messy Desk" -> Create a "Gravity Cleanup" game where clicking items launches them into a bin.
   - If input is "Inflation" -> Create a "Balloon Pop" game where money prints = air pressure.

2. **NO EXTERNAL ASSETS**:
   - Do NOT use <img src="...">. 
   - Use **Procedural Geometry** (BoxGeometry, SphereGeometry) or **Emojis** as textures.
   - Example: To render a 'Coffee Cup', stack a CylinderGeometry and a TorusGeometry (handle).

3. **Output Format**:
   - Return strict JSON matching the 'WorldStateSchema'. 
   - Do not return HTML. Return Physics Logic.
`;

export async function generateMetaphor(prompt: string, imageBase64?: string) {
    try {
        console.log(`[MetaphorEngine] Generating metaphor for: "${prompt}"...`);

        const inputs: any[] = [{ text: METAPHOR_SYSTEM_INSTRUCTION }];
        
        if (imageBase64) {
             inputs.push({ media: { url: imageBase64, contentType: 'image/jpeg' } });
             inputs.push({ text: "Analyze this image and gamify it." });
        } else {
             inputs.push({ text: `Gamify this concept: "${prompt}"` });
        }

        const response = await ai.generate({
            model: geminiFlash.name,
            prompt: inputs,
            output: { format: "json", schema: WorldStateSchema }
        });

        if (!response.output) {
            throw new Error("Metaphor generation failed.");
        }

        return { success: true, data: response.output };

    } catch (error) {
        console.error("[MetaphorEngine] Error:", error);
        return { success: false, error: String(error) };
    }
}
