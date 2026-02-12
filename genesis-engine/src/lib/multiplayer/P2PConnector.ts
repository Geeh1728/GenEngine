import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { blackboard, BlackboardContext } from '../genkit/context';
import { sfx } from '../sound/SoundManager';
import { getResidueByHash, storeResidue } from '../db/residue';
import { neuralMap } from '../storage/neural-map';
import { arbitrator } from '../simulation/arbitrator';

/** Visual event interface for P2P mesh synchronization */
interface VisualEvent {
    type: string;
    timestamp: number;
    origin: number;
    [key: string]: unknown;
}

export type SimulationRole = 'HOST' | 'FLUID_WORKER' | 'RIGID_WORKER' | 'BEHAVIOR_WORKER' | 'REPLICA';

/**
 * Module Σ: NEURAL HEGEMONY (v35.0)
 * Objective: Sync the Physics Blackboard and Collective Residue across the Ghost Mesh.
 * Logic: Uses Yjs CRDTs over WebRTC for serverless, conflict-free synchronization.
 */
export class P2PConnector {
    private static instance: P2PConnector;
    private doc: Y.Doc;
    private provider: WebrtcProvider | null = null;
    private ymap: Y.Map<unknown>;
    private yevents: Y.Array<VisualEvent>;
    private isConnected: boolean = false;
    private peerCount: number = 0;
    private onSyncCallback?: (data: Partial<BlackboardContext>) => void;
    private visualEventListeners: Set<(event: VisualEvent) => void> = new Set();
    private peerChangeListeners: Set<(count: number) => void> = new Set();
    private eventListeners: Map<string, Set<(data: unknown) => void>> = new Map();

    private lastHeartbeat: Map<string, number> = new Map();
    private heartbeatInterval: any = null;
    private checkAliveInterval: any = null;
    private HEARTBEAT_RATE = 1000;
    private PEER_TIMEOUT = 5000;

    private lastBroadcast = 0;
    private BROADCAST_INTERVAL = 50; // 20Hz (v60.0 Neural Hegemony)

    private isHost: boolean = false;
    private hostId: string | null = null;
    private currentRole: SimulationRole = 'REPLICA';
    private performanceLevel: 'LOW' | 'HIGH' = 'HIGH';

    private lastIncomingSync = 0;
    private incomingUpdateBuffer: Partial<BlackboardContext> = {};
    private INCOMING_THROTTLE = 33; // ~30Hz max update rate

    private constructor() {
        this.doc = new Y.Doc();
        this.ymap = this.doc.getMap('blackboard');
        this.yevents = this.doc.getArray('ephemeral_events');

        // Check local performance
        if (typeof window !== 'undefined' && navigator.hardwareConcurrency < 4) {
            this.performanceLevel = 'LOW';
            console.log("[Sovereignty] Low-end hardware detected. Enabling Robin Hood Mesh protocols.");
        }

        // Observe changes from Yjs mesh (remote updates)
        this.ymap.observe(async (event) => {
            if (event.transaction.local) return; // Ignore changes we originated

            event.changes.keys.forEach(async (change, key) => {
                if (change.action === 'add' || change.action === 'update') {
                    const newValue = this.ymap.get(key);

                    // v60.0 GOLD: P2P Security/Validation Hijack
                    if (key === 'currentWorldState') {
                        const arbResult = await arbitrator.validate(newValue, 'P2P');
                        if (arbResult.success) {
                            this.incomingUpdateBuffer[key as keyof BlackboardContext] = arbResult.state as any;
                        } else {
                            console.warn(`[Hegemony] Rejected malicious/unstable P2P state: ${arbResult.error}`);
                            return;
                        }
                    } else {
                        this.incomingUpdateBuffer[key as keyof BlackboardContext] = newValue as any;
                    }
                }
            });

            this.flushIncomingUpdates();
        });

        // SYNC THE RIPPLES: Observe ephemeral events
        this.yevents.observe((event) => {
            if (event.transaction.local) return;

            // Handle remote events (like piano key hits or voxel bursts)
            event.changes.added.forEach((item) => {
                const data = item.content.getContent();
                data.forEach((val: any) => {
                    if (val.type === 'HEARTBEAT') {
                        // Ghost Protocol: Acknowledge Life
                        this.lastHeartbeat.set(val.origin, Date.now());
                        
                        // Track Host ID
                        if (val.isHost) this.hostId = val.origin;
                    } else if (val.type === 'COMPUTE_DELEGATION' && this.isHost) {
                        // ROBIN HOOD: Host receives request to process physics for a slow peer
                        this.handleComputeDelegation(val);
                    } else if (val.type === 'RESIDUE_HASH_ANNOUNCE') {
                        this.handleResidueAnnounce(val);
                    } else if (val.type === 'REALITY_ANNOUNCE') {
                        // v55.0 SOVEREIGN DISCOVERY
                        this.eventListeners.get('REALITY_DISCOVERED')?.forEach(cb => cb(val));
                    } else if (val.type === 'ASTRA_DREAMS_SYNC') {
                        // v50.0 NEURAL HEGEMONY
                        this.handleAstraDreamsSync(val);
                    } else if (val.type === 'RESIDUE_REQUEST' && val.target === this.doc.clientID) {
                        this.handleResidueRequest(val);
                    } else if (val.type === 'RESIDUE_FULFILL' && val.target === this.doc.clientID) {
                        this.handleResidueFulfill(val);
                    } else if (val.type === 'NEURALMAP_HASH_ANNOUNCE') {
                        this.handleNeuralMapAnnounce(val);
                    } else if (val.type === 'NEURALMAP_REQUEST' && val.target === this.doc.clientID) {
                        this.handleNeuralMapRequest(val);
                    } else if (val.type === 'NEURALMAP_FULFILL' && val.target === this.doc.clientID) {
                        this.handleNeuralMapFulfill(val);
                    } else {
                        this.visualEventListeners.forEach(cb => cb(val));
                    }
                });
            });
        });

        // CENTRAL SUBSCRIPTION: Managed by connect/disconnect to save cycles
    }

