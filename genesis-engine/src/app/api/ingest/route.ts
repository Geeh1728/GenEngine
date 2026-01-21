import { NextRequest, NextResponse } from "next/server";
import { embeddingModel, cleanText } from "@/lib/google";
import { extractTextFromPDF } from "@/lib/ingestion/pdf-processor";

// Vercel / Next.js Config for Long-Running Processes
export const maxDuration = 60; // Increase to 60 seconds (Pro/Hobby limit)
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        // 1. Receive the File
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        // 2. Parse PDF (Server-Side)
        const arrayBuffer = await file.arrayBuffer();
        const data = await extractTextFromPDF(arrayBuffer);

        const rawText = cleanText(data);

        // 3. Chunking (Critical for Embeddings)
        // We split the long text into smaller pieces (e.g., 500 chars)
        // so the AI doesn't choke.
        const chunks = rawText.match(/.{1,1000}/g) || [];

        // 4. Return data for Local Embedding (Transformers.js) or API Embedding
        return NextResponse.json({
            success: true,
            chunks: chunks.slice(0, 20), // Send chunks back to client for local embedding if offline
            metadata: { title: file.name }
        });

    } catch (error) {
        console.error("Ingestion Error:", error);
        return NextResponse.json(
            { error: "Failed to process PDF. Ensure it is a valid text PDF." },
            { status: 500 }
        );
    }
}
