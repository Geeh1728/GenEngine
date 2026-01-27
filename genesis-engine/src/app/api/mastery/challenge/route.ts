import { NextRequest, NextResponse } from "next/server";
import { masteryChallengeFlow } from "@/lib/genkit/mastery_agent";

export async function POST(req: NextRequest) {
    try {
        const { rules, complexity } = await req.json();
        
        if (!rules || !Array.isArray(rules)) {
            return NextResponse.json({ error: "Missing rules for challenge generation" }, { status: 400 });
        }

        const challenge = await masteryChallengeFlow({ 
            rules, 
            complexity: complexity || 'standard' 
        });
        
        return NextResponse.json(challenge);
    } catch (error) {
        console.error("Mastery Challenge API Error:", error);
        return NextResponse.json({ error: "Failed to generate mastery challenge" }, { status: 500 });
    }
}
