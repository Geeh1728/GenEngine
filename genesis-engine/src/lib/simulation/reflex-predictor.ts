import { Vector3, Entity } from './schema';
import { predictIntentionalTrajectory } from '@/app/actions/reflex';

/**
 * THE ACTION-LATENT PREDICTOR (Module V - LingBot Reflex)
 * Objective: Eliminate perceived P2P lag by predicting the next 200ms of motion.
 * Hybrid Approach: Kalman Filter (Physics) + Gemma 3 4B (Intuition).
 */

export interface GhostPath {
    id: string;
    points: Vector3[];
    confidence: number;
}

class ReflexPredictor {
    private static instance: ReflexPredictor;
    private history: Map<string, { pos: Vector3, vel: Vector3, timestamp: number }[]> = new Map();
    private MAX_HISTORY = 5;

    public static getInstance() {
        if (!ReflexPredictor.instance) {
            ReflexPredictor.instance = new ReflexPredictor();
        }
        return ReflexPredictor.instance;
    }

    /**
     * Predicts the trajectory of an entity for the next 200ms.
     */
    public async predictTrajectory(entity: Entity): Promise<GhostPath> {
        const history = this.updateHistory(entity);
        
        // 1. Physics Prediction (Linear Extrapolation / Simple Kalman)
        const last = history[history.length - 1];
        const prev = history[history.length - 2] || last;
        
        const velocity = {
            x: (last.pos.x - prev.pos.x) / (last.timestamp - prev.timestamp || 1),
            y: (last.pos.y - prev.pos.y) / (last.timestamp - prev.timestamp || 1),
            z: (last.pos.z - prev.pos.z) / (last.timestamp - prev.timestamp || 1)
        };

        const ghostPoints: Vector3[] = [];
        for (let i = 1; i <= 5; i++) {
            const dt = i * 40; // 40ms steps (Total 200ms)
            ghostPoints.push({
                x: last.pos.x + velocity.x * dt,
                y: last.pos.y + velocity.y * dt,
                z: last.pos.z + velocity.z * dt
            });
        }

        // 2. Gemma Intuition (Reflex Node) - Server Action
        if (Math.abs(velocity.x) > 0.1 || Math.abs(velocity.y) > 0.1) {
            try {
                const result = await predictIntentionalTrajectory(
                    entity.name || 'Entity',
                    entity.shape,
                    velocity.x,
                    velocity.y
                );

                if (result.success && result.prediction) {
                    const intuition = result.prediction;
                    const finalTarget = ghostPoints[ghostPoints.length - 1];
                    ghostPoints[ghostPoints.length - 1] = {
                        x: finalTarget.x * 0.7 + intuition.x * 0.3,
                        y: finalTarget.y * 0.7 + intuition.y * 0.3,
                        z: finalTarget.z * 0.7 + intuition.z * 0.3
                    };
                }
            } catch (e) {
                // Fallback to pure physics if action fails
            }
        }

        return {
            id: entity.id,
            points: ghostPoints,
            confidence: 0.8
        };
    }

    private updateHistory(entity: Entity) {
        const list = this.history.get(entity.id) || [];
        list.push({ 
            pos: { ...entity.position }, 
            vel: { x: 0, y: 0, z: 0 }, 
            timestamp: Date.now() 
        });
        
        if (list.length > this.MAX_HISTORY) list.shift();
        this.history.set(entity.id, list);
        return list;
    }
}

export const reflexPredictor = ReflexPredictor.getInstance();