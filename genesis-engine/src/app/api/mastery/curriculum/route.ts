import { NextRequest, NextResponse } from "next/server";
import { architectFlow } from "@/lib/genkit/agents/architect";

export async function POST(req: NextRequest) {
    try {
        const { goal } = await req.json();
        if (!goal) return NextResponse.json({ error: "No goal provided" }, { status: 400 });

        const skillTree = await architectFlow(goal);
        return NextResponse.json(skillTree);
    } catch (error) {
        console.error("Architect API Error:", error);
        return NextResponse.json({ error: "Failed to generate curriculum" }, { status: 500 });
    }
}
