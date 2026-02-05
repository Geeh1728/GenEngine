import { NextRequest, NextResponse } from "next/server";
import { embeddingModel } from "@/lib/google";
import { ai, OPENROUTER_FREE_MODELS } from "@/lib/genkit/config";
import { MODELS } from "@/lib/genkit/models";

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
    try {
        const { text, model } = await req.json();

        if (!text) {
            return NextResponse.json({ error: "No text provided" }, { status: 400 });
        }

        const preferredModel = model || MODELS.EMBEDDING_MODEL;
        let embedding: number[];

        if (preferredModel === MODELS.MISTRAL_EMBED) {
            console.log("[API] Calling Mistral Specialist via OpenRouter...");
            const result = await ai.embed({
                embedder: OPENROUTER_FREE_MODELS.EMBED,
                content: text
            });
            embedding = result[0].embedding;
        } else {
            // Default to Google text-embedding-004
            const result = await embeddingModel.embedContent(text);
            embedding = result.embedding.values;
        }

        return NextResponse.json({
            success: true,
            embedding: embedding,
            model: preferredModel
        });

    } catch (error) {
        console.error("Cloud Embedding Error:", error);
        return NextResponse.json(
            { error: "Failed to generate cloud embedding" },
            { status: 500 }
        );
    }
}
