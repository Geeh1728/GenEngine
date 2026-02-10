'use client';

import React, { useRef, useEffect, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody, RapierRigidBody, useFixedJoint, useRevoluteJoint, useSphericalJoint } from '@react-three/rapier';
import { Instances, Instance } from '@react-three/drei';
import * as THREE from 'three';
import { ecsWorld, renderableEntities, getEntityCount, jointEntities } from '@/lib/ecs/world';
import { syncFromRapier, registerRigidBody, selectEntity, getRenderTransforms, RenderTransform } from '@/lib/ecs/systems';
import { DynamicShaderMaterial } from './DynamicShaderMaterial';
import { timeTurner, useTimeTurner } from '@/lib/store/TimeTurnerStore';
import { newtonEngine } from '@/lib/simulation/newton-engine';
import { useGenesisStore } from '@/hooks/useGenesisStore';
import { p2p } from '@/lib/multiplayer/P2PConnector';

/**
 * ECS Renderer: High-performance entity rendering using GPU instancing.
 * Upgraded (v19.0): Integrated Newton Engine for physical law discovery.
 */

interface ECSRendererProps {
    onCollision?: (impactMagnitude: number) => void;
    onSelect?: (id: string) => void;
}

// Instanced geometry for each primitive type
const PRIMITIVE_GEOMETRIES = {
    cube: new THREE.BoxGeometry(1, 1, 1),
    box: new THREE.BoxGeometry(1, 1, 1),
    sphere: new THREE.SphereGeometry(0.5, 16, 16),
    cylinder: new THREE.CylinderGeometry(0.5, 0.5, 1, 16),
    plane: new THREE.PlaneGeometry(1, 1),
};

const SENTINEL_FRAG = `
    uniform float uTime;
    varying vec2 vUv;
    varying vec3 vNormal;
    void main() {
        float pulse = (sin(uTime * 10.0) + 1.0) / 2.0;
        vec3 red = vec3(0.8, 0.1, 0.1);
        vec3 yellow = vec3(1.0, 0.5, 0.0);
        float edge = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
        vec3 color = mix(red, yellow, pulse) + edge * 0.5;
        gl_FragColor = vec4(color, 1.0);
    }
`;

const instanceMaterial = new THREE.MeshStandardMaterial({
    metalness: 0.3,
    roughness: 0.7,
});

const NEURAL_LOD_FRAG = `
    uniform float uTime;
    uniform vec3 uColor;
    varying vec2 vUv;
    varying vec3 vNormal;
    void main() {
        float grain = fract(sin(dot(vUv, vec2(12.9898, 78.233))) * 43758.5453);
        vec3 baseColor = uColor * (0.8 + grain * 0.2);
        float rim = pow(1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0), 3.0);
        gl_FragColor = vec4(baseColor + rim * 0.3, 1.0);
    }
`;

interface RapierJointProps {
    joint: {
        type: 'fixed' | 'spherical' | 'revolute' | 'prismatic';
        anchorA: { x: number; y: number; z: number };
        anchorB: { x: number; y: number; z: number };
    };
    bodyARef: React.RefObject<RapierRigidBody>;
    bodyBRef: React.RefObject<RapierRigidBody>;
}

function RapierJoint({
    joint,
    bodyARef,
    bodyBRef
}: RapierJointProps) {
    const { type, anchorA, anchorB } = joint;

    if (type === 'fixed') {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useFixedJoint(bodyARef, bodyBRef, [
            [anchorA.x, anchorA.y, anchorA.z],
            [0, 0, 0, 1],
            [anchorB.x, anchorB.y, anchorB.z],
            [0, 0, 0, 1],
        ]);
    } else if (type === 'revolute') {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useRevoluteJoint(bodyARef, bodyBRef, [
            [anchorA.x, anchorA.y, anchorA.z],
            [anchorB.x, anchorB.y, anchorB.z],
            [0, 1, 0],
        ]);
    } else if (type === 'spherical') {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useSphericalJoint(bodyARef, bodyBRef, [
            [anchorA.x, anchorA.y, anchorA.z],
            [anchorB.x, anchorB.y, anchorB.z],
        ]);
    }

    return null;
}

interface HistoryFrame {
    [key: string]: RenderTransform[];
}

