import { storeVisualEcho, queryVisualEchoes, purgeOldEchoes } from '../db/pglite';
import { getEmbedding } from '@/app/actions';

/**
 * MODULE V: VISUAL ECHO BUFFER (Project Astra Heist)
 * Objective: Persistent spatial memory using temporal vector embeddings.
 */
class VisualEchoBuffer {
    private static instance: VisualEchoBuffer;
    private interval: NodeJS.Timeout | null = null;

    public static getInstance() {
        if (!VisualEchoBuffer.instance) {
            VisualEchoBuffer.instance = new VisualEchoBuffer();
        }
        return VisualEchoBuffer.instance;
    }

    /**
     * Starts the automatic visual snapshot loop.
     * Captures every 2 seconds during active reality scanning.
     */
    public start() {
        if (this.interval) return;
        
        this.interval = setInterval(async () => {
            await this.captureSnapshot();
            await purgeOldEchoes();
        }, 2000);
    }

    public stop() {
        if (this.interval) clearInterval(this.interval);
        this.interval = null;
    }

    private async captureSnapshot() {
        // In a real v13.5 implementation, we would grab the current frame from RealityLens
        // For now, we simulate by generating a temporal context string
        const temporalContext = `View at ${new Date().toISOString()}. Current entities in frustum: unknown.`;
        
        const embResult = await getEmbedding(temporalContext);
        if (embResult.success) {
            await storeVisualEcho(embResult.embedding, {
                timestamp: Date.now(),
                type: 'TEMPORAL_CONTEXT'
            });
        }
    }

    /**
     * Queries Astra's "Visual Memory" for relevant historical context.
     */
    public async recall(query: string) {
        const embResult = await getEmbedding(query);
        if (embResult.success) {
            return await queryVisualEchoes(embResult.embedding);
        }
        return [];
    }
}

export const visualEcho = VisualEchoBuffer.getInstance();