    /**
     * Throttled application of remote updates to prevent UI churn.
     */
    private flushIncomingUpdates() {
        const now = Date.now();
        if (now - this.lastIncomingSync < this.INCOMING_THROTTLE) {
            // Schedule if not already scheduled
            if (!this.checkAliveInterval) { // Re-using existing timer var logic pattern, or just use setTimeout
                 setTimeout(() => this.flushIncomingUpdates(), this.INCOMING_THROTTLE);
            }
            return;
        }
        
        if (Object.keys(this.incomingUpdateBuffer).length === 0) return;

        this.lastIncomingSync = now;
        const batch = { ...this.incomingUpdateBuffer };
        this.incomingUpdateBuffer = {}; // Clear buffer

        blackboard.update(batch);
        if (this.onSyncCallback) this.onSyncCallback(batch);
    }

    /**
     * MODULE Σ: COLLECTIVE RESIDUE SYNC
     * If we see a hash we don't have, request the full proof.
     */
    private async handleResidueAnnounce(event: { hash: string, scenario: string, origin: number }) {
        const { hash, scenario } = event;
        const local = await getResidueByHash(hash);
        
        if (!local) {
            console.log(`[Hegemony] Unknown Residue detected: ${scenario}. Requesting from peer ${event.origin}...`);
            this.broadcastVisualEvent({
                type: 'RESIDUE_REQUEST',
                hash,
                target: event.origin
            });
        }
    }

    private async handleResidueRequest(event: { hash: string, origin: number }) {
        const { hash } = event;
        const residue = await getResidueByHash(hash);
        
        if (residue) {
            console.log(`[Hegemony] Fulfilling residue request for hash: ${hash.substring(0, 8)}`);
            this.broadcastVisualEvent({
                type: 'RESIDUE_FULFILL',
                residue,
                target: event.origin
            });
        }
    }

    private async handleResidueFulfill(event: { residue: any, origin: number }) {
        const { residue } = event;
        console.log(`[Hegemony] Absorbing peer residue: ${residue.scenario}`);
        await storeResidue({
            scenario: residue.scenario,
            structuralData: residue.structuralData,
            outcome: residue.outcome,
            failureReason: residue.failureReason,
            consensusScore: residue.consensusScore || 100
        });
        
        // v35.0: Trigger event for Astra
        const listeners = this.eventListeners.get('RESIDUE_ABSORBED');
        if (listeners) {
            listeners.forEach(cb => cb(residue));
        }

        sfx.playPing();
    }

    private handleAstraDreamsSync(event: { dreams: any[], origin: number }) {
        console.log(`[Hegemony] Synchronizing Astra's Dreams from peer ${event.origin}...`);
        blackboard.update({
            currentWorldState: {
                ...blackboard.getContext().currentWorldState!,
                dream_ghosts: event.dreams
            } as any
        });
    }

    /**
     * MODULE Σ: NEURAL HEGEMONY
     * Broadcasts speculative paths (Astra's Dreams) to the mesh.
     */
    public broadcastAstraDreams(dreams: any[]) {
        if (!this.isConnected) return;
        this.broadcastVisualEvent({
            type: 'ASTRA_DREAMS_SYNC',
            dreams
        });
    }

