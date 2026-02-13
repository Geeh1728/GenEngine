import { executeHiveSwarmAction } from '@/app/actions/swarm';
import { blackboard } from '../genkit/context';

/**
 * MODULE N: NEURAL SPECULATION (Pre-Cognitive Swarm)
 * Objective: Predict user intent 'as-you-type' and pre-generate assets.
 * Strategy: Speculative execution of worker bee swarms.
 */

class NeuralSpeculator {
    private static instance: NeuralSpeculator;
    private speculationBuffer: Map<string, any> = new Map();
    private activeKeywords = ['build', 'create', 'simulate', 'make', 'add'];

    public static getInstance() {
        if (!NeuralSpeculator.instance) {
            NeuralSpeculator.instance = new NeuralSpeculator();
        }
        return NeuralSpeculator.instance;
    }

    /**
     * Monitors input and triggers speculative swarms if high-confidence intent is found.
     */
    public async speculativeProcess(input: string) {
        if (typeof window === 'undefined') return;
        
        const text = input.toLowerCase();
        const hasKeyword = this.activeKeywords.some(kw => text.includes(kw));
        const isLongEnough = text.length > 15;

        if (hasKeyword && isLongEnough && !this.speculationBuffer.has(text)) {
            console.log(`[Speculator] Pre-cognitive trigger detected: "${text}"`);
            
            // Trigger a 'Silent' swarm in the background via Server Action
            const swarmPromise = executeHiveSwarmAction(text, blackboard.getSystemPromptFragment());
            this.speculationBuffer.set(text, swarmPromise);
            
            // Auto-purge buffer if it gets too large
            if (this.speculationBuffer.size > 5) {
                const firstKey = this.speculationBuffer.keys().next().value;
                if (firstKey) this.speculationBuffer.delete(firstKey);
            }
        }
    }

    /**
     * Attempts to retrieve a pre-generated result from the speculative buffer.
     */
    public async consumeSpeculation(input: string) {
        const text = input.toLowerCase();
        if (this.speculationBuffer.has(text)) {
            console.log(`[Speculator] Cache Hit! Manifesting reality from speculative buffer.`);
            const result = await this.speculationBuffer.get(text);
            this.speculationBuffer.delete(text);
            return result.success ? result.data : null;
        }
        return null;
    }
}

export const speculator = NeuralSpeculator.getInstance();
