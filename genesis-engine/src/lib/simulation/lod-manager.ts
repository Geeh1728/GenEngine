import * as THREE from 'three';

/**
 * MODULE Z: DIMENSIONAL LAYERING (v29.0)
 * LOD Manager for Semantic Zoom
 * 
 * Maps camera distance to ontology layers, enabling seamless transitions
 * between macro, standard, and micro simulation scales.
 */

export type OntologyLayer = 'MICRO' | 'STANDARD' | 'MACRO';

export interface LODConfig {
    microThreshold: number;   // Distance below which we switch to MICRO
    macroThreshold: number;   // Distance above which we switch to MACRO
}

export interface LODState {
    currentLayer: OntologyLayer;
    transitionProgress: number; // 0-1, for smooth blending
    cameraDistance: number;
}

export type LODEvent = 'MICRO_ENTER' | 'MICRO_EXIT' | 'MACRO_ENTER' | 'MACRO_EXIT' | 'LAYER_CHANGE';

export class LODManager {
    private config: LODConfig;
    private currentState: LODState;
    private callbacks: Map<string, (state: LODState, event: LODEvent) => void>;

    constructor(config: Partial<LODConfig> = {}) {
        this.config = {
            microThreshold: 10,
            macroThreshold: 100,
            ...config
        };

        this.currentState = {
            currentLayer: 'STANDARD',
            transitionProgress: 0,
            cameraDistance: 50
        };

        this.callbacks = new Map();
    }

    /**
     * Update the LOD state based on camera distance to target
     */
    update(camera: THREE.Camera, targetPosition: THREE.Vector3): LODState {
        const distance = camera.position.distanceTo(targetPosition);
        this.currentState.cameraDistance = distance;

        // v33.0: Transition Buffers (Prevent Popping)
        const transitionBuffer = 10; // 10 units of "stipple blend"

        // Determine the appropriate layer
        let newLayer: OntologyLayer = 'STANDARD';
        let progress = 0;

        if (distance < this.config.microThreshold) {
            newLayer = 'MICRO';
            progress = 0; // Fully in MICRO
        } else if (distance < this.config.microThreshold + transitionBuffer) {
            newLayer = 'STANDARD';
            // Transitioning from MICRO to STANDARD
            progress = (distance - this.config.microThreshold) / transitionBuffer;
        } else if (distance > this.config.macroThreshold) {
            newLayer = 'MACRO';
            progress = 0; // Fully in MACRO
        } else if (distance > this.config.macroThreshold - transitionBuffer) {
            newLayer = 'STANDARD';
            // Transitioning from STANDARD to MACRO
            progress = (this.config.macroThreshold - distance) / transitionBuffer;
        } else {
            newLayer = 'STANDARD';
            progress = 1.0; // Solid STANDARD
        }

        // Invert progress for shader (1 = Solid, 0 = Dissolved)
        // Shader uses: if (stipple < uTransitionProgress) discard;
        // So we want uTransitionProgress to be 0 for solid, and 1 for fully dissolved?
        // Wait, if (stipple < 0) discard -> Never discards (Solid)
        // If (stipple < 1) discard -> Always discards (Invisible)
        
        // Let's use: progress = 0 (Solid), progress = 1 (Dissolved)
        // My previous logic: progress = 0 (MICRO), progress = 1 (STANDARD)
        // So for the transition:
        // At distance = microThreshold (MICRO side): progress should be 0 (Solid)
        // At distance = microThreshold + transitionBuffer (STANDARD side): progress should be 0 (Solid)
        // Wait, stipple dissolve usually happens during the SWAP.
        
        // Let's refine: transitionProgress is the "dissolve amount" of the CURRENT layer.
        this.currentState.transitionProgress = 1.0 - progress; 

        const oldLayer = this.currentState.currentLayer;
        const layerChanged = newLayer !== oldLayer;

        this.currentState.currentLayer = newLayer;

        if (layerChanged) {
            console.log(`[LOD] Semantic Shift: ${oldLayer} -> ${newLayer}`);
            this.notifyCallbacks('LAYER_CHANGE');
            
            if (newLayer === 'MICRO') this.notifyCallbacks('MICRO_ENTER');
            if (oldLayer === 'MICRO') this.notifyCallbacks('MICRO_EXIT');
            if (newLayer === 'MACRO') this.notifyCallbacks('MACRO_ENTER');
            if (oldLayer === 'MACRO') this.notifyCallbacks('MACRO_EXIT');
        }

        return { ...this.currentState };
    }

    /**
     * Returns the relative scale factor for rendering entities at the current LOD
     */
    getScaleFactor(): number {
        switch (this.currentState.currentLayer) {
            case 'MICRO': return 10.0;  // Zoomed in, everything looks bigger/detailed
            case 'MACRO': return 0.1;   // Zoomed out, everything is tiny/aggregated
            default: return 1.0;
        }
    }

    /**
     * Register a callback for layer changes
     */
    onEvent(id: string, callback: (state: LODState, event: LODEvent) => void): void {
        this.callbacks.set(id, callback);
    }

    /**
     * Alias for onEvent, specifically for layer changes (Module Z)
     */
    onLayerChange(id: string, callback: (state: LODState) => void): void {
        this.callbacks.set(id, (state) => callback(state));
    }

    /**
     * Unregister a callback
     */
    offEvent(id: string): void {
        this.callbacks.delete(id);
    }

    /**
     * Notify all registered callbacks
     */
    private notifyCallbacks(event: LODEvent): void {
        this.callbacks.forEach(callback => {
            callback({ ...this.currentState }, event);
        });
    }

    /**
     * Get the current LOD state
     */
    getState(): LODState {
        return { ...this.currentState };
    }

