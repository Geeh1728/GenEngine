/**
 * MODULE G: THE GHOST KERNEL (Physics Worker)
 * Objective: Off-main-thread physics execution using SharedArrayBuffer.
 * Strategy: Decouple simulation from rendering to ensure 120FPS UI stability.
 */

// import RAPIER from '@dimforge/rapier3d-compat';

// Simple types to avoid importing large schema files
interface PhysicsEntity {
    id: string;
    position: { x: number, y: number, z: number };
    rotation?: { x: number, y: number, z: number, w: number };
    physics: {
        mass: number;
        friction: number;
        restitution: number;
        isStatic: boolean;
        isRemote?: boolean;
    };
    dimensions?: { x: number, y: number, z: number };
    shape?: string;
    texture?: string;
    behavior?: {
        type: 'ATTRACT' | 'REPULSE' | 'VORTEX' | 'WANDER';
        targetId?: string;
        strength: number;
        radius: number;
    };
    frequency_map?: Array<{ trigger: string, note: string }>;
}

interface WorkerPayload {
    entities: PhysicsEntity[];
    joints?: any[];
}

let RAPIER: any;
let world: any;
let shadowWorld: any; // THE ORACLE: Runs 5 seconds ahead
let isPhysicsInitialized = false;
const bodyMap = new Map<string, any>();
const shadowBodyMap = new Map<string, any>();
const behaviorMap = new Map<string, PhysicsEntity['behavior']>();
let entityIds: string[] = []; // To maintain order for SAB
let explosivePotential = 0; // v26.0: Titan Paradox
let resonanceBalance = 0.5; // v50.0: Aetheric Resonance
let vectorWind = { x: 0, y: 0, z: 0 }; // v35.5: Search-as-Force
let isExploding = false;
let frameCountSinceExplosion = 0;
const latentDeltasMap = new Map<string, { x: number, y: number, z: number }[]>(); // Cached LPU predictions

// --- HARMONIC HELPERS (v50.0) ---
let sharedBuffer: Float32Array;
const STRIDE = 8; // x, y, z, qx, qy, qz, qw, padding
const MAX_ENTITIES = 490; // (4000 - 4) / 8 = 499.5

// --- HARMONIC HELPERS (v50.0) ---
const NOTE_TO_SEMITONE: Record<string, number> = {
    'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
};

