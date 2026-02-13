import { WorldState } from '../simulation/schema';

// Local type definition to avoid server-side schema imports
interface WorldRule {
    id: string;
    rule: string;
    description: string;
    grounding_source?: string;
    isActive: boolean;
}

export interface BlackboardContext {
    currentWorldState?: WorldState;
    worldRules: WorldRule[];
    currentPhysics: {
        gravity: { x: number; y: number; z: number };
        timeScale: number;
    };
    globalTemperature: number; // in Celsius
    environmentalState: 'STANDARD' | 'FROZEN' | 'VOLCANIC' | 'VACUUM';
    materialRegistry: Record<string, {
        brittleness: number;
        conductivity: number;
        density: number;
    }>;
    currentMetaphor: string | null;
    researchFindings: string | null;
    externalConstants: Record<string, number> | null;
    lastUserError: string | null;
    activeNodes: string[];
    complexity: 'fundamental' | 'standard' | 'expert';
    missionLogs: Array<{
        agent: string;
        message: string;
        type: 'INFO' | 'RESEARCH' | 'ERROR' | 'SUCCESS' | 'THINKING' | 'MANIFEST' | 'SYMBOLIC' | 'THOUGHT';
        timestamp: number;
    }>;
    streamingProgress: number; // 0-100
    manifestedEntities: string[]; // List of IDs/names already manifested in logs
    swarmTelemetry?: Record<string, {
        gpuTier: 'LOW' | 'MEDIUM' | 'HIGH' | 'RAY_TRACING';
        cpuCores: number;
        ram: number; // in GB
    }>;
    userVibe: {
        intensity: number; // 0-1 (Smoothness to Jerkiness)
        velocity: number;  // 0-1 (Speed of interaction)
        focus: { x: number; y: number }; // Normalized screen coords
    };
    xRayMode: boolean;
    latentHistory: string[]; // MODULE MLA: Compressed context (v21.5)
    consensusScore: number; // v33.0 (0-100)
    activeCitations: Array<{
        entityId: string;
        rule: string;
        status: 'VERIFIED' | 'VIOLATION';
        timestamp: number;
    }>;
    livingExamActive: boolean; // v32.5 Competitive Exams
}

class Blackboard {
    private static instance: Blackboard;
    private listeners: Set<(ctx: BlackboardContext) => void> = new Set();
    private logCounter = 0;
    private context: BlackboardContext = {
        worldRules: [],
        currentPhysics: { gravity: { x: 0, y: -9.81, z: 0 }, timeScale: 1 },
        globalTemperature: 25,
        environmentalState: 'STANDARD',
        materialRegistry: {
            'Steel': { brittleness: 0.1, conductivity: 0.9, density: 7850 },
            'Water': { brittleness: 0, conductivity: 0.6, density: 1000 },
        },
        currentMetaphor: null,
        researchFindings: null,
        externalConstants: null,
        lastUserError: null,
        activeNodes: [],
        complexity: 'standard',
        missionLogs: [],
        streamingProgress: 0,
        manifestedEntities: [],
        userVibe: { intensity: 0, velocity: 0, focus: { x: 0.5, y: 0.5 } },
        xRayMode: false,
        latentHistory: [],
        consensusScore: 100,
        activeCitations: [],
        livingExamActive: false
    };

    private constructor() { }

    public static getInstance(): Blackboard {
        if (!Blackboard.instance) {
            Blackboard.instance = new Blackboard();
        }
        return Blackboard.instance;
    }

    public log(agent: string, message: string, type: 'INFO' | 'RESEARCH' | 'ERROR' | 'SUCCESS' | 'THINKING' | 'MANIFEST' | 'SYMBOLIC' | 'THOUGHT' = 'INFO') {
        console.log(`[Blackboard][${type}] ${agent}: ${message}`);
        this.context.missionLogs.push({
            agent,
            message,
            type,
            timestamp: Date.now()
        });

        // v32.0 SWARM MIND: Broadcast thought streams if we are the host
        if (type === 'THOUGHT') {
            try {
                const { p2p } = require('../multiplayer/P2PConnector');
                p2p.broadcastThought(agent, message);
            } catch (e) {
                // P2P not initialized yet, skip
            }
        }

        // v21.5 CONTEXT COMPACTOR (Module MLA)
        this.logCounter++;
        if (this.logCounter >= 10) {
            this.logCounter = 0;
            this.compactContext();
        }

        // Keep only last 100 logs in context
        if (this.context.missionLogs.length > 100) {
            this.context.missionLogs.shift();
        }
        this.notify();
    }

