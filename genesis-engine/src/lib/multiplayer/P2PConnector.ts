import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { blackboard, BlackboardContext } from '../genkit/context';

/**
 * Module L: P2P REALITY MESH (Ghost Mesh)
 * Objective: Sync the Physics Blackboard across multiple clients with R0 cost.
 * Logic: Uses Yjs CRDTs over WebRTC for serverless, conflict-free synchronization.
 */
export class P2PConnector {
    private static instance: P2PConnector;
    private doc: Y.Doc;
    private provider: WebrtcProvider | null = null;
    private ymap: Y.Map<any>;
    private isConnected: boolean = false;
    private peerCount: number = 0;
    private onSyncCallback?: (data: Partial<BlackboardContext>) => void;
    private peerChangeListeners: Set<(count: number) => void> = new Set();

    private constructor() {
        this.doc = new Y.Doc();
        this.ymap = this.doc.getMap('blackboard');

        // Observe changes from Yjs mesh (remote updates)
        this.ymap.observe((event) => {
            if (event.transaction.local) return; // Ignore changes we originated

            const remoteData: any = {};
            event.keysChanged.forEach(key => {
                remoteData[key] = this.ymap.get(key);
            });

            console.log('[P2P] Ghost Mesh Sync Received:', remoteData);
            
            // Update local blackboard without triggering a re-broadcast
            blackboard.update(remoteData);
            
            if (this.onSyncCallback) this.onSyncCallback(remoteData);
        });

        // Subscribe to local blackboard changes and push to mesh
        blackboard.subscribe((ctx) => {
            if (this.isConnected) {
                this.syncToMesh(ctx);
            }
        });
    }

    public static getInstance(): P2PConnector {
        if (!P2PConnector.instance) {
            P2PConnector.instance = new P2PConnector();
        }
        return P2PConnector.instance;
    }

    /**
     * Connect to a specific simulation room (The Ghost Mesh).
     */
    public async connect(roomId: string) {
        if (typeof window === 'undefined') return; // Client-side only
        if (this.isConnected) return;

        console.log(`[P2P] Joining Ghost Mesh: ${roomId}...`);
        
        // Initialize WebRTC Provider with public signaling servers
        this.provider = new WebrtcProvider(roomId, this.doc, {
            signaling: [
                'wss://signaling.yjs.dev',
                'wss://y-webrtc-signaling-eu.herokuapp.com',
                'wss://y-webrtc-signaling-us.herokuapp.com'
            ]
        } as any);

        this.provider.on('peers', (event: any) => {
            this.peerCount = event.webrtcPeers.length;
            this.peerChangeListeners.forEach(listener => listener(this.peerCount));
        });

        this.isConnected = true;
        return true;
    }

    /**
     * Sync local state to the Yjs Map.
     * Only sets keys that have actually changed to minimize traffic.
     */
    private syncToMesh(ctx: BlackboardContext) {
        this.doc.transact(() => {
            Object.entries(ctx).forEach(([key, value]) => {
                const currentYValue = this.ymap.get(key);
                // Simple equality check to avoid redundant updates
                if (JSON.stringify(currentYValue) !== JSON.stringify(value)) {
                    this.ymap.set(key, value);
                }
            });
        });
    }

    public onSync(callback: (data: Partial<BlackboardContext>) => void) {
        this.onSyncCallback = callback;
    }

    public onPeerChange(callback: (count: number) => void) {
        this.peerChangeListeners.add(callback);
        callback(this.peerCount);
        return () => this.peerChangeListeners.delete(callback);
    }

    public getPeerCount(): number {
        return this.peerCount;
    }

    public disconnect() {
        if (this.provider) {
            this.provider.destroy();
            this.provider = null;
        }
        this.isConnected = false;
        this.peerCount = 0;
    }
}

export const p2p = P2PConnector.getInstance();
