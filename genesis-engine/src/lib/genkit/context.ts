import { WorldState } from '../simulation/schema';

export interface BlackboardContext {
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
        type: 'INFO' | 'RESEARCH' | 'ERROR' | 'SUCCESS' | 'THINKING';
        timestamp: number;
    }>;
}

class Blackboard {
    private static instance: Blackboard;
    private listeners: Set<(ctx: BlackboardContext) => void> = new Set();
    private context: BlackboardContext = {
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
    };

    private constructor() {}

    public static getInstance(): Blackboard {
        if (!Blackboard.instance) {
            Blackboard.instance = new Blackboard();
        }
        return Blackboard.instance;
    }

    public log(agent: string, message: string, type: 'INFO' | 'RESEARCH' | 'ERROR' | 'SUCCESS' | 'THINKING' = 'INFO') {
        this.context.missionLogs.push({
            agent,
            message,
            type,
            timestamp: Date.now()
        });
        // Keep only last 100 logs in context
        if (this.context.missionLogs.length > 100) {
            this.context.missionLogs.shift();
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

    public getSystemPromptFragment(): string {
        const ctx = this.context;
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
        `;
    }
}

export const blackboard = Blackboard.getInstance();
