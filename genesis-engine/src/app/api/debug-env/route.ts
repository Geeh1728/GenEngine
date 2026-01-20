import { NextResponse } from "next/server";

export async function GET() {
    const keys = [
        "GOOGLE_GENAI_API_KEY",
        "GOOGLE_API_KEY",
        "GEMINI_API_KEY"
    ];

    const status: Record<string, string> = {};

    keys.forEach(key => {
        const val = process.env[key];
        status[key] = val ? `Present (Length: ${val.length})` : "Missing";
    });

    console.log("--- ENV DEBUG ---");
    console.log(JSON.stringify(status, null, 2));
    console.log("-----------------");

    return NextResponse.json(status);
}
