import { p2p } from '../multiplayer/P2PConnector';

/**
 * SOVEREIGN MARKETPLACE (P2P Discovery Layer)
 * Objective: Decentralized reality sharing via Ghost Mesh broadcasting.
 * Strategy: Listen for peer-emitted 'Reality Signatures' without central coordination.
 */

export interface RealitySignature {
    id: string;
    name: string;
    topic: string;
    peerId: string;
}

class DiscoveryLayer {
    private static instance: DiscoveryLayer;
    private discoveredRealities: Map<string, RealitySignature> = new Map();

    public static getInstance() {
        if (!DiscoveryLayer.instance) {
            DiscoveryLayer.instance = new DiscoveryLayer();
        }
        return DiscoveryLayer.instance;
    }

    /**
     * Broadcasts the current world's signature to the local mesh.
     */
    public broadcast(name: string, topic: string) {
        const signature: RealitySignature = {
            id: Math.random().toString(36).substring(7),
            name,
            topic,
            peerId: p2p.getPeerId()
        };
        
        // Emit via Yjs/P2P broadcast mechanism
        p2p.broadcastEvent('REALITY_SIGNAL', signature);
    }

    /**
     * Listens for incoming signatures from other peers.
     */
    public startListening(callback: (realities: RealitySignature[]) => void) {
        p2p.onEvent('REALITY_SIGNAL', (sig: RealitySignature) => {
            this.discoveredRealities.set(sig.id, sig);
            callback(Array.from(this.discoveredRealities.values()));
        });
    }
}

export const discovery = DiscoveryLayer.getInstance();
