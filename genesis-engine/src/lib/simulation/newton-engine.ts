import { Vector3 } from './schema';
import { blackboard } from '../genkit/context';
import { runPython } from '../python/pyodide';

/**
 * MODULE N: THE NEWTON ENGINE (Symbolic Regression)
 * Objective: Discover physical laws from simulation data.
 * Strategy: Track trajectories -> AI Regression -> Symbolic Verification.
 */

export interface DataPoint {
    t: number;
    pos: Vector3;
    vel: Vector3;
}

class NewtonEngine {
    private static instance: NewtonEngine;
    private buffer: Map<string, DataPoint[]> = new Map();
    private formulas: Map<string, { formula: string; confidence: number }> = new Map();
    private MAX_POINTS = 300; // ~5 seconds at 60fps
    private isAnalyzing = false;

    public static getInstance() {
        if (!NewtonEngine.instance) {
            NewtonEngine.instance = new NewtonEngine();
        }
        return NewtonEngine.instance;
    }

    /**
     * Gets the discovered formula for an entity.
     */
    public getFormula(id: string) {
        return this.formulas.get(id);
    }

    /**
     * Records a data point for an entity.
     */
    public record(id: string, point: DataPoint) {
        if (this.isAnalyzing) return;

        const points = this.buffer.get(id) || [];
        points.push(point);
        
        if (points.length > this.MAX_POINTS) points.shift();
        this.buffer.set(id, points);

        // Auto-trigger analysis if we have a full buffer and significant motion
        if (points.length === this.MAX_POINTS && this.hasSignificantMotion(points)) {
            this.analyze(id);
        }
    }

    private hasSignificantMotion(points: DataPoint[]): boolean {
        if (points.length < 2) return false;
        const start = points[0].pos;
        const end = points[points.length - 1].pos;
        const dist = Math.sqrt(
            Math.pow(end.x - start.x, 2) + 
            Math.pow(end.y - start.y, 2)
        );
        return dist > 2.0; // Moved at least 2 meters
    }

    /**
     * MODULE T-A: TEMPORAL ARCHAEOLOGY (v33.0 / v40.0)
     * Logs a physical failure event for causal proof generation.
     */
    public async logFailure(entityId: string, reason: string, data: any) {
        blackboard.log('Newton', `Physical failure detected: ${entityId} (${reason}). Initiating Causal Probe...`, 'RESEARCH');
        
        // 1. Generate Causal Proof via AI
        const proofRes = await fetch('/api/simulation/causal-proof', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entityId, reason, data }),
        });

        if (proofRes.ok) {
            const { proof, sensitivityVariable } = await proofRes.json();
            // Store the proof in the blackboard mission logs as a SYMBOLIC type
            blackboard.log('Newton', `CAUSAL PROOF [${entityId}]: ${proof}`, 'SYMBOLIC');

            // v40.0: Manifest Causal Ribbon
            if (sensitivityVariable) {
                blackboard.update({ 
                    lastAction: 'CAUSAL_RIBBON', 
                    causalData: { entityId, variable: sensitivityVariable } 
                });
            }
        }
    }

    /**
     * Discovers the formula using AI and verifies it with Pyodide.
     */
    public async analyze(entityId: string) {
        const points = this.buffer.get(entityId);
        if (!points || points.length < 50 || this.isAnalyzing) return;

        this.isAnalyzing = true;
        blackboard.log('Newton', `Analyzing trajectory for ${entityId}. Discovery in progress...`, 'THINKING');

        try {
            // 1. Prepare data for AI
            const sample = points.filter((_, i) => i % 10 === 0); // Downsample for context window
            const dataStr = JSON.stringify(sample.map(p => ({ t: p.t.toFixed(2), x: p.pos.x.toFixed(2), y: p.pos.y.toFixed(2) })));

            // 2. Call the Discovery Agent (DeepSeek-R1 via Server Action)
            const response = await fetch('/api/simulation/discover-law', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ trajectoryData: dataStr }),
            });

            if (response.ok) {
                const result = await response.json();
                const { formula, pythonVerification } = result;

                // 3. Verify via Pyodide
                const verification = await runPython(pythonVerification);
                
                if (verification?.result && Number(verification.result) > 0.98) {
                    blackboard.log('Astra', `Eureka! I've derived a law for your world: ${formula} (Confidence: ${verification.result})`, 'SUCCESS');
                    
                    this.formulas.set(entityId, { formula, confidence: Number(verification.result) });

                    // Clear buffer to avoid re-triggering immediately
                    this.buffer.delete(entityId);
                }
            }
        } catch (e) {
            console.error("[Newton Engine] Discovery failed:", e);
        } finally {
            this.isAnalyzing = false;
        }
    }
}

export const newtonEngine = NewtonEngine.getInstance();
