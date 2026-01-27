import { physicistAgent } from '@/lib/genkit/agents/physicist';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface WorldRuleItem {
    rule: string;
    description: string;
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { topic, rules, complexity, fileUri } = body;

        const context = `Complexity: ${complexity}\n` + (rules || []).map((r: WorldRuleItem) => `${r.rule}: ${r.description}`).join('\n');

        const output = await physicistAgent.run({
            userTopic: topic,
            context,
            isSabotageMode: Math.random() < 0.1, // Randomly activate for learning
            requireDeepLogic: true, // Increased for better generation
            fileUri
        });

        // FORCE UPGRADE: Ensure the mode is always a 3D mode if successful
        if (output && output.mode === 'METAPHOR') {
            output.mode = 'PHYSICS';
        }

        return NextResponse.json(output);
    } catch (error) {
        console.error('World State API Error:', error);
        return NextResponse.json({ error: 'Failed to generate world state' }, { status: 500 });
    }
}
