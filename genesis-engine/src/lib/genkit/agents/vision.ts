import { ai, gemini3Flash, geminiFlash } from '../config';
import { z } from 'genkit';
import { generateWithResilience } from '../resilience';
import { StructuralAnalysisSchema } from '../schemas';

export const VisionInputSchema = z.object({
    imageBase64: z.string().describe('Base64 encoded image data'),
});

/**

 * THE VISUAL CORTEX (Titan Protocol v3.5 - 100% Potential)

 * Model: Qwen-2.5-VL (OCR) + Gemini 3 Flash (Reasoning)

 */

export const visionFlow = ai.defineFlow(

    {

        name: 'visionFlow',

        inputSchema: VisionInputSchema,

        outputSchema: StructuralAnalysisSchema,

    },

    async (input) => {

        let extractedText = "";



        // STEP 1: OCR with Qwen-2.5-VL (Best at handwriting)

        try {

            const qwenResponse = await ai.generate({

                model: 'openai/qwen/qwen2.5-vl-72b-instruct:free', // Use OpenRouter ID

                prompt: [

                    { text: "Transcribe all text and mathematical formulas from this image exactly. Focus on accuracy." },

                    { media: { url: input.imageBase64, contentType: 'image/jpeg' } }

                ]

            });

            extractedText = qwenResponse.text;

        } catch (error) {

            console.error("Qwen OCR Failed:", error);

        }



        const systemPrompt = `

            You are a Structural Robotics Engine.

            Analyze the image for physical objects, joints, and structural elements.

            

            EXTRACTED DATA:

            ${extractedText}



            VISUAL THINKING:

            Identify structural flaws (e.g., lack of triangles, weak joints, weight imbalances).

            Use the EXTRACTED DATA to verify measurements or formulas seen in the image.

            

            Return a JSON object with:

            - elements: List of detected objects with bounding boxes (1000x1000 grid).

            - physicsConstraints: Inferred rules.

            - stabilityScore: 0-100.

            - analysis: Your thinking about the structural integrity.

            - suggestion: How to fix the flaws.

        `;



        try {

            const response = await ai.generate({

                model: gemini3Flash.name,

                system: systemPrompt,

                prompt: [

                    { text: "Analyze the structural integrity of this scene." },

                    { media: { url: input.imageBase64, contentType: 'image/jpeg' } }

                ],

                output: { schema: StructuralAnalysisSchema }

            });

            return response.output;

        } catch (error) {

            console.error("Gemini 3 Vision Failed, falling back to Flash Lite:", error);

            

            return await generateWithResilience({

                system: systemPrompt,

                prompt: [

                    { text: "Analyze this scene for objects and spatial coordinates." },

                    { media: { url: input.imageBase64, contentType: 'image/jpeg' } }

                ],

                schema: StructuralAnalysisSchema,

                retryCount: 1

            });

        }

    }

);