    private async handleNeuralMapFulfill(event: any) {
        const { key, entry } = event;
        neuralMap.absorbEntry(key, entry);
        sfx.playPing();
    }

    private async handleNeuralMapAnnounce(event: any) {
        const { signatures } = event;
        const localEntries = neuralMap.getAllEntries();
        const localSignatures = Object.keys(localEntries);

        for (const sig of signatures) {
            if (!localSignatures.includes(sig)) {
                console.log(`[NeuralMap] Peer has unknown signature: ${sig}. Requesting...`);
                this.broadcastVisualEvent({
                    type: 'NEURALMAP_REQUEST',
                    key: sig,
                    target: event.origin
                });
            }
        }
    }

    private async handleNeuralMapRequest(event: any) {
        const { key } = event;
        const entry = (neuralMap.getAllEntries() as any)[key];
        
        if (entry) {
            console.log(`[NeuralMap] Fulfilling request for: ${key}`);
            this.broadcastVisualEvent({
                type: 'NEURALMAP_FULFILL',
                key,
                entry,
                target: event.origin
            });
        }
    }

    /**
     * MODULE Σ: NEURALMAP SYNC
     * Broadcasts local physical signatures to peers.
     */
    public syncNeuralMap() {
        if (!this.isConnected) return;
        const entries = neuralMap.getAllEntries();
        const signatures = Object.keys(entries);
        
        console.log(`[NeuralMap] Synchronizing ${signatures.length} local signatures with the Mesh.`);
        this.broadcastVisualEvent({
            type: 'NEURALMAP_HASH_ANNOUNCE',
            signatures
        });
    }

    /**
     * Announces a locally stored residue to the mesh.
     */
    public announceResidue(hash: string, scenario: string) {
        if (!this.isConnected) return;
        this.broadcastVisualEvent({
            type: 'RESIDUE_HASH_ANNOUNCE',
            hash,
            scenario
        });
    }

    /**
     * MODULE Σ: SOVEREIGN REALITY DISCOVERY
     * Broadcasts the current reality state to the mesh.
     */
    public announceReality(scenario: string, mode: string) {
        if (!this.isConnected) return;
        this.broadcastVisualEvent({
            type: 'REALITY_ANNOUNCE',
            scenario,
            mode,
            peerId: this.doc.clientID
        });
    }

    /**
     * MODULE L: ROBIN HOOD DELEGATION
     * If this device is slow, send physics intent to host instead of local worker.
     */
    public async delegateCompute(intent: string) {
        if (this.performanceLevel === 'HIGH' || !this.hostId) return false;

        console.log(`[Sovereignty] Delegating intent to Host (${this.hostId}): ${intent}`);
        this.broadcastVisualEvent({
            type: 'COMPUTE_DELEGATION',
            intent,
            target: this.hostId
        });
        return true;
    }