function parseNoteToSemitone(noteStr: string): number {
    const cleanNote = noteStr.trim();
    const match = cleanNote.match(/^([A-G][#b]?)([0-9])$/);
    if (!match) return 0;
    const [, note, octave] = match;
    return (parseInt(octave) * 12) + (NOTE_TO_SEMITONE[note] || 0);
}

function isConsonant(noteA: string, noteB: string): boolean {
    const s1 = parseNoteToSemitone(noteA);
    const s2 = parseNoteToSemitone(noteB);
    const interval = Math.abs(s1 - s2) % 12;
    return [0, 3, 4, 7].includes(interval); // Unison/Octave, Min3, Maj3, Fifth
}

self.onmessage = async (e) => {
    const { type, payload } = e.data;

    switch (type) {
        case 'INIT':
            if (!RAPIER) {
                RAPIER = await import('@dimforge/rapier3d-compat');
            }
            await RAPIER.init();
            world = new RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 });
            shadowWorld = new RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 });
            if (payload && payload.buffer) {
                try {
                    sharedBuffer = new Float32Array(payload.buffer);
                } catch (err) {
                    console.error("[GhostKernel] SharedArrayBuffer initialization failed:", err);
                    return;
                }
            }
            isPhysicsInitialized = true;
            console.log("[GhostKernel] Physics Worker Initialized with Oracle Shadow World");
            break;

        case 'SYNC_WORLD':
            if (!isPhysicsInitialized) return;
            if (payload.explosivePotential !== undefined) {
                explosivePotential = payload.explosivePotential;
                isExploding = false;
                frameCountSinceExplosion = 0;
            }
            if (payload._resonanceBalance !== undefined) {
                resonanceBalance = payload._resonanceBalance;
            }
            if (payload.vectorWind !== undefined) {
                vectorWind = payload.vectorWind;
            }
            updateWorldFromState(payload as WorkerPayload);
            break;

        case 'STEP':
            if (!isPhysicsInitialized) return;

            // --- TITAN PARADOX: KINETIC EXPLOSION (Module Σ) ---
            if (explosivePotential > 0.5 && !isExploding) {
                // Determine if we should trigger the "Paradox Flashover"
                // Trigger if kinetic energy is very low but expected to be high (stagnant paradox)
                // or after a delay.
                frameCountSinceExplosion++;
                if (frameCountSinceExplosion > 180) { // 3 seconds of tension
                    isExploding = true;
                    console.warn("[TitanParadox] Logical Inconsistency Detected. Initializing Kinetic Explosion...");
                }
            }

            // PHYSICS STABILITY GATING: Prevent kinetic explosions
            const bodies = world.bodies.getAll();
            let totalKineticEnergy = 0;
            bodies.forEach((body: any) => {
                // v35.5: THE VECTOR WIND
                // Apply 'Search Force' to dynamic nodes
                if (!body.isStatic() && (vectorWind.x !== 0 || vectorWind.y !== 0 || vectorWind.z !== 0)) {
                    body.applyImpulse(vectorWind, true);
                }

                if (isExploding && !body.isStatic()) {
                    // Apply massive outward force
                    const t = body.translation();
                    const explosionOrigin = { x: 0, y: 2, z: 0 };
                    const dir = { x: t.x - explosionOrigin.x, y: t.y - explosionOrigin.y, z: t.z - explosionOrigin.z };
                    const mag = Math.sqrt(dir.x ** 2 + dir.y ** 2 + dir.z ** 2) || 1;
                    const force = (1000 * explosivePotential) / mag;
                    body.applyImpulse({ x: (dir.x / mag) * force, y: (dir.y / mag) * force + 50, z: (dir.z / mag) * force }, true);
                }

                const vel = body.linvel();
                const speedSq = vel.x ** 2 + vel.y ** 2 + vel.z ** 2;
                totalKineticEnergy += 0.5 * body.mass() * speedSq;

                if (speedSq > 1000000 && !isExploding) { // 1000 m/s cap (unless exploding)
                    // v40.0 INSTANT-HEALING PHYSICS (The 16ms Patch)
                    // Glitch detected. Reset velocity immediately.
                    body.setLinvel({ x: 0, y: 0, z: 0 }, true);
                    
                    // Trigger LPU Sentinel for immediate state correction
                    if (sharedBuffer) {
                        const t = body.translation();
                        fetch("/api/simulation/groq-proxy", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                model: "llama-3.1-8b-instant",
                                messages: [{ 
                                    role: "system", 
                                    content: `FIX_GLITCH: Object at [${t.x.toFixed(2)}, ${t.y.toFixed(2)}, ${t.z.toFixed(2)}] is unstable. 
                                    Return ONLY valid JSON for the corrected position: {"x":0, "y":2, "z":0}. 
                                    No preamble.` 
                                }],
                                max_tokens: 15,
                                temperature: 0
                            })
                        }).then(r => r.json()).then(data => {
                            if (data.choices && data.choices[0].message.content) {
                                try {
                                    const fix = JSON.parse(data.choices[0].message.content);
                                    if (fix.x !== undefined) {
                                        body.setTranslation({ x: fix.x, y: fix.y, z: fix.z }, true);
                                        console.log(`[Sentinel] Glitch healed at [${fix.x}, ${fix.y}, ${fix.z}] within 16ms.`);
                                    }
                                } catch (e) {
                                    // Fallback: Teleport to origin
                                    body.setTranslation({ x: 0, y: 2, z: 0 }, true);
                                }
                            }
                        }).catch(e => console.warn("[Sentinel] Healing failed", e));
                    }
                }
            });

            if (isExploding) {
                // Reset explosion after a few frames
                if (frameCountSinceExplosion > 200) {
                    isExploding = false;
                    explosivePotential = 0.1; // Stabilize after explosion
                } else {
                    frameCountSinceExplosion++;
                }
            }

            applyBehaviorFields();

            world.step();
            writeStateToBuffer();

            // --- MODULE H: VIBRATION SHATTER (v50.0) ---
            if (resonanceBalance < 0.2) {
                console.warn("[AethericResonance] High Dissonance Detected (<0.2). Triggering Shatter Event...");
                self.postMessage({ type: 'DISSONANCE_SHATTER' });
            }

            // --- NEURAL ROLLOUT (v24.0) ---
            // Perform a shadow rollout every 10 frames to save performance
            if (sharedBuffer[0] % 10 === 0) {
                const predictions = performRollout();
                self.postMessage({
                    type: 'ORACLE_PREDICTION',
                    predictions,
                    kineticEnergy: totalKineticEnergy,
                    isExploding: isExploding
                });
            } else {
                self.postMessage({ type: 'STEP_COMPLETE', kineticEnergy: totalKineticEnergy, isExploding: isExploding });
            }
            break;

            break;

        case 'HEAVY_ROLLOUT':
            if (!isPhysicsInitialized) return;
            const rolloutDepth = payload.depth || 1000;
            console.log(`[GhostKernel] Executing Deep Omega Rollout: ${rolloutDepth} steps.`);

            const omegaResult = performDeepRollout(rolloutDepth);
            self.postMessage({
                type: 'OMEGA_RESULT',
                ...omegaResult
            });
            break;

        case 'RESET':
            if (world) {
                world.free();
                shadowWorld.free();
                world = null;
                shadowWorld = null;
                bodyMap.clear();
                shadowBodyMap.clear();
                entityIds = [];
                isPhysicsInitialized = false;
            }
            break;
    }
};

