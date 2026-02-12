'use server';

import { ai, geminiFlash } from '@/lib/genkit/config';

/**
 * Plans the lesson by identifying critical timestamps for physics concepts.
 * Moved to Server Action to avoid client-side gRPC dependencies.
 */
export async function planVideoLessonAction(videoTitle: string, videoDescription: string) {
    const PRE_PLAN_PROMPT = `
    I have a video about "${videoTitle}". 
    Description: ${videoDescription}

    Identify the 3 most critical timestamps (start/end) that visually demonstrate the physics concepts.
    Return JSON: { segments: [{ start: "02:10", end: "02:45", concept: "Torque" }] }
  `;

    try {
        const { output } = await ai.generate({
            model: geminiFlash.name,
            prompt: PRE_PLAN_PROMPT,
            output: {
                format: 'json',
            }
        });

        return { success: true, segments: (output as any)?.segments || [] };
    } catch (error) {
        console.error('Video Pre-Plan Error:', error);
        return { success: false, error: String(error) };
    }
}
