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
}

interface WorkerPayload {
    entities: PhysicsEntity[];
    joints?: any[];
}

let RAPIER: any;
let world: any;
let isPhysicsInitialized = false;
let bodyMap = new Map<string, any>();
let entityIds: string[] = []; // To maintain order for SAB

// Shared Buffer: [Version, Count, ... (7 floats per entity: x,y,z, qx,qy,qz,qw)]
let sharedBuffer: Float32Array;
const STRIDE = 8; // x, y, z, qx, qy, qz, qw, padding
const MAX_ENTITIES = 490; // (4000 - 4) / 8 = 499.5

self.onmessage = async (e) => {
    const { type, payload } = e.data;

    switch (type) {
        case 'INIT':
            if (!RAPIER) {
                RAPIER = await import('@dimforge/rapier3d-compat');
            }
            await RAPIER.init();
            world = new RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 });
            if (payload && payload.buffer) {
                try {
                    sharedBuffer = new Float32Array(payload.buffer);
                } catch (err) {
                    console.error("[GhostKernel] SharedArrayBuffer initialization failed:", err);
                    return;
                }
            }
            isPhysicsInitialized = true;
            console.log("[GhostKernel] Physics Worker Initialized with Hardened Buffer");
            break;

        case 'SYNC_WORLD':
            if (!isPhysicsInitialized) return;
            updateWorldFromState(payload as WorkerPayload);
            break;

        case 'STEP':
            if (!isPhysicsInitialized) return;

            // PHYSICS STABILITY GATING: Prevent kinetic explosions
            const bodies = world.bodies.getAll();
            bodies.forEach((body: any) => {
                const vel = body.linvel();
                const speed = Math.sqrt(vel.x ** 2 + vel.y ** 2 + vel.z ** 2);
                if (speed > 1000) {
                    body.setLinvel({ x: vel.x * 0.1, y: vel.y * 0.1, z: vel.z * 0.1 }, true);
                }
            });

            world.step();
            writeStateToBuffer();
            self.postMessage({ type: 'STEP_COMPLETE' });
            break;

        case 'RESET':
            if (world) {
                world.free(); // Explicitly free WASM memory
                world = null;
                bodyMap.clear();
                entityIds = [];
                isPhysicsInitialized = false;
            }
            break;
    }
};

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
    let props = {
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
        }
    }

    entityIds = []; // Reset order for SAB

    state.entities.forEach(entity => {
        entityIds.push(entity.id);

        const materialProps = resolveMaterialProps(entity.texture, entity.physics);

        if (bodyMap.has(entity.id)) {
            // Update existing (Teleport if needed, or just skip if logic handles it)
            // For now, we assume initial sync or massive state change
            const body = bodyMap.get(entity.id)!;
            body.setTranslation(entity.position, true);
            if (entity.rotation) body.setRotation(entity.rotation, true);
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
                default: // box, cube
                    colliderDesc = RAPIER.ColliderDesc.cuboid(dims.x / 2, dims.y / 2, dims.z / 2);
            }

            colliderDesc.setFriction(materialProps.friction);
            colliderDesc.setRestitution(materialProps.restitution);

            world.createCollider(colliderDesc, body);
            bodyMap.set(entity.id, body);
        }
    });

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



            // High-speed write (Float32Array optimization)

            sharedBuffer[offset] = t.x;

            sharedBuffer[offset + 1] = t.y;

            sharedBuffer[offset + 2] = t.z;

            sharedBuffer[offset + 3] = r.x;

            sharedBuffer[offset + 4] = r.y;

            sharedBuffer[offset + 5] = r.z;

            sharedBuffer[offset + 6] = r.w;

        }

    }

}
