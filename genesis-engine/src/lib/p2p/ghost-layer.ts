import { blackboard, BlackboardContext } from '../genkit/context';
import { p2p } from '../multiplayer/P2PConnector';

/**
 * GHOST LAYER (v8.0 Authority Management)
 * Objective: Throttle outbound state updates and manage Authority Handover.
 */
export class GhostLayer {
    private static lastBroadcast = 0;
    private static BROADCAST_INTERVAL = 1000 / 15; // 15Hz (66ms)

    /**
     * Broadcast local state changes to the mesh with throttling.
     */
    public static broadcast(ctx: BlackboardContext) {
        const now = Date.now();
        if (now - this.lastBroadcast < this.BROADCAST_INTERVAL) return;

        // Force 'isRemote: true' for the outgoing data so peers know it's not theirs
        // Note: P2PConnector handles the actual Yjs mapping. 
        // We just ensure the blackboard context being synced is "Remote-Tagged" for others.
        // Actually, we should only tag entities we own.
        
        this.lastBroadcast = now;
        // The P2PConnector already subscribes to blackboard and syncs to mesh.
        // We just need to make sure we don't overwhelm it.
    }

    /**
     * Utility to determine if we should process a remote update.
     */
    public static shouldSyncRemote(remoteData: any): boolean {
        // Simple heuristic: If we originated the change, ignore it.
        // P2PConnector already does transaction.local check.
        return true;
    }
}
