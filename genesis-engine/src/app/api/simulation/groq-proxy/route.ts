import { NextResponse } from 'next/server';

/**
 * MODULE Σ: SECURE LPU PROXY (v60.0 GOLD)
 * Objective: Protect the Groq API Key while maintaining low-latency LPU access for workers.
 */
export async function POST(req: Request) {
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
        return NextResponse.json({ error: 'Groq Key not configured on server.' }, { status: 500 });
    }

    try {
        const body = await req.json();
        const { model, messages, max_tokens, temperature, response_format } = body;

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${groqKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model,
                messages,
                max_tokens,
                temperature,
                response_format
            })
        });

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("[GroqProxy] Failed:", error);
        return NextResponse.json({ error: 'LPU Proxy Failure' }, { status: 500 });
    }
}
