import { masteryChallengeFlow } from '@/lib/genkit/mastery_agent';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const result = await masteryChallengeFlow(body);
        return NextResponse.json(result);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error('Mastery Flow Error:', error);
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
