import { NextRequest, NextResponse } from "next/server";
import { embeddingModel, cleanText } from "@/lib/google";
import { extractTextFromPDF } from "@/lib/ingestion/pdf-processor";
import { GoogleAIFileManager } from "@google/generative-ai/server";

// Vercel / Next.js Config for Long-Running Processes
export const maxDuration = 60; // Increase to 60 seconds (Pro/Hobby limit)
export const dynamic = 'force-dynamic';

const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || "";
const fileManager = new GoogleAIFileManager(apiKey);

export async function POST(req: NextRequest) {
    try {
        // 1. Receive the File
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        // 2. Parse PDF (Server-Side) for Local PGLite (Offline Support)
        const arrayBuffer = await file.arrayBuffer();
        const data = await extractTextFromPDF(arrayBuffer);
        const rawText = cleanText(data);

        // 3. Managed RAG: Upload to Gemini File API
        console.log(`[Ingest] Uploading ${file.name} to Gemini File API...`);
        
        // Save temp file for upload (GoogleAIFileManager needs a path)
        // SECURITY: Use random UUID instead of file.name to prevent path traversal
        const tempPath = `/tmp/${crypto.randomUUID()}.pdf`;
        const fs = require('fs');
        fs.writeFileSync(tempPath, Buffer.from(arrayBuffer));

        const uploadResult = await fileManager.uploadFile(tempPath, {
            mimeType: "application/pdf",
            displayName: file.name,
        });

        // Cleanup temp file
        fs.unlinkSync(tempPath);

        // 4. Chunking for Local PGLite (Fallback)
        const chunks = rawText.match(/.{1,1000}/g) || [];

        // 5. Return data
        return NextResponse.json({
            success: true,
            chunks: chunks.slice(0, 20),
            fileUri: uploadResult.file.uri, // This is the magic key for Agentic RAG
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
