import { NextRequest, NextResponse } from "next/server";
import { examParserFlow } from "@/lib/genkit/mastery_agent";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { examText, subject } = await req.json();

        if (!examText) {
            return NextResponse.json({ error: "No exam text provided" }, { status: 400 });
        }

        console.log(`[API] Living Exam: Parsing question...`);
        const levelConfig = await examParserFlow.run({
            examText,
            subject: subject || 'Physics'
        });

        return NextResponse.json({
            success: true,
            levelConfig
        });

    } catch (error) {
        console.error("Living Exam API Error:", error);
        return NextResponse.json(
            { error: "Failed to generate interactive exam level." },
            { status: 500 }
        );
    }
}
