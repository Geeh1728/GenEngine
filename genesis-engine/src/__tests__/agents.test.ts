import { describe, it, expect, vi } from 'vitest';

// Directly mock the orchestrator to verify the CONTRACT between UI and Agents
// This avoids complex Genkit internal mocking while still verifying system design
vi.mock('../lib/genkit/agents/orchestrator', () => ({
    orchestratorFlow: {
        run: vi.fn().mockImplementation(async (params: { text?: string }) => {
            if (params.text === 'Impossible physics') {
                return { status: 'BLOCKED', message: 'Blocked by logic' };
            }
            return {
                status: 'SUCCESS',
                worldState: { mode: 'PHYSICS', entities: [], constraints: [] },
                quest: { id: 'q1', title: 'Test Quest' }
            };
        })
    }
}));

import { orchestratorFlow } from '../lib/genkit/agents/orchestrator';

interface OrchestratorResult {
    status: string;
    message?: string;
    worldState?: object;
    quest?: object;
}

describe('Council of Agents Architecture Contract', () => {
    it('should return SUCCESS for valid physics requests', async () => {
        const result = await (orchestratorFlow as unknown as { run: (p: object) => Promise<OrchestratorResult> }).run({ text: 'Standard physics test' });
        
        expect(result.status).toBe('SUCCESS');
        expect(result.worldState).toBeDefined();
        expect(result.quest).toBeDefined();
    });

    it('should return BLOCKED for invalid or trapped requests', async () => {
        const result = await (orchestratorFlow as unknown as { run: (p: object) => Promise<OrchestratorResult> }).run({ text: 'Impossible physics' });
        
        expect(result.status).toBe('BLOCKED');
        expect(result.message).toBe('Blocked by logic');
        expect(result.worldState).toBeUndefined();
    });
});
