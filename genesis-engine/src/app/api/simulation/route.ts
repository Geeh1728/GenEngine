import { NextRequest, NextResponse } from 'next/server';
import { simulationFlow } from '@/lib/genkit/simulation';

export async function POST(req: NextRequest) {
    try {
        const { pdfContent, userIntent } = await req.json();

        if (!pdfContent) {
            return NextResponse.json({ error: 'PDF content is required' }, { status: 400 });
        }

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