    private handleComputeDelegation(event: any) {
        console.log(`[Sovereignty] Robin Hood: Processing delegated task from ${event.origin}`);
        // This will trigger the local orchestrator/physicist and broadcast the result back via Yjs
        // The local blackboard.update will handle the rest.
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
                    ws.onerror = () => { };
                });
            } catch (e) {
                return signalingServers[0];
            }
        })) as string;

        console.log(`[P2P] Selected Edge Node: ${fastestServer}`);

        try {
            this.provider = new WebrtcProvider(roomId, this.doc, {
                signaling: [fastestServer, ...signalingServers.filter(s => s !== fastestServer)]
            } as any);

            this.provider.on('peers', (event: any) => {
                this.peerCount = event.webrtcPeers.length;
                this.peerChangeListeners.forEach(listener => listener(this.peerCount));
            });

            this.provider.on('status', (event: any) => {
                if (event.status === 'connected') {
                    console.log("[P2P] Neural Hive Link Established.");
                } else if (event.status === 'disconnected') {
                    console.warn("[P2P] Signaling Lost. Engaging Local Sovereignty Mode.");
                }
            });
        } catch (err) {
            console.error("[P2P] Neural Hive initialization failed. Running in Standalone Sovereignty.", err);
            // Fallback: We are still "connected" locally
        }

        // Activate Outbound Sync
        blackboard.subscribe((ctx) => {
            if (this.isConnected) {
                this.syncToMesh(ctx);
            }
        });

        this.startGhostProtocol();

        this.isConnected = true;
        this.syncNeuralMap(); // v35.0: Initial knowledge sync
        return true;
    }

    private startGhostProtocol() {
        // 1. Beat: Pulse "I am alive" to the mesh
        this.heartbeatInterval = setInterval(() => {
            this.broadcastVisualEvent({ 
                type: 'HEARTBEAT', 
                origin: this.doc.clientID,
                isHost: this.isHost
            });

            // HOST ELECTION: Lowest clientID becomes the host (Sovereignty)
            const allPeers = Array.from(this.lastHeartbeat.keys()).map(id => parseInt(id)).concat([this.doc.clientID]);
            const minId = Math.min(...allPeers);
            const nextIsHost = this.doc.clientID === minId;
            
            if (nextIsHost !== this.isHost) {
                this.isHost = nextIsHost;
                console.log(`[Sovereignty] ${this.isHost ? 'I am now the HOST.' : 'I am now a REPLICA.'}`);
                this.negotiateRole(allPeers.length);
            }
        }, this.HEARTBEAT_RATE);

        // 2. Listen: Check for dead peers
        this.checkAliveInterval = setInterval(() => {
            const now = Date.now();
            this.lastHeartbeat.forEach((lastSeen, peerId) => {
                if (now - lastSeen > this.PEER_TIMEOUT) {
                    console.warn(`[GhostProtocol] Peer ${peerId} flatlined. Removing from active set.`);
                    this.lastHeartbeat.delete(peerId);
                    this.peerCount = Math.max(0, this.peerCount - 1);
                    this.peerChangeListeners.forEach(l => l(this.peerCount));
                }
            });
        }, this.HEARTBEAT_RATE);
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
                if (key === 'currentWorldState' && value && typeof value === 'object' && 'entities' in value) {
                    const ws = value as { entities?: Array<{ isRemote?: boolean }> };
                    const entities = ws.entities ?? [];
                    const localEntities = entities.filter(e => !e.isRemote);
                    if (localEntities.length === 0 && entities.length > 0) return;
                }

                // PHYSICS DELEGATION: Only Host broadcasts global environment
                if (key === 'currentPhysics' && !this.isHost) return;

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

    public onVisualEvent(callback: (event: any) => void) {
        this.visualEventListeners.add(callback);
        return () => this.visualEventListeners.delete(callback);
    }

    /**
     * Broadcast a visual event (ripple, burst) to all peers.
     */
    public broadcastVisualEvent(event: any) {
        if (!this.isConnected) return;

        this.doc.transact(() => {
            this.yevents.push([{
                ...event,
                timestamp: Date.now(),
                origin: this.doc.clientID
            }]);

            // EPHEMERAL PURGE: Keep only the last 50 events to prevent doc bloat
            if (this.yevents.length > 100) {
                this.yevents.delete(0, 50);
            }
        });
    }

    /**
     * MODULE C: SWARM MIND (v32.0)
     * Broadcasts a thought chunk (e.g. <think> tag content) to replicas.
     */
    public broadcastThought(agent: string, thought: string) {
        if (!this.isConnected || !this.isHost) return;
        this.broadcastVisualEvent({
            type: 'THOUGHT_STREAM',
            agent,
            content: thought
        });
    }

    /**
     * MODULE Σ: COLLECTIVE RESONANCE (v60.0)
     * Propagates a shatter event to all peers when dissonance is detected locally.
     */
    public broadcastShatter(resonance: number) {
        if (!this.isConnected) return;
        console.warn(`[Hegemony] Broadcasting Collective Shatter Event (Resonance: ${resonance.toFixed(2)})`);
        this.broadcastVisualEvent({
            type: 'COLLECTIVE_SHATTER',
            resonance
        });
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

    /**
     * MODULE R-S: REALITY SHARDING (v33.0)
     * Assigns specific physics sub-systems to this peer.
     */
    public negotiateRole(peerCount: number) {
        if (this.isHost) {
            this.currentRole = 'HOST';
            return;
        }

        // Sharding Logic based on peer index
        const allPeers = Array.from(this.lastHeartbeat.keys()).map(id => parseInt(id)).concat([this.doc.clientID]).sort();
        const myIndex = allPeers.indexOf(this.doc.clientID);

        if (this.performanceLevel === 'HIGH') {
            if (myIndex === 1) this.currentRole = 'FLUID_WORKER';
            else if (myIndex === 2) this.currentRole = 'RIGID_WORKER';
            else this.currentRole = 'BEHAVIOR_WORKER';
        } else {
            this.currentRole = 'REPLICA';
        }

        console.log(`[Sharding] Assigned role: ${this.currentRole}`);
    }

    public disconnect() {
        if (this.provider) {
            this.provider.destroy();
            this.provider = null;
        }
        clearInterval(this.heartbeatInterval);
        clearInterval(this.checkAliveInterval);

        this.isConnected = false;
        this.peerCount = 0;
        this.lastHeartbeat.clear();
    }
}

export const p2p = P2PConnector.getInstance();