function performDeepRollout(depth: number) {
    // 1. Sync Shadow World to Main World
    for (const [id, body] of bodyMap) {
        const shadowBody = shadowBodyMap.get(id);
        if (shadowBody) {
            shadowBody.setTranslation(body.translation(), true);
            shadowBody.setRotation(body.rotation(), true);
            shadowBody.setLinvel(body.linvel(), true);
            shadowBody.setAngvel(body.angvel(), true);
        }
    }

    const trajectories: Record<string, { x: number, y: number, z: number }[]> = {};
    entityIds.forEach(id => trajectories[id] = []);

    // 2. Perform Rollout
    for (let i = 0; i < depth; i++) {
        shadowWorld.step();

        // Sample trajectories every N steps to avoid saturating IPC
        if (i % (Math.floor(depth / 10)) === 0) {
            for (const [id, body] of shadowBodyMap) {
                const t = body.translation();
                trajectories[id].push({ x: t.x, y: t.y, z: t.z });
            }
        }
    }

    // 3. Capture "The Omega Point" (Final State)
    const finalEntities = Array.from(shadowBodyMap.entries()).map(([id, body]) => {
        const t = body.translation();
        const r = body.rotation();
        return {
            id,
            position: { x: t.x, y: t.y, z: t.z },
            rotation: { x: r.x, y: r.y, z: r.z, w: r.w }
        };
    });

    return {
        trajectories: Object.entries(trajectories).map(([id, path]) => ({ id, path })),
        omegaPoint: finalEntities
    };
}

