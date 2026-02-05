import { Entity, WorldState } from './schema';
import * as THREE from 'three';
import { blackboard } from '../genkit/context';
import { runNeuralRCA } from '@/app/actions/sentinel';

/**
 * THE UNBREAKABLE SENTINEL (Genesis v14.0)
 * Objective: Treat collision as a 'Process' and provide Neural Root-Cause Analysis (RCA).
 */

interface MetaParticle {
    id: string;
    entityAId: string;
    entityBId: string;
    framesRemaining: number;
    storedEnergy: number;
    initialRelativeVelocity: THREE.Vector3;
}

class CollisionSentinel {
    private static instance: CollisionSentinel;
    private activeProcesses: Map<string, MetaParticle> = new Map();
    private history: WorldState[] = [];
    private MAX_HISTORY = 5;
    private MAX_PROCESS_FRAMES = 3;

    public static getInstance() {
        if (!CollisionSentinel.instance) {
            CollisionSentinel.instance = new CollisionSentinel();
        }
        return CollisionSentinel.instance;
    }

    /**
     * Monitors and stabilizes collisions, and performs RCA on failure.
     */
    public stabilize(world: WorldState): WorldState {
        // 0. Update History (The Black Box)
        this.history.push(JSON.parse(JSON.stringify(world)));
        if (this.history.length > this.MAX_HISTORY) this.history.shift();

        const entities = world.entities || [];
        const nextEntities = [...entities];

        // 1. Detect Glitches (Explosions / High Velocity)
        const glitchDetected = entities.some(e => 
            e.physics.mass > 0 && (Math.abs(e.position.x) > 1000 || Math.abs(e.position.y) > 1000)
        );

        if (glitchDetected) {
            this.runNeuralTrace();
        }

        // 2. Detect High-Velocity Overlaps (Potential Glitches)
        for (let i = 0; i < entities.length; i++) {
            for (let j = i + 1; j < entities.length; j++) {
                const a = entities[i];
                const b = entities[j];

                if (a.physics.isStatic && b.physics.isStatic) continue;

                const dist = this.getDistance(a, b);
                const combinedRadius = this.getCombinedRadius(a, b);

                if (dist < combinedRadius) {
                    const processKey = this.getProcessKey(a.id, b.id);
                    
                    if (!this.activeProcesses.has(processKey)) {
                        // START COLLISION PROCESS (The Meta-Particle Merger)
                        this.activeProcesses.set(processKey, {
                            id: processKey,
                            entityAId: a.id,
                            entityBId: b.id,
                            framesRemaining: this.MAX_PROCESS_FRAMES,
                            storedEnergy: 1.0, // Energy absorption factor
                            initialRelativeVelocity: new THREE.Vector3(0, 0, 0)
                        });
                    }
                }
            }
        }

        // 3. Process Meta-Particles (The Virtual Spring)
        this.activeProcesses.forEach((process, key) => {
            const idxA = nextEntities.findIndex(e => e.id === process.entityAId);
            const idxB = nextEntities.findIndex(e => e.id === process.entityBId);

            if (idxA === -1 || idxB === -1) {
                this.activeProcesses.delete(key);
                return;
            }

            const a = nextEntities[idxA];
            const b = nextEntities[idxB];
            
            const direction = new THREE.Vector3(
                b.position.x - a.position.x,
                b.position.y - a.position.y,
                b.position.z - a.position.z
            ).normalize();

            const pushStrength = (process.framesRemaining / this.MAX_PROCESS_FRAMES) * 0.5;

            if (!a.physics.isStatic) {
                a.position.x -= direction.x * pushStrength;
                a.position.y -= direction.y * pushStrength;
                a.position.z -= direction.z * pushStrength;
            }

            if (!b.physics.isStatic) {
                b.position.x += direction.x * pushStrength;
                b.position.y += direction.y * pushStrength;
                b.position.z += direction.z * pushStrength;
            }

            process.framesRemaining--;
            if (process.framesRemaining <= 0) {
                this.activeProcesses.delete(key);
            }
        });

        return { ...world, entities: nextEntities };
    }

    private getDistance(a: Entity, b: Entity): number {
        return Math.sqrt(
            Math.pow(a.position.x - b.position.x, 2) +
            Math.pow(a.position.y - b.position.y, 2) +
            Math.pow(a.position.z - b.position.z, 2)
        );
    }

    private getCombinedRadius(a: Entity, b: Entity): number {
        const radiusA = Math.max(a.dimensions?.x || 1, a.dimensions?.y || 1) / 2;
        const radiusB = Math.max(b.dimensions?.x || 1, b.dimensions?.y || 1) / 2;
        return radiusA + radiusB;
    }

    private async runNeuralTrace() {
        console.log("[Sentinel] Glitch detected. Initiating Neural Trace RCA...");
        blackboard.log('Sentinel', '🔍 Glitch detected. Performing Root-Cause Analysis...', 'THINKING');

        try {
            // Using Server Action to avoid browser Genkit dependency
            const result = await runNeuralRCA(this.history);

            if (result.success && result.analysis) {
                blackboard.log('Sentinel', `Neural Trace: ${result.analysis.reason}. Fix: ${result.analysis.mitigation}`, 'ERROR');
            }
        } catch (e) {
            console.error("Neural Trace failed.");
        }
    }

    private getProcessKey(idA: string, idB: string): string {
        return [idA, idB].sort().join(':');
    }
}

export const sentinel = CollisionSentinel.getInstance();