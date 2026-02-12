import { NextRequest, NextResponse } from "next/server";
import { ai } from "@/lib/genkit/config";
import { MODELS } from "@/lib/genkit/models";
import { executeApexLoop } from "@/lib/genkit/resilience";
import { SummaryOutputSchema } from "@/lib/genkit/schemas";

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
    try {
        const { chunks } = await req.json();

        if (!chunks || !Array.isArray(chunks)) {
            return NextResponse.json({ error: "No chunks provided" }, { status: 400 });
        }

        console.log(`[Summarizer] Processing ${chunks.length} chunks via Gemma 3...`);

        // Process in small batches to avoid token limits or timeouts
        const summarizedChunks = await Promise.all(chunks.map(async (chunk: string) => {
            const result = await executeApexLoop({
                task: 'INGEST',
                prompt: `
                    You are a Scientific Librarian. Summarize the physical principles or 
                    logical concepts in this text snippet for vector indexing.
                    Focus on keywords related to physics, math, and engineering.
                    
                    Snippet: "${chunk.substring(0, 2000)}"
                    
                    Summary:
                `,
                schema: SummaryOutputSchema
            });
            return result.output?.summary || chunk; // Fallback to raw chunk if summary fails
        }));

        return NextResponse.json({
            success: true,
            summaries: summarizedChunks
        });

    } catch (error) {
        console.error("Summarization Error:", error);
        return NextResponse.json(
            { error: "Failed to summarize chunks" },
            { status: 500 }
        );
    }
}
