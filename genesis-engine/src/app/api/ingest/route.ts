import { NextRequest, NextResponse } from "next/server";
import { cleanText } from "@/lib/google";
import { extractTextFromPDF } from "@/lib/ingestion/pdf-processor";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { ingestionFlow } from "@/lib/genkit/ingestion";

// Vercel / Next.js Config for Long-Running Processes
export const maxDuration = 300; // Increase to 300 seconds (Deep Research)
export const dynamic = 'force-dynamic';

const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || "";
const fileManager = new GoogleAIFileManager(apiKey);

export async function POST(req: NextRequest) {
    try {
        // 1. Receive the File
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const existingRulesJson = formData.get("existingRules") as string;
        const existingRules = existingRulesJson ? JSON.parse(existingRulesJson) : undefined;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        // 2. Parse PDF (Server-Side)
        const arrayBuffer = await file.arrayBuffer();
        const data = await extractTextFromPDF(arrayBuffer);
        const rawText = cleanText(data);

        // 3. Managed RAG: Upload to Gemini File API
        console.log(`[Ingest] Uploading ${file.name} to Gemini File API...`);
        
        const tempPath = `/tmp/${crypto.randomUUID()}.pdf`;
        const fs = require('fs');
        fs.writeFileSync(tempPath, Buffer.from(arrayBuffer));

        const uploadResult = await fileManager.uploadFile(tempPath, {
            mimeType: "application/pdf",
            displayName: file.name,
        });

        fs.unlinkSync(tempPath);

        // 4. THE SCOUT PASS (v32.5 - LPU Speed)
        // Extract first 5 entities instantly for streaming manifestation
        console.log(`[Ingest] LPU Scout is scanning ${file.name}...`);
        const { scoutFlow } = require("@/lib/genkit/ingestion");
        const scoutResult = await scoutFlow({ source: rawText });

        // 5. RUN THE REALITY COMPILER (Text-to-ECS)
        console.log(`[Ingest] Compiling reality from ${file.name}...`);
        const compilation = await ingestionFlow({
            source: rawText,
            sourceType: 'pdf',
            title: file.name,
            existingRules
        });

        // 6. Chunking for Local Fallback
        const chunks = rawText.match(/.{1,1000}/g) || [];

        // 7. Return data
        return NextResponse.json({
            success: true,
            chunks: chunks.slice(0, 20),
            fileUri: uploadResult.file.uri,
            scoutResult, // v32.5 Instant Manifestation data
            rules: compilation.rules,
            simulationConfig: compilation.simulationConfig,
            metadata: { ...compilation.metadata, title: file.name }
        });

    } catch (error) {
        console.error("Ingestion Error:", error);
        return NextResponse.json(
            { error: "Failed to process PDF. Ensure it is a valid text PDF." },
            { status: 500 }
        );
    }
}