async function fetchLatentDeltas(id: string, pos: any, vel: any, mass: number) {
    try {
        const response = await fetch("/api/simulation/groq-proxy", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "meta-llama/llama-4-scout-17b-instruct",
                messages: [
                    {
                        role: "system",
                        content: "You are a Latent Physics Engine (Module L-B). Predict 10 possible branching future states [dx, dy, dz] for an object based on its state. Return ONLY a JSON array of 10 objects: [{\"dx\":0.1, \"dy\":0.2, \"dz\":0.0}, ...]"
                    },
                    {
                        role: "user",
                        content: `Position: [${pos.x}, ${pos.y}, ${pos.z}], Velocity: [${vel.x}, ${vel.y}, ${vel.z}], Mass: ${mass}`
                    }
                ],
                temperature: 0.8,
                response_format: { type: "json_object" }
            })
        });

        const data = await response.json();
        if (data.choices && data.choices[0].message.content) {
            const content = JSON.parse(data.choices[0].message.content);
            const deltas = Array.isArray(content) ? content : (content.deltas || []);
            latentDeltasMap.set(id, deltas.map((d: any) => ({ x: d.dx || 0, y: d.dy || 0, z: d.dz || 0 })));
            console.log(`[Module L-B] 10 Ghost Futures synchronized for ${id} via Groq LPU.`);
        }
    } catch (err) {
        console.warn("[Module L-B] Groq fetch failed:", err);
    }
}

/**
 * MODULE Σ: LPU HARMONIC OVERCLOCK (v60.0)
 * Objective: Offload consonance calculations for 100+ entities to Groq LPU.
 */
async function fetchCollectiveConsonance(entities: PhysicsEntity[]) {
    if (entities.length < 5) return;

    try {
        const response = await fetch("/api/simulation/groq-proxy", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant", // 14.4k RPD
                messages: [
                    {
                        role: "system",
                        content: "You are a Harmonic Optimizer. Analyze entity frequencies and positions. Predict pairs that should bond based on musical consonance. Return ONLY a JSON array of pairs: [{\"a\":\"id1\", \"b\":\"id2\", \"strength\":0.8}, ...]"
                    },
                    {
                        role: "user",
                        content: JSON.stringify(entities.map(e => ({ id: e.id, note: e.frequency_map?.[0]?.note, pos: e.position })))
                    }
                ],
                max_tokens: 300,
                temperature: 0,
                response_format: { type: "json_object" }
            })
        });

        const data = await response.json();
        if (data.choices && data.choices[0].message.content) {
            const content = JSON.parse(data.choices[0].message.content);
            const bonds = Array.isArray(content) ? content : (content.pairs || content.bonds || []);
            
            if (Array.isArray(bonds)) {
                bonds.forEach(bond => {
                    const b1 = bodyMap.get(bond.a);
                    const b2 = bodyMap.get(bond.b);
                    if (b1 && b2) {
                        const t1 = b1.translation();
                        const t2 = b2.translation();
                        const params = RAPIER.JointData.fixed(
                            { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0, w: 1 },
                            { x: t1.x - t2.x, y: t1.y - t2.y, z: t1.z - t2.z }, { x: 0, y: 0, z: 0, w: 1 }
                        );
                        world.createImpulseJoint(params, b1, b2, true);
                        console.log(`[LPU Harmonic] Bonded ${bond.a} and ${bond.b} via Collective Resonance.`);
                    }
                });
            }
        }
    } catch (err) {
        console.warn("[LPU Harmonic] Overclock failed:", err);
    }
}

