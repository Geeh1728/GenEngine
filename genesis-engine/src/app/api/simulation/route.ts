import { NextRequest, NextResponse } from 'next/server';
import { simulationFlow } from '@/lib/genkit/simulation';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// SECURITY: Define a strict schema for input validation
const InputSchema = z.object({
    pdfContent: z.string().min(1).max(500000), // Max 50k chars for safety
    userIntent: z.string().max(2000).optional(),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        
        // Validate input
        const validation = InputSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ 
                error: 'Invalid Input', 
                details: validation.error.format() 
            }, { status: 400 });
        }

        const { pdfContent, userIntent } = validation.data;

        // Call the Genkit flow
        const cardData = await simulationFlow({
            pdfContent,
            userIntent,
        });

        return NextResponse.json(cardData);
    } catch (error) {
        const errorMessage = (error instanceof Error ? error.message : String(error)) || 'Internal Server Error';
        console.error('Simulation Flow Error:', error);
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