    /**
     * Update configuration
     */
    setConfig(config: Partial<LODConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * ACTION: Semantic Pruning (v35.5)
     * Disables dynamic physics for entities outside frustum or too far away.
     */
    performSemanticPruning(camera: THREE.Camera, world: { entities: any[] }): void {
        const frustum = new THREE.Frustum();
        const projScreenMatrix = new THREE.Matrix4();
        projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
        frustum.setFromProjectionMatrix(projScreenMatrix);

        const entities = world.entities;
        const maxDistSq = 50 * 50; // 50m radius

        entities.forEach((e: any) => {
            if (!e.physics || e.physics.isStatic) return;

            const pos = new THREE.Vector3(e.position.x, e.position.y, e.position.z);
            const inFrustum = frustum.containsPoint(pos);
            const distSq = camera.position.distanceToSquared(pos);
            const shouldBeActive = inFrustum && distSq < maxDistSq;

            if (e.rigidBodyRef?.ref) {
                const rb = e.rigidBodyRef.ref;
                if (!shouldBeActive && rb.bodyType() !== 1) { // 1 = Fixed
                    rb.setBodyType(1, true); // Temporarily fix it
                    e.isHidden = distSq > maxDistSq * 4; // Hide if really far
                } else if (shouldBeActive && rb.bodyType() === 1) {
                    rb.setBodyType(0, true); // Restore to dynamic
                    e.isHidden = false;
                }
            }
        });
    }

    /**
     * ACTION: Semantic Swap (v29.0)
     * Dynamically modifies the ECS world based on LOD shift.
     */
    performSemanticSwap(oldLayer: OntologyLayer, newLayer: OntologyLayer, world: any): void {
        if (oldLayer === newLayer) return;

        console.log(`[LOD Action] Executing Semantic Swap: ${oldLayer} -> ${newLayer}`);

        if (newLayer === 'MACRO') {
            // Aggregation Logic: Group entities by color/type and replace with Egregors
            const entities = [...world.entities];
            const groups: Record<string, any[]> = {};
            
            entities.forEach(e => {
                if (e.physics?.isStatic) return;
                const key = e.renderable?.color || 'default';
                if (!groups[key]) groups[key] = [];
                groups[key].push(e);
            });

            for (const [color, members] of Object.entries(groups)) {
                if (members.length < 3) continue;

                // Calculate centroid
                const centroid = { x: 0, y: 0, z: 0 };
                members.forEach(m => {
                    centroid.x += m.position.x;
                    centroid.y += m.position.y;
                    centroid.z += m.position.z;
                });
                centroid.x /= members.length;
                centroid.y /= members.length;
                centroid.z /= members.length;

                // Create Egregor (Swarm Entity / Aggregate Probability Field)
                const egregorId = `egregor-${color.replace('#', '')}`;
                const egregor = {
                    id: egregorId,
                    position: centroid,
                    physics: { mass: 10, friction: 0.1, restitution: 0.8, isStatic: false },
                    // v33.0: AGGREGATE PROBABILITY FIELD SHADER
                    renderable: { 
                        shape: 'sphere', 
                        color, 
                        shaderCode: 'uDensity = 0.2; uCertainty = 0.5; uShimmer = 0.5;', 
                        isGhost: true // Render as a ghost/cloud
                    },
                    personality: { isEgregor: true },
                    dimensions: { x: 5, y: 5, z: 5 }, // Larger volume for aggregate cloud
                    certainty: 0.6,
                    visual: { color }
                };

                // Hide members, add egregor
                members.forEach(m => {
                    m.isHidden = true;
                    // Disable individual probability clouds for performance (v33.0)
                    m.probabilitySnapshots = [];
                    if (m.rigidBodyRef?.ref) m.rigidBodyRef.ref.setTranslation({ x: 0, y: -1000, z: 0 }, true);
                });
                world.add(egregor);
            }
        } else if (oldLayer === 'MACRO') {
            // Restore from MACRO: Remove egregors, unhide members
            const entities = [...world.entities];
            
            // MODULE C: Sympathetic Entanglement (Force Propagation)
            // Calculate residual force from Egregor movements to apply to Micro members
            entities.forEach(e => {
                if (e.personality?.isEgregor) {
                    const egregorVel = e.rigidBodyRef?.ref?.linvel() || { x: 0, y: 0, z: 0 };
                    
                    // Propagate this velocity to children (members hidden by this egregor)
                    const color = e.renderable.color;
                    entities.forEach(member => {
                        if (member.isHidden && member.renderable.color === color) {
                            if (member.rigidBodyRef?.ref) {
                                member.rigidBodyRef.ref.setLinvel(egregorVel, true);
                                // Apply a small random scattering force for organic transition
                                member.rigidBodyRef.ref.applyImpulse({
                                    x: (Math.random() - 0.5) * 2,
                                    y: (Math.random() - 0.5) * 2,
                                    z: (Math.random() - 0.5) * 2
                                }, true);
                            }
                        }
                    });

                    world.remove(e);
                } else if (e.isHidden) {
                    e.isHidden = false;
                }
            });
        }
    }
}

/**
 * Singleton instance for global access
 */
export const lodManager = new LODManager();

/**
 * Helper to determine shader effects based on LOD
 */
export function getLODShaderParams(layer: OntologyLayer): {
    detailLevel: number;
    useSimplified: boolean;
} {
    switch (layer) {
        case 'MICRO':
            return { detailLevel: 1.0, useSimplified: false };
        case 'MACRO':
            return { detailLevel: 0.3, useSimplified: true };
        default:
            return { detailLevel: 0.7, useSimplified: false };
    }
}