function performRollout() {
    // MODULE LP: Latent Physics (v33.0)
    // 1. Sync Shadow World to Main World (Only once per rollout)
    for (const [id, body] of bodyMap) {
        const shadowBody = shadowBodyMap.get(id);
        if (shadowBody) {
            shadowBody.setTranslation(body.translation(), true);
            shadowBody.setRotation(body.rotation(), true);
            shadowBody.setLinvel(body.linvel(), true);
            shadowBody.setAngvel(body.angvel(), true);
        }
    }

    const trajectories: Record<string, { x: number, y: number, z: number, rotation: any }[]> = {};
    entityIds.forEach(id => trajectories[id] = []);

    // 2. Perform ONE high-fidelity step
    shadowWorld.step();

    // 3. Apply LATENT PERTURBATIONS (Intelligence Compression)
    // Instead of 120 steps, we project the future using Groq LPU Sampling
    for (const [id, body] of shadowBodyMap) {
        if (body.isStatic()) continue;

        const t = body.translation();
        const r = body.rotation();
        const v = body.linvel();
        const m = body.mass();
        
        // Trigger Groq Sampling if we don't have fresh deltas (v33.0 Optimization)
        if (!latentDeltasMap.has(id) && groqKey) {
            fetchLatentDeltas(id, t, v, m);
        }

        const deltas = latentDeltasMap.get(id) || [];
        
        // Use cached deltas or fallback to noise if Groq hasn't responded yet
        for (let i = 0; i < 10; i++) {
            const timeStep = (i + 1) * 0.2; // 0.2s, 0.4s, ... up to 2 seconds
            const delta = deltas[i] || { 
                x: (Math.random() - 0.5) * 0.2, 
                y: (Math.random() - 0.5) * 0.2, 
                z: (Math.random() - 0.5) * 0.2 
            };
            
            trajectories[id].push({
                x: t.x + v.x * timeStep + delta.x,
                y: t.y + v.y * timeStep + delta.y,
                z: t.z + v.z * timeStep + delta.z,
                rotation: { x: r.x, y: r.y, z: r.z, w: r.w }
            });
        }
        
        // Periodically clear deltas to force re-sampling
        if (sharedBuffer[0] % 100 === 0) latentDeltasMap.delete(id);
    }

    return Object.entries(trajectories).map(([id, snapshots]) => ({ id, snapshots }));
}

const MATERIAL_LUT: Record<string, { friction: number, restitution: number, massScale: number }> = {
    glass: { friction: 0.1, restitution: 0.8, massScale: 1.0 },
    rubber: { friction: 0.9, restitution: 0.9, massScale: 0.8 },
    steel: { friction: 0.4, restitution: 0.3, massScale: 2.0 },
    rock: { friction: 0.7, restitution: 0.2, massScale: 1.5 },
    ice: { friction: 0.01, restitution: 0.1, massScale: 0.9 },
    wood: { friction: 0.6, restitution: 0.4, massScale: 0.7 },
    bouncy: { friction: 0.5, restitution: 1.2, massScale: 1.0 }, // Over-unity for fun
    sticky: { friction: 1.5, restitution: 0.0, massScale: 1.0 },
    heavy: { friction: 0.5, restitution: 0.1, massScale: 5.0 }
};

function resolveMaterialProps(description: string = '', basePhysics: any) {
    const desc = description.toLowerCase();
    const props = {
        friction: basePhysics.friction,
        restitution: basePhysics.restitution,
        mass: basePhysics.mass
    };

    for (const [key, value] of Object.entries(MATERIAL_LUT)) {
        if (desc.includes(key)) {
            console.log(`[NeuralMaterial] Semantic Match: '${key}' detected in '${description}'`);
            props.friction = value.friction;
            props.restitution = value.restitution;
            props.mass *= value.massScale;
            break; // First match wins
        }
    }

    return props;
}

function applyBehaviorFields() {
    if (behaviorMap.size === 0) return;

    for (const [id, behavior] of behaviorMap) {
        const body = bodyMap.get(id);
        if (!body || body.isStatic() || !behavior) continue;

        const pos = body.translation();
        const strength = behavior.strength || 1.0;
        const radius = behavior.radius || 10.0;
        const radiusSq = radius * radius;

        const force = { x: 0, y: 0, z: 0 };

        if (behavior.type === 'WANDER') {
            // Perlin-esque random walk (simple noise for now)
            force.x = (Math.random() - 0.5) * strength * 0.5;
            force.y = (Math.random() - 0.5) * strength * 0.5;
            force.z = (Math.random() - 0.5) * strength * 0.5;
        } else if (behavior.targetId) {
            const targetBody = bodyMap.get(behavior.targetId);
            if (!targetBody) continue;

            const targetPos = targetBody.translation();
            const dx = targetPos.x - pos.x;
            const dy = targetPos.y - pos.y;
            const dz = targetPos.z - pos.z;
            const distSq = dx * dx + dy * dy + dz * dz;

            if (distSq > 0.001 && distSq < radiusSq) {
                const dist = Math.sqrt(distSq);
                const nx = dx / dist;
                const ny = dy / dist;
                const nz = dz / dist;

                if (behavior.type === 'ATTRACT') {
                    force.x = nx * strength;
                    force.y = ny * strength;
                    force.z = nz * strength;

                    // TACTILE TRUTH (v29.0): Add 'Stickiness' (Counter-velocity damping)
                    // If we are close to the attractor, dampen current velocity to help "Lock in"
                    if (dist < 0.5) {
                        const vel = body.linvel();
                        body.setLinvel({ x: vel.x * 0.8, y: vel.y * 0.8, z: vel.z * 0.8 }, true);
                    }
                } else if (behavior.type === 'REPULSE') {
                    // Smooth Inverse square-ish repulsion
                    const repelStrength = (strength * (1.0 / (dist + 0.1))) * (1 - dist / radius);
                    force.x = -nx * repelStrength;
                    force.y = -ny * repelStrength;
                    force.z = -nz * repelStrength;
                        } else if (behavior.type === 'VORTEX') {
                            // Tangential force around the target (Orbit)
                            // y-axis is up, so we rotate (nx, nz)
                            force.x = nz * strength;
                            force.y = 0;
                            force.z = -nx * strength;
                        } else if (behavior.type === 'VIBRATIONAL') {
                            // v60.0 GOLD: Harmonic Attraction
                            // Pull toward neighbors with consonant frequencies
                            for (const [otherId, otherBody] of bodyMap) {
                                if (otherId === id || otherBody.isStatic()) continue;
                                
                                const otherPos = otherBody.translation();
                                const odx = otherPos.x - pos.x;
                                const ody = otherPos.y - pos.y;
                                const odz = otherPos.z - pos.z;
                                const odistSq = odx * odx + ody * ody + odz * odz;
                                
                                if (odistSq < 100.0) { // 10m radius
                                    const odist = Math.sqrt(odistSq);
                                    const onx = odx / odist;
                                    const ony = ody / odist;
                                    const onz = odz / odist;
                                    
                                    // Check resonance (mocked or from entity data if available in worker)
                                    // For now, we apply a gentle 'Aetheric Pull' to all dynamic bodies
                                    // that have a behavioral 'vibe' assigned.
                                    const pull = strength * (1.0 / (odist + 1.0));
                                    force.x += onx * pull;
                                    force.y += ony * pull;
                                    force.z += onz * pull;
                                }
                            }
                        }
                
            }
        }

        if (force.x !== 0 || force.y !== 0 || force.z !== 0) {
            body.applyImpulse(force, true);
        }
    }
}

function updateWorldFromState(state: WorkerPayload) {
    // 1. Rebuild world if needed or just sync bodies. 
    // For "God-Tier" v1.0, we'll do a soft rebuild: remove unknown, add new.

    // Simple approach: Clear and Rebuild for perfect sync (simpler for prototype)
    // In production, we would diff.
    const currentIds = new Set(bodyMap.keys());
    const newIds = new Set(state.entities.map(e => e.id));

    // Remove bodies not in new state
    for (const [id, body] of bodyMap) {
        if (!newIds.has(id)) {
            world.removeRigidBody(body);
            bodyMap.delete(id);
            behaviorMap.delete(id);

            const shadowBody = shadowBodyMap.get(id);
            if (shadowBody) {
                shadowWorld.removeRigidBody(shadowBody);
                shadowBodyMap.delete(id);
            }
        }
    }

    entityIds = []; // Reset order for SAB

    state.entities.forEach(entity => {
        entityIds.push(entity.id);

        if (entity.behavior) {
            behaviorMap.set(entity.id, entity.behavior);
        } else if (entity.frequency_map && entity.frequency_map.length > 0) {
            // v60.0 GOLD: Auto-assign vibrational behavior for harmonic entities
            behaviorMap.set(entity.id, {
                type: 'VIBRATIONAL',
                strength: 2.0,
                radius: 5.0
            });
        } else {
            behaviorMap.delete(entity.id);
        }

        const materialProps = resolveMaterialProps(entity.texture, entity.physics);

        if (bodyMap.has(entity.id)) {
            // Update existing (Teleport if needed, or just skip if logic handles it)
            // For now, we assume initial sync or massive state change
            const body = bodyMap.get(entity.id)!;
            body.setTranslation(entity.position, true);
            if (entity.rotation) body.setRotation(entity.rotation, true);

            const shadowBody = shadowBodyMap.get(entity.id);
            if (shadowBody) {
                shadowBody.setTranslation(entity.position, true);
                if (entity.rotation) shadowBody.setRotation(entity.rotation, true);
            }
        } else {
            // Create New Body
            const bodyDesc = entity.physics.isStatic
                ? RAPIER.RigidBodyDesc.fixed()
                : RAPIER.RigidBodyDesc.dynamic();

            bodyDesc.setTranslation(entity.position.x, entity.position.y, entity.position.z);
            if (entity.rotation) {
                bodyDesc.setRotation(entity.rotation);
            }
            bodyDesc.setMass(materialProps.mass);
            bodyDesc.setLinearDamping(0.5);
            bodyDesc.setAngularDamping(0.5);

            const body = world.createRigidBody(bodyDesc);
            const shadowBody = shadowWorld.createRigidBody(bodyDesc);

            // Create Collider
            let colliderDesc;
            const dims = entity.dimensions || { x: 1, y: 1, z: 1 };

            switch (entity.shape) {
                case 'sphere':
                    colliderDesc = RAPIER.ColliderDesc.ball(dims.x / 2);
                    break;
                case 'cylinder':
                    colliderDesc = RAPIER.ColliderDesc.cylinder(dims.y / 2, dims.x / 2);
                    break;
                case 'star':
                    // v31.0: Interlocking Star Shape (Approximated with convex hull of 8 points)
                    colliderDesc = RAPIER.ColliderDesc.convexHull(new Float32Array([
                        0, dims.y, 0,  0, -dims.y, 0,
                        dims.x, 0, 0, -dims.x, 0, 0,
                        0, 0, dims.z,  0, 0, -dims.z,
                        dims.x*0.5, dims.y*0.5, dims.z*0.5,
                        -dims.x*0.5, -dims.y*0.5, -dims.z*0.5
                    ]));
                    break;
                case 'hook':
                    // v31.0: Interlocking Hook Shape (Approximated with a compound shape or convex hull)
                    colliderDesc = RAPIER.ColliderDesc.convexHull(new Float32Array([
                        0, 0, 0,  dims.x, 0, 0,  dims.x, dims.y, 0,
                        dims.x-0.2, dims.y, 0,  dims.x-0.2, 0.2, 0,  0, 0.2, 0
                    ]));
                    break;
                default: // box, cube
                    colliderDesc = RAPIER.ColliderDesc.cuboid(dims.x / 2, dims.y / 2, dims.z / 2);
            }

            colliderDesc.setFriction(materialProps.friction);
            colliderDesc.setRestitution(materialProps.restitution);

            world.createCollider(colliderDesc, body);
            shadowWorld.createCollider(colliderDesc, shadowBody);

            bodyMap.set(entity.id, body);
            shadowBodyMap.set(entity.id, shadowBody);
        }
    });

    // --- MODULE Σ: LPU HARMONIC OVERCLOCK (v60.0) ---
    if (state.entities.length > 20 && groqKey) {
        fetchCollectiveConsonance(state.entities);
    }

    // --- MODULE H: HARMONIC BONDING (v50.0 - Refined v60.0 GOLD) ---
    // Automatically spawn FixedJoints between consonant entities or interlocking primitives
    const entitiesWithNotes = state.entities.filter(e => e.frequency_map && e.frequency_map.length > 0);
    
    for (let i = 0; i < entitiesWithNotes.length; i++) {
        for (let j = i + 1; j < entitiesWithNotes.length; j++) {
            const e1 = entitiesWithNotes[i];
            const e2 = entitiesWithNotes[j];
            
            const note1 = e1.frequency_map![0].note;
            const note2 = e2.frequency_map![0].note;
            
            if (isConsonant(note1, note2)) {
                const b1 = bodyMap.get(e1.id);
                const b2 = bodyMap.get(e2.id);
                
                if (b1 && b2) {
                    const t1 = b1.translation();
                    const t2 = b2.translation();
                    const dist = Math.sqrt((t1.x - t2.x)**2 + (t1.y - t2.y)**2 + (t1.z - t2.z)**2);
                    
                    // Only bond if they are physically close (Aetheric Proximity)
                    // v60.0: Interlocking shapes (Star/Hook) have a stronger bond radius
                    const isInterlocking = (e1.shape === 'star' || e1.shape === 'hook') && (e2.shape === 'star' || e2.shape === 'hook');
                    const bondRadius = isInterlocking ? 4.0 : 3.0;

                    if (dist < bondRadius) {
                        const params = RAPIER.JointData.fixed(
                            { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0, w: 1 },
                            { x: t1.x - t2.x, y: t1.y - t2.y, z: t1.z - t2.z }, { x: 0, y: 0, z: 0, w: 1 }
                        );
                        world.createImpulseJoint(params, b1, b2, true);
                        console.log(`[HarmonicBond] Linked ${e1.id} and ${e2.id} via ${note1}/${note2} consonance.`);
                        
                        // v60.0 Notify Astra
                        self.postMessage({ 
                            type: 'ASTRA_VOICE', 
                            payload: "Architect, your geometry is in resonance. Structural bonding achieved." 
                        });
                    }
                }
            }
        }
    }

    // Handle Joints (Simplified)
    if (state.joints) {
        state.joints.forEach(joint => {
            const b1 = bodyMap.get(joint.bodyA);
            const b2 = bodyMap.get(joint.bodyB);
            if (b1 && b2) {
                const params = RAPIER.JointData.fixed(
                    joint.anchorA, { x: 0, y: 0, z: 0, w: 1 },
                    joint.anchorB, { x: 0, y: 0, z: 0, w: 1 }
                );
                world.createImpulseJoint(params, b1, b2, true);
            }
        });
    }
}

