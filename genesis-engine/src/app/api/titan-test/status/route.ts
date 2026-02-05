import { NextResponse } from 'next/server';
import { blackboard } from '@/lib/genkit/context';

export async function GET() {
    return NextResponse.json(blackboard.getContext());
}
