import { executeApexLoop } from '@/lib/genkit/resilience';
import { z } from 'genkit';
import { NextResponse } from 'next/server';

const DiscoverySchema = z.object({
    formula: z.string().describe("Latex or plain text physics formula"),
    pythonVerification: z.string().describe("Python code that returns an R^2 score when run against the data"),
    explanation: z.string()
});

export async function POST(req: Request) {
    try {
        const { trajectoryData } = await req.json();

        const result = await executeApexLoop({
            task: 'MATH',
            model: 'openai/deepseek/deepseek-r1:free',
            prompt: `
                ACT AS NEWTON: Perform Symbolic Regression on this trajectory data.
                DATA: ${trajectoryData}
                
                MISSION:
                1. Identify the physical law (e.g. Parabolic motion, Harmonic oscillation).
                2. Derive the constants (g, k, etc).
                3. Provide a Python script that defines a function 'f(t)' and compares it to the data points, returning only the final R-squared score.
                
                Return JSON matching DiscoverySchema.
            `,
            schema: DiscoverySchema
        });

        return NextResponse.json(result.output);
    } catch (error) {
        return NextResponse.json({ error: 'Discovery failed' }, { status: 500 });
    }
}