export function ECSRenderer({ onCollision, onSelect }: ECSRendererProps) {
    const { camera } = useThree();
    const { dispatch } = useGenesisStore();
    const [isWorkerReady, setIsWorkerReady] = useState(false);
    const [transforms, setTransforms] = useState<RenderTransform[]>([]);
    const [entityCount, setEntityCount] = useState(0);

    const workerRef = useRef<Worker | null>(null);
    const sharedBufferRef = useRef<Float32Array | null>(null);
    const historyRef = useRef<RenderTransform[][]>([]);
    const lastVelocities = useRef<Map<string, THREE.Vector3>>(new Map());
    const rigidBodyRefs = useRef<Map<string, RapierRigidBody>>(new Map());

    const USE_GHOST_KERNEL = true;
    const HISTORY_MAX_FRAMES = 600;

    useEffect(() => {
        if (!USE_GHOST_KERNEL) return;
        const worker = new Worker(new URL('../../lib/physics/physics-worker.ts', import.meta.url));
        const sab = new SharedArrayBuffer(4000 * 4);
        const floatView = new Float32Array(sab);
        worker.postMessage({ type: 'INIT', payload: { buffer: sab } });
        workerRef.current = worker;
        sharedBufferRef.current = floatView;
        setIsWorkerReady(true);
        return () => worker.terminate();
    }, []);

    useEffect(() => {
        if (!isWorkerReady || !workerRef.current) return;
        const payload = {
            entities: ecsWorld.entities.map(e => ({
                id: e.id,
                position: e.position,
                rotation: e.rotation,
                physics: e.physics,
                dimensions: e.dimensions,
                shape: e.renderable.shape,
                texture: e.renderable.texturePrompt
            })),
            joints: jointEntities.entities.map(j => j.joint)
        };
        workerRef.current.postMessage({ type: 'SYNC_WORLD', payload });
    }, [isWorkerReady, entityCount]);

    const handleCollision = (id: string, impactMagnitude: number, position?: { x: number, y: number, z: number }) => {
        if (onCollision && impactMagnitude > 5) {
            onCollision(impactMagnitude);

            // FRACTURE CHECK
            const entity = ecsWorld.entities.find(e => e.id === id);
            const fractureThreshold = entity?.renderable?.isUnstable ? 200 : 800;
            if (impactMagnitude > fractureThreshold) {
                dispatch({
                    type: 'SHATTER_ENTITY',
                    payload: {
                        id,
                        position: position || { x: 0, y: 0, z: 0 },
                        color: entity?.renderable?.color || '#ffffff'
                    }
                });
                return;
            }

            // MODULE A-S: Acoustic Sync & Interrupt Sensitivity
            dispatch({ type: 'RECORD_INSTRUMENT_ACTIVITY' });

            // Broadcast Visual Event (Ripple)
            p2p.broadcastVisualEvent({
                type: 'IMPACT_RIPPLE',
                entityId: id,
                magnitude: impactMagnitude,
                position: position || { x: 0, y: 0, z: 0 }
            });
        }
    };

    const handleSelect = (id: string) => {
        selectEntity(id);
        setTransforms(getRenderTransforms());
        onSelect?.(id);
    };

    const { isPlaying, currentIndex } = useTimeTurner();

    useFrame(({ clock }) => {
        if (!isPlaying) {
            const history = historyRef.current;
            const targetFrame = history[currentIndex];
            if (targetFrame) {
                setTransforms(targetFrame);
                setEntityCount(targetFrame.length);
            }
            return;
        }

        if (USE_GHOST_KERNEL && isWorkerReady && workerRef.current && sharedBufferRef.current) {
            const buffer = sharedBufferRef.current;
            const entityCountHeader = buffer[1];
            const entities = ecsWorld.entities;

            for (let i = 0; i < entityCountHeader; i++) {
                if (i >= entities.length) break;
                const offset = 4 + (i * 8);
                const e = entities[i];

                // NEWTON ENGINE: Record trajectory
                newtonEngine.record(e.id, {
                    t: clock.getElapsedTime(),
                    pos: { x: buffer[offset], y: buffer[offset + 1], z: buffer[offset + 2] },
                    vel: { x: 0, y: 0, z: 0 }
                });

                // Haptic Logic
                const newPos = new THREE.Vector3(buffer[offset], buffer[offset + 1], buffer[offset + 2]);
                const oldPos = new THREE.Vector3(e.position.x, e.position.y, e.position.z);
                const velocity = newPos.clone().sub(oldPos).divideScalar(1 / 60);
                const lastVel = lastVelocities.current.get(e.id) || new THREE.Vector3();
                const deltaV = velocity.clone().sub(lastVel).length();

                if (deltaV > 50) {
                    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(20);
                    handleCollision(e.id, deltaV, { x: newPos.x, y: newPos.y, z: newPos.z });
                }
                lastVelocities.current.set(e.id, velocity);

                e.position.x = buffer[offset];
                e.position.y = buffer[offset + 1];
                e.position.z = buffer[offset + 2];
                if (!e.rotation) e.rotation = { x: 0, y: 0, z: 0, w: 1 };
                e.rotation.x = buffer[offset + 3];
                e.rotation.y = buffer[offset + 4];
                e.rotation.z = buffer[offset + 5];
                e.rotation.w = buffer[offset + 6];
            }
            workerRef.current.postMessage({ type: 'STEP' });
        } else {
            syncFromRapier();
        }

        if (historyRef.current.length >= HISTORY_MAX_FRAMES) {
            historyRef.current.shift();
        }
        const frameState = getRenderTransforms();
        historyRef.current.push(frameState);
        timeTurner.setHistoryLength(historyRef.current.length);

        const newTransforms = getRenderTransforms();
        if (newTransforms.length !== entityCount) {
            setEntityCount(newTransforms.length);
            setTransforms(newTransforms);
        } else {
            setTransforms(newTransforms);
        }
    });

    useEffect(() => {
        const unsubscribe = renderableEntities.onEntityAdded.subscribe(() => {
            setTransforms(getRenderTransforms());
            setEntityCount(getEntityCount());
        });
        return () => unsubscribe();
    }, []);

    const groupedByShape = useMemo(() => {
        const groups: Record<string, RenderTransform[]> = {};
        for (const t of transforms) {
            const shape = t.shape || 'box';
            if (!groups[shape]) groups[shape] = [];
            groups[shape].push(t);
        }
        return groups;
    }, [transforms]);

    const handleRegister = (id: string, ref: RapierRigidBody | null) => {
        if (ref) {
            rigidBodyRefs.current.set(id, ref);
            registerRigidBody(id, ref);
        } else {
            rigidBodyRefs.current.delete(id);
        }
    };

    return (
        <group>
            {Object.entries(groupedByShape).map(([shape, shapeTransforms]) => {
                const geometry = PRIMITIVE_GEOMETRIES[shape as keyof typeof PRIMITIVE_GEOMETRIES] || PRIMITIVE_GEOMETRIES.box;
                const staticTransforms = shapeTransforms.filter(t => {
                    const entity = ecsWorld.entities.find(e => e.id === t.id);
                    return entity?.physics.isStatic;
                });
                const dynamicTransforms = shapeTransforms.filter(t => {
                    const entity = ecsWorld.entities.find(e => e.id === t.id);
                    return !entity?.physics.isStatic;
                });

                return (
                    <group key={shape}>
                        {staticTransforms.length > 0 && (
                            <Instances limit={1000} geometry={geometry} material={instanceMaterial}>
                                {staticTransforms.map((t) => (
                                    <Instance
                                        key={t.id}
                                        position={t.position}
                                        rotation={t.rotation}
                                        scale={t.scale}
                                        color={t.isSelected ? '#ffffff' : t.color}
                                        onClick={() => handleSelect(t.id)}
                                    />
                                ))}
                            </Instances>
                        )}

                        {dynamicTransforms.map((t) => {
                            const entity = ecsWorld.entities.find(e => e.id === t.id);
                            if (!entity) return null;

                            const dist = camera.position.distanceTo(new THREE.Vector3(t.position[0], t.position[1], t.position[2]));
                            const useNeuralLOD = dist > 50;

                            const MeshContent = (
                                <mesh geometry={geometry} scale={t.scale} onClick={() => handleSelect(t.id)}>
                                    {t.isUnstable ? (
                                        <DynamicShaderMaterial shaderCode={SENTINEL_FRAG} color="#ff0000" />
                                    ) : useNeuralLOD ? (
                                        <DynamicShaderMaterial shaderCode={NEURAL_LOD_FRAG} color={t.color} />
                                    ) : t.shaderCode ? (
                                        <DynamicShaderMaterial shaderCode={t.shaderCode} color={t.color} />
                                    ) : (
                                        <meshStandardMaterial color={t.isSelected ? '#ffffff' : t.color} />
                                    )}
                                </mesh>
                            );

                            if (USE_GHOST_KERNEL) {
                                return (
                                    <group key={t.id} position={t.position} rotation={t.rotation}>
                                        {MeshContent}
                                    </group>
                                );
                            }

                            return (
                                <RigidBody
                                    key={t.id}
                                    ref={(ref) => handleRegister(t.id, ref)}
                                    position={t.position}
                                    rotation={t.rotation}
                                    type={entity.physics.isRemote ? 'kinematicPosition' : 'dynamic'}
                                    colliders="cuboid"
                                    mass={entity.physics.mass}
                                    friction={entity.physics.friction}
                                    restitution={entity.physics.restitution}
                                    onCollisionEnter={(payload) => {
                                        const force = payload.manifold?.localNormal1() || { x: 0, y: 0, z: 0 };
                                        const magnitude = Math.sqrt(force.x ** 2 + force.y ** 2 + force.z ** 2);
                                        handleCollision(t.id, magnitude * 10, { x: t.position[0], y: t.position[1], z: t.position[2] });
                                    }}
                                >
                                    {MeshContent}
                                </RigidBody>
                            );
                        })}
                    </group>
                );
            })}

            {jointEntities.entities.map((j) => {
                const bodyA = rigidBodyRefs.current.get(j.joint!.bodyA);
                const bodyB = rigidBodyRefs.current.get(j.joint!.bodyB);
                if (!bodyA || !bodyB) return null;
                const bodyARef = { current: bodyA };
                const bodyBRef = { current: bodyB };

                return (
                    <RapierJoint
                        key={j.id}
                        joint={j.joint as RapierJointProps['joint']}
                        bodyARef={bodyARef as React.RefObject<RapierRigidBody>}
                        bodyBRef={bodyBRef as React.RefObject<RapierRigidBody>}
                    />
                );
            })}
        </group>
    );
}