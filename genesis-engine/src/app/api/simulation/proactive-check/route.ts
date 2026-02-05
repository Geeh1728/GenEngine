import { criticAgent } from '@/lib/genkit/agents/critic';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { worldState, blackboardContext } = await req.json();

        // Use the Critic to find learning moments or flaws without the user asking
        const result = await criticAgent({
            userTopic: `BACKGROUND OBSERVATION MODE. 
            CONTEXT: ${JSON.stringify(blackboardContext)}
            WORLD: ${JSON.stringify(worldState)}
            
            Look for one critical flaw or one interesting "what-if" question based on the physics.
            Be concise. Be proactive.`,
            isSaboteurReply: true
        });

        return NextResponse.json({
            intervention: result.message,
            isCritical: result.status === 'TRAP'
        });
    } catch (error) {
        console.error('Proactive Check Error:', error);
        return NextResponse.json({ error: 'Check failed' }, { status: 500 });
    }
}
