import { executeApexLoop } from '@/lib/genkit/resilience';
import { SkillNodeSchema } from '@/lib/genkit/schemas';
import { z } from 'zod';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { currentTopic, failedNodeId, failureContext } = await req.json();

        const result = await executeApexLoop({
            task: 'INGEST',
            model: 'googleai/gemini-3-flash',
            prompt: `
                ACT AS ARCHITECT (LingBot Pattern): 
                The user failed to master the node "${failedNodeId}" in the topic "${currentTopic}".
                Context of failure: ${failureContext}
                
                MISSION: Generate a simplified 'Bridge' node that teaches the prerequisite concepts needed to succeed.
                Return JSON matching SkillNodeSchema.
            `,
            schema: SkillNodeSchema
        });

        return NextResponse.json(result.output);
    } catch (error) {
        return NextResponse.json({ error: 'Bridge generation failed' }, { status: 500 });
    }
}
