import { p2p } from '../multiplayer/P2PConnector';
import { blackboard } from '../genkit/context';

/**
 * MODULE S: SWARM COMPUTE (Robin Hood Mesh)
 * Objective: Offload heavy physics (Module F - Fluid) to the strongest peer.
 * Strategy: Hierarchy Negotiation -> Compute Delegation -> State Streaming.
 */

interface SwarmMessage {
    type: 'COMPUTE_OFFER' | 'COMPUTE_ASSIGN' | 'PHYSICS_TICK';
    payload: any;
}

class SwarmCompute {
    private static instance: SwarmCompute;
    private capabilities = {
        gpuTier: 'LOW' as 'LOW' | 'MEDIUM' | 'HIGH' | 'RAY_TRACING',
        cpuCores: 4,
        ram: 4
    };

    private roles = {
        isPhysicsHost: false,
        isVisualHost: false // e.g., for heavy shader dreaming
    };

    public static getInstance() {
        if (!SwarmCompute.instance) {
            SwarmCompute.instance = new SwarmCompute();
        }
        return SwarmCompute.instance;
    }

    public async init() {
        if (typeof window === 'undefined') return;

        // 1. Detect Hardware Capabilities
        this.detectCapabilities();

        console.log(`[SwarmCompute] Device Telemetry: GPU=${this.capabilities.gpuTier} | CPU=${this.capabilities.cpuCores} | RAM=${this.capabilities.ram}GB`);
        console.log('[SwarmCompute] Initializing Blackboard Telemetry...');

        // 2. Announce to Mesh
        const peerId = p2p.getPeerId() || 'local';
        const currentTelemetry = blackboard.getContext().swarmTelemetry || {};
        
        blackboard.update({
            swarmTelemetry: {
                ...currentTelemetry,
                [peerId]: this.capabilities
            }
        });

        // 3. Listen for Swarm Hierarchy updates
        blackboard.subscribe((ctx) => {
            if (ctx.swarmTelemetry) {
                this.negotiateRoles(ctx);
            }
        });
    }

    private detectCapabilities() {
        // CPU
        this.capabilities.cpuCores = navigator.hardwareConcurrency || 4;

        // RAM
        // @ts-ignore - deviceMemory is experimental but useful
        this.capabilities.ram = (navigator as any).deviceMemory || 4;

        // GPU Tier Estimation (Heuristic)
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl');
        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                if (/nvidia|radeon|geforce/i.test(renderer)) {
                    this.capabilities.gpuTier = 'HIGH';
                } else if (/intel iris|apple m/i.test(renderer)) {
                    this.capabilities.gpuTier = 'MEDIUM';
                }
            }
        }
    }

    private negotiateRoles(ctx: any) {
        const telemetry = ctx.swarmTelemetry as Record<string, any>;
        if (!telemetry) return;

        const myPeerId = p2p.getPeerId() || 'local';
        let superiorCPUPeer = myPeerId;
        let superiorGPUPeer = myPeerId;

        const tiers = { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3, 'RAY_TRACING': 4 };

        Object.entries(telemetry).forEach(([peerId, caps]) => {
            // Physics Host Negotiation (CPU)
            if (caps.cpuCores > telemetry[superiorCPUPeer].cpuCores) {
                superiorCPUPeer = peerId;
            }

            // Visual Host Negotiation (GPU)
            const peerTier = tiers[caps.gpuTier as keyof typeof tiers] || 1;
            const currentLeaderTier = tiers[telemetry[superiorGPUPeer].gpuTier as keyof typeof tiers] || 1;
            if (peerTier > currentLeaderTier) {
                superiorGPUPeer = peerId;
            }
        });

        const isPhysicsHost = superiorCPUPeer === myPeerId;
        const isVisualHost = superiorGPUPeer === myPeerId;

        if (isPhysicsHost && !this.roles.isPhysicsHost) {
            console.log("[SwarmCompute] 🧠 I am now the PHYSICS HOST (Superior CPU).");
            blackboard.log('Swarm', 'Local node assumed Physics control.', 'SUCCESS');
        }
        
        if (isVisualHost && !this.roles.isVisualHost) {
            console.log("[SwarmCompute] 👁️ I am now the VISUAL HOST (Superior GPU).");
        }

        this.roles.isPhysicsHost = isPhysicsHost;
        this.roles.isVisualHost = isVisualHost;
    }

    public broadcastTick(particleData: Float32Array) {
        if (!this.roles.isPhysicsHost) return;

        // Quantize and stream particle data to clients via P2P
        // Using ephemeral events to avoid doc bloat
        p2p.broadcastVisualEvent({
            type: 'PHYSICS_TICK',
            payload: particleData.buffer // Sending raw buffer for performance
        });
    }

    public getIsHost() { return this.roles.isPhysicsHost; } // Legacy compat
    public getRoles() { return this.roles; }
}

export const swarmCompute = SwarmCompute.getInstance();
