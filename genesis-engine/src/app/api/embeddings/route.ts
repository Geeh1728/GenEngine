import { NextRequest, NextResponse } from "next/server";
import { embeddingModel } from "@/lib/google";

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
    try {
        const { text } = await req.json();

        if (!text) {
            return NextResponse.json({ error: "No text provided" }, { status: 400 });
        }

        // Generate embedding using Google text-embedding-004
        const result = await embeddingModel.embedContent(text);
        const embedding = result.embedding.values;

        return NextResponse.json({
            success: true,
            embedding: embedding
        });

    } catch (error) {
        console.error("Cloud Embedding Error:", error);
        return NextResponse.json(
            { error: "Failed to generate cloud embedding" },
            { status: 500 }
        );
    }
}
