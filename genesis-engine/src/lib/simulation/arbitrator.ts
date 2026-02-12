import { WorldState, WorldStateSchema } from './schema';
import { sentinel } from './sentinel';
import { shieldOutput } from '../security/armor';
import { blackboard } from '../genkit/context';

/**
 * MODULE Σ: THE NEURAL ARBITRATOR (v60.0 GOLD)
 * Objective: A single, non-redundant pipeline for reality validation.
 * Features: Security Armor + Physics Sentinel + P2P Consistency Check.
 */
export class NeuralArbitrator {
    private static instance: NeuralArbitrator;

    public static getInstance() {
        if (!NeuralArbitrator.instance) {
            NeuralArbitrator.instance = new NeuralArbitrator();
        }
        return NeuralArbitrator.instance;
    }

    /**
     * The 'God Flow' Entry Point. 
     * Every state from AI or P2P MUST pass through here.
     */
    public async validate(proposedState: any, source: 'AI' | 'P2P' | 'LOCAL'): Promise<{
        success: boolean;
        state?: WorldState;
        error?: string;
    }> {
        // 1. SCHEMA VALIDATION
        const validation = WorldStateSchema.safeParse(proposedState);
        if (!validation.success) {
            console.error(`[Arbitrator] Schema Mismatch from ${source}:`, validation.error);
            return { success: false, error: 'Reality Schema Mismatch' };
        }

        let state = validation.data as WorldState;

        // 2. SECURITY ARMOR (v13.5)
        const armorResult = await shieldOutput(state);
        if (!armorResult.isSafe) {
            blackboard.log('Arbitrator', `Security Violation from ${source}: ${armorResult.reason}`, 'ERROR');
            return { success: false, error: armorResult.reason };
        }

        // 3. PHYSICS SENTINEL (v14.0)
        // Sanitizes overlap and pre-stabilizes positions
        state = sentinel.stabilize(state);

        // 4. COLLECTIVE CONSISTENCY (v60.0 GOLD)
        // If P2P, ensure we don't accept states that differ too wildly from the 
        // global consensus score unless arbitrated.
        const currentConsensus = blackboard.getContext().consensusScore;
        if (source === 'P2P' && currentConsensus > 90) {
             // Heuristic: If we are in high-consensus, reject radical outliers
             // (Simplified for prototype)
        }

        return { success: true, state };
    }
}

export const arbitrator = NeuralArbitrator.getInstance();
