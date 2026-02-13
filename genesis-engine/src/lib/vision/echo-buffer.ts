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
        // Production: Extracting real structural context from the active simulation.
        const { ecsWorld } = await import('../ecs/world');
        const entityLabels = ecsWorld.entities
            .filter(e => !e.isHidden)
            .map(e => `${e.selectable.name || e.id} at [${e.position.x.toFixed(1)}, ${e.position.y.toFixed(1)}]`)
            .join(', ');

        const temporalContext = `Astra Frame: ${new Date().toISOString()}. Visible: ${entityLabels || 'Void'}.`;
        
        const embResult = await getEmbedding(temporalContext);
        if (embResult.success) {
            await storeVisualEcho(embResult.embedding, {
                timestamp: Date.now(),
                type: 'TEMPORAL_CONTEXT',
                entities: entityLabels
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

    /**
     * MODULE ECHO: Temporal Object Recall (v35.0)
     * Recalls a specific object's state and returns its structural data.
     */
    public async recallObject(query: string) {
        console.log(`[VisualEcho] Recalling temporal signature for: ${query}`);
        const results = await this.recall(query);
        if (results && results.length > 0) {
            // Return the most relevant frame's entity data
            return results[0]; 
        }
        return null;
    }
}

export const visualEcho = VisualEchoBuffer.getInstance();
