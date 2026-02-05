import { NextResponse } from 'next/server';
import { orchestratorFlow } from '@/lib/genkit/agents/orchestrator';
import { blackboard } from '@/lib/genkit/context';

export async function POST() {
    console.log('[TitanTest] Starting API-driven stress test...');

    // Clear previous logs to start fresh
    blackboard.update({ missionLogs: [], manifestedEntities: [], streamingProgress: 0 });

    const prompt = `
        INITIALIZE TITAN TEST SCENARIO.
        1. Context: A high-density asteroid field entering a planetary atmosphere.
        2. Entities: Spawn 120 unique asteroids with varying materials (rock, ice, iron, obsidian).
        3. Force: Apply a massive gravitational pull towards [0, -100, 0].
        4. Symbolic Truth: Ensure at least 10 asteroids have their coordinates verified by Python physics overrides.
        5. Streaming: Manifest entities incrementally to confirm progress UI.
    `;

    try {
        const result = await orchestratorFlow({
            text: prompt,
            mode: 'PHYSICS',
            isSabotageMode: false,
            isSaboteurReply: false
        });

        const finalContext = blackboard.getContext();

        return NextResponse.json({
            success: true,
            manifestedCount: finalContext.manifestedEntities.length,
            logs: finalContext.missionLogs.length,
            streamingProgress: finalContext.streamingProgress,
            result: result
        });
    } catch (error: any) {
        console.error('[TitanTest] Execution failed:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
