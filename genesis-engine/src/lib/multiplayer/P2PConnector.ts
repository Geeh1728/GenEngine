import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { blackboard, BlackboardContext } from '../genkit/context';
import { sfx } from '../sound/SoundManager';

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
    private eventListeners: Map<string, Set<(data: any) => void>> = new Map();

    private lastBroadcast = 0;
    private BROADCAST_INTERVAL = 1000 / 15; // 15Hz

    private constructor() {
        this.doc = new Y.Doc();
        this.ymap = this.doc.getMap('blackboard');

        // Observe changes from Yjs mesh (remote updates)
        this.ymap.observe((event) => {
            if (event.transaction.local) return; // Ignore changes we originated

            const remoteData: any = {};
            event.keysChanged.forEach(key => {
                let data = this.ymap.get(key);
                
                // Trigger registered event listeners
                const listeners = this.eventListeners.get(key);
                if (listeners) {
                    listeners.forEach(cb => cb(data));
                }

                // MODULE A-S: Acoustic Synchronization (Ghost Mesh)
                if (key === 'audio_event' && data) {
                    // Trigger ephemeral audio event from remote peer
                    if (data.timestamp > Date.now() - 2000) { // Only play recent events
                        sfx.playFrequency(data.frequency, data.type, data.amplitude);
                    }
                    return; 
                }

                // AUTHORITY & SECURITY LOGIC: 
                // 1. Mark entities as remote
                if (key === 'currentWorldState' && data) {
                    if (data.entities) {
                        data.entities = data.entities.map((e: any) => ({
                            ...e,
                            isRemote: true,
                            // SECURITY: Strip executable shader code from remote peers
                            shaderCode: undefined 
                        }));
                    }
                    // SECURITY: Strip arbitrary execution fields from remote peers
                    data.custom_canvas_code = undefined;
                    data.python_code = undefined;
                }
                
                remoteData[key] = data;
            });

            if (Object.keys(remoteData).length > 0) {
                console.log('[P2P] Ghost Mesh Sync Received:', Object.keys(remoteData));
                // Update local blackboard without triggering a re-broadcast
                blackboard.update(remoteData);
                if (this.onSyncCallback) this.onSyncCallback(remoteData);
            }
        });

        // CENTRAL SUBSCRIPTION: Managed by connect/disconnect to save cycles
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

        console.log(`[P2P] Initializing Edge-Signaling Selector for ${roomId}...`);
        
        const defaultSignaling = [
            'wss://signaling.yjs.dev',
            'wss://y-webrtc-signaling-eu.herokuapp.com',
            'wss://y-webrtc-signaling-us.herokuapp.com'
        ];

        const customSignaling = process.env.NEXT_PUBLIC_SIGNALING_URL;
        const signalingServers = customSignaling ? [customSignaling, ...defaultSignaling] : defaultSignaling;

        const fastestServer = await Promise.race(signalingServers.map(async (url) => {
            const start = Date.now();
            try {
                const ws = new WebSocket(url);
                return new Promise<string>((resolve) => {
                    ws.onopen = () => {
                        const rtt = Date.now() - start;
                        console.log(`[P2P] Ping ${url}: ${rtt}ms`);
                        ws.close();
                        resolve(url);
                    };
                    ws.onerror = () => {};
                });
            } catch (e) {
                return signalingServers[0];
            }
        })) as string;

        console.log(`[P2P] Selected Edge Node: ${fastestServer}`);
        
        this.provider = new WebrtcProvider(roomId, this.doc, {
            signaling: [fastestServer, ...signalingServers.filter(s => s !== fastestServer)]
        } as any);

        this.provider.on('peers', (event: any) => {
            this.peerCount = event.webrtcPeers.length;
            this.peerChangeListeners.forEach(listener => listener(this.peerCount));
        });

        // Activate Outbound Sync
        blackboard.subscribe((ctx) => {
            if (this.isConnected) {
                this.syncToMesh(ctx);
            }
        });

        this.isConnected = true;
        return true;
    }

    /**
     * Broadcast a generic event to the mesh.
     */
    public broadcastEvent(key: string, payload: any) {
        if (!this.isConnected) return;
        this.doc.transact(() => {
            this.ymap.set(key, {
                ...payload,
                timestamp: Date.now(),
                origin: this.doc.clientID
            });
        });
    }

    /**
     * Broadcast an ephemeral audio event to the mesh.
     */
    public broadcastAudioEvent(type: 'TRIGGER' | 'IMPACT' | 'TENSION', frequency: number, amplitude: number) {
        if (!this.isConnected) return;
        
        this.doc.transact(() => {
            this.ymap.set('audio_event', {
                type,
                frequency,
                amplitude,
                timestamp: Date.now(),
                origin: this.doc.clientID
            });
        });
    }

    /**
     * Sync local state to the Yjs Map.
     * Only sets keys that have actually changed to minimize traffic.
     * Optimized with 15Hz Throttling.
     */
    private syncToMesh(ctx: BlackboardContext) {
        const now = Date.now();
        if (now - this.lastBroadcast < this.BROADCAST_INTERVAL) return;
        this.lastBroadcast = now;

        this.doc.transact(() => {
            Object.entries(ctx).forEach(([key, value]) => {
                const currentYValue = this.ymap.get(key);
                
                // Do NOT broadcast remote entities back to the mesh
                // (Prevents feedback loops)
                if (key === 'currentWorldState' && value && (value as any).entities) {
                    const localEntities = (value as any).entities.filter((e: any) => !e.isRemote);
                    if (localEntities.length === 0 && (value as any).entities.length > 0) return;
                }

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

    public onEvent(key: string, callback: (data: any) => void) {
        if (!this.eventListeners.has(key)) {
            this.eventListeners.set(key, new Set());
        }
        this.eventListeners.get(key)!.add(callback);
        return () => this.eventListeners.get(key)?.delete(callback);
    }

    public onPeerChange(callback: (count: number) => void) {
        this.peerChangeListeners.add(callback);
        callback(this.peerCount);
        return () => this.peerChangeListeners.delete(callback);
    }

    public getPeerCount(): number {
        return this.peerCount;
    }

    public getPeerId(): string {
        return this.doc.clientID.toString();
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