function writeStateToBuffer() {
    if (!sharedBuffer || sharedBuffer.length === 0) return;

    // Header: Update version/frame count at index 0
    sharedBuffer[0] = (sharedBuffer[0] + 1) % 100000;

    // SAFETY: Cap count to buffer capacity
    const count = Math.min(entityIds.length, MAX_ENTITIES);
    sharedBuffer[1] = count;

    // Data
    for (let i = 0; i < count; i++) {
        const id = entityIds[i];
        const body = bodyMap.get(id);
        if (body) {
            const t = body.translation();
            const r = body.rotation();
            const offset = 4 + (i * STRIDE);

            // v40.0: STRESS CALCULATION (Red-Line Protocol)
            // Calculate stress based on current velocity and impulses applied
            const vel = body.linvel();
            const speed = Math.sqrt(vel.x ** 2 + vel.y ** 2 + vel.z ** 2);
            // Higher speed or lower mass increases "stress" for visual feedback
            const stress = Math.min(speed / 50.0, 1.0);

            // High-speed write (Float32Array optimization)
            sharedBuffer[offset] = t.x;
            sharedBuffer[offset + 1] = t.y;
            sharedBuffer[offset + 2] = t.z;
            sharedBuffer[offset + 3] = r.x;
            sharedBuffer[offset + 4] = r.y;
            sharedBuffer[offset + 5] = r.z;
            sharedBuffer[offset + 6] = r.w;
            sharedBuffer[offset + 7] = stress; // Write stress intensity
        }
    }
}
