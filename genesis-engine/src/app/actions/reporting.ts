'use server';

import { ai, geminiFlash } from "@/lib/genkit/config";
import { WorldState } from "@/lib/simulation/schema";
import { z } from "zod";

/**
 * INVERSE INGESTION (v24.0 Oracle)
 * Objective: Export the simulation session as a scientific report.
 * Logic: Summarizes the Vibe Session transcript and final state into a "Textbook" format.
 */

const ScientificPaperSchema = z.object({
    title: z.string(),
    abstract: z.string(),
    methodology: z.string().describe('Explanation of the physical parameters used in the simulation'),
    results: z.string().describe('Observations of the simulation stability and behavior'),
    conclusion: z.string(),
    markdown: z.string().describe('The full formatted paper in Markdown')
});

export async function generateSessionReport(transcript: string[], finalWorldState: WorldState) {
    try {
        console.log(`[Author] Generating scientific report from ${transcript.length} turns...`);

        const response = await ai.generate({
            model: geminiFlash.name,
            prompt: `
            ACT AS: Lead Research Scientist.
            
            SESSION TRANSCRIPT:
            ${transcript.join('\n')}
            
            FINAL SIMULATION STATE:
            ${JSON.stringify(finalWorldState)}
            
            TASK:
            Compile a formal scientific report based on this "Vibe Coding" session.
            The user (Student) has acted as the architect of reality.
            
            Focus on:
            1. The hypothesis explored.
            2. The mutations made (e.g., changes in gravity or mass).
            3. The physical conclusions reached.
            
            Return JSON matching ScientificPaperSchema.
            `,
            output: { schema: ScientificPaperSchema }
        });

        if (!response.output) throw new Error("Report generation failed.");

        return { success: true, report: response.output };

    } catch (error) {
        console.error("[Author] Error:", error);
        return { success: false, error: String(error) };
    }
}