    private async compactContext() {
        if (this.context.missionLogs.length < 5) return;
        
        console.log("[MLA] Triggering Context Compaction...");
        const { summarizeLogsLocally } = require('../ai/local-nano');
        const recentLogs = this.context.missionLogs.slice(-10).map(l => `${l.agent}: ${l.message}`);
        
        try {
            const summary = await summarizeLogsLocally(recentLogs);
            if (summary.success && summary.text) {
                this.context.latentHistory.push(summary.text);
                // Keep latent history manageable
                if (this.context.latentHistory.length > 20) this.context.latentHistory.shift();
                console.log("[MLA] Context compressed into latent space.");
            }
        } catch (e) {
            console.warn("[MLA] Compaction failed.", e);
        }
    }

    public updateStreaming(progress: number, entities: string[]) {
        console.log(`[Blackboard][STREAM] Progress: ${progress.toFixed(1)}% | Entities: ${entities.length}`);
        this.context.streamingProgress = progress;

        // Find new entities to log
        const newEntities = entities.filter(id => !this.context.manifestedEntities.includes(id));
        if (newEntities.length > 0) {
            newEntities.forEach(id => {
                this.log('Manifest', `✨ Manifested: ${id}`, 'MANIFEST');
            });
            this.context.manifestedEntities = [...this.context.manifestedEntities, ...newEntities];
        }

        this.notify();
    }

    public subscribe(listener: (ctx: BlackboardContext) => void) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notify() {
        this.listeners.forEach(l => l({ ...this.context }));
    }

    public update(patch: Partial<BlackboardContext>) {
        this.context = { ...this.context, ...patch };
        this.notify();
    }

    public updateFromWorldState(worldState: WorldState) {
        this.context.currentWorldState = worldState;
        if (worldState.environment) {
            this.context.currentPhysics = {
                gravity: worldState.environment.gravity,
                timeScale: worldState.environment.timeScale,
            };
        }
        if (worldState.mode === 'METAPHOR' || worldState.mode === 'VOXEL') {
            this.context.currentMetaphor = worldState.explanation;
        }
        this.notify();
    }

    public getContext(): BlackboardContext {
        return { ...this.context };
    }

    public registerMaterial(name: string, props: { brittleness: number; conductivity: number; density: number }) {
        this.context.materialRegistry[name] = props;
        this.notify();
    }

    /**
     * MODULE HUD: Register a living citation (v32.5)
     */
    public addCitation(entityId: string, rule: string, status: 'VERIFIED' | 'VIOLATION') {
        const citation = { entityId, rule, status, timestamp: Date.now() };
        this.context.activeCitations.push(citation);
        
        // Auto-purge citations after 10 seconds
        setTimeout(() => {
            this.context.activeCitations = this.context.activeCitations.filter(c => c !== citation);
            this.notify();
        }, 10000);
        
        this.notify();
    }

    public getSystemPromptFragment(): string {
        const ctx = this.context;
        const activeRules = ctx.worldRules.filter(r => r.isActive);
        return `
            SHARED CONTEXT (BLACKBOARD):
            - Current Gravity: x:${ctx.currentPhysics.gravity.x}, y:${ctx.currentPhysics.gravity.y}, z:${ctx.currentPhysics.gravity.z}
            - Time Scale: ${ctx.currentPhysics.timeScale}
            - Global Temperature: ${ctx.globalTemperature}°C
            - Environmental State: ${ctx.environmentalState}
            - Known Materials: ${Object.keys(ctx.materialRegistry).join(', ')}
            - Active Metaphor: ${ctx.currentMetaphor || 'None'}
            - Last Error: ${ctx.lastUserError || 'None'}
            - Complexity Level: ${ctx.complexity.toUpperCase()}
            - COMPRESSED HISTORY: ${ctx.latentHistory.join(' | ')}
            - ACTIVE WORLD RULES: ${activeRules.length > 0 ? activeRules.map(r => `[Rule ${r.id}: ${r.rule}]`).join(', ') : 'None'}
        `;
    }
}

export const blackboard = Blackboard.getInstance();
