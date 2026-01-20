'use client';

import React, { useRef, useState, useEffect } from 'react';
import { RigidBody, CuboidCollider, BallCollider, RapierRigidBody, useFixedJoint, useSphericalJoint, useRevoluteJoint, usePrismaticJoint } from '@react-three/rapier';
import { Html } from '@react-three/drei';
import { motion } from 'framer-motion';
import { WorldState, Entity, Joint } from '@/lib/simulation/schema';
import { useTextureGen } from '@/lib/simulation/useTextureGen';
import { LabBench } from './LabBench';
import { VoxelRenderer } from './VoxelRenderer';
import { SkillNodeSchema } from '@/lib/genkit/schemas';
import { blackboard, BlackboardContext } from '@/lib/genkit/context';
import { z } from 'zod';
import * as THREE from 'three';

type SkillNode = z.infer<typeof SkillNodeSchema>;

interface EntityRendererProps {
    entity: Entity;
    onRegister: (id: string, ref: RapierRigidBody | null) => void;
    onCollision?: (impactMagnitude: number) => void;
    blackboardContext?: BlackboardContext;
}

const EntityRenderer: React.FC<EntityRendererProps> = ({ entity, onRegister, onCollision, blackboardContext }) => {
    const rbRef = useRef<RapierRigidBody>(null);
    const material = useTextureGen({
        prompt: entity.texturePrompt,
        color: entity.color,
    });

    useEffect(() => {
        onRegister(entity.id, rbRef.current);
        return () => onRegister(entity.id, null);
    }, [entity.id, onRegister]);

    // Memoize Geometries for Performance (Avoid re-calculating on every frame)
    const { geometry, collider } = useMemo(() => {
        const dims = entity.dimensions || { x: 1, y: 1, z: 1 };
        if (entity.type === 'sphere') {
            return {
                geometry: <sphereGeometry args={[dims.x, 32, 32]} />,
                collider: <BallCollider args={[dims.x]} />
            };
        }
        return {
            geometry: <boxGeometry args={[dims.x, dims.y, dims.z]} />,
            collider: <CuboidCollider args={[dims.x / 2, dims.y / 2, dims.z / 2]} />
        };
    }, [entity.type, entity.dimensions]);

    // Apply Physical Overrides (Quantum Bridge)
    let restitution = entity.physics.restitution;
    let friction = entity.physics.friction;

    if (blackboardContext) {
        // If environmental state is FROZEN, everything becomes more brittle (less bounciness)
        if (blackboardContext.environmentalState === 'FROZEN') {
            restitution = Math.max(0, restitution - 0.2);
            friction = Math.min(1, friction + 0.1); // Ice can be slippery but we simulate "frost stick"
        }
        
        // Material-specific overrides
        const materialProps = blackboardContext.materialRegistry[entity.name || ''];
        if (materialProps) {
            // Apply logic based on material properties
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleCollision = (event: any) => {
        if (!onCollision) return;

        // Calculate impact magnitude from manifold data if available
        // Or using collision impulse. In Rapier, we can check the impulse.
        const impulse = event.totalForceMagnitude || 0;
        if (impulse > 50) { // Threshold for "catastrophic" failure
            onCollision(impulse);
        }
    };

    return (
        <RigidBody
            ref={rbRef}
            type={entity.isStatic ? 'fixed' : 'dynamic'}
            position={[entity.position.x, entity.position.y, entity.position.z]}
            rotation={[
                THREE.MathUtils.degToRad(entity.rotation?.x || 0),
                THREE.MathUtils.degToRad(entity.rotation?.y || 0),
                THREE.MathUtils.degToRad(entity.rotation?.z || 0)
            ]}
            colliders={false}
            mass={entity.physics.mass}
            friction={friction}
            restitution={restitution}
            onCollisionEnter={handleCollision}
        >
            <mesh material={material}>
                {geometry}
            </mesh>
            {collider}

            {entity.analogyLabel && (
                <Html distanceFactor={10} position={[0, entity.dimensions?.y || 1, 0]}>
                    <div className="bg-black/80 border border-blue-500/50 text-blue-400 px-2 py-1 rounded text-[10px] font-black uppercase whitespace-nowrap shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                        {entity.analogyLabel}
                    </div>
                </Html>
            )}
        </RigidBody>
    );
};

interface JointRendererProps {
    joint: Joint;
    getRB: (id: string) => RapierRigidBody | null;
}

const FixedJointComponent = ({ bodyA, bodyB, anchorA, anchorB }: { bodyA: RapierRigidBody, bodyB: RapierRigidBody, anchorA: [number, number, number], anchorB: [number, number, number] }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useFixedJoint({ current: bodyA } as any, { current: bodyB } as any, [anchorA, [0, 0, 0, 1], anchorB, [0, 0, 0, 1]]);
    return null;
};

const SphericalJointComponent = ({ bodyA, bodyB, anchorA, anchorB }: { bodyA: RapierRigidBody, bodyB: RapierRigidBody, anchorA: [number, number, number], anchorB: [number, number, number] }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useSphericalJoint({ current: bodyA } as any, { current: bodyB } as any, [anchorA, anchorB]);
    return null;
};

const RevoluteJointComponent = ({ bodyA, bodyB, anchorA, anchorB }: { bodyA: RapierRigidBody, bodyB: RapierRigidBody, anchorA: [number, number, number], anchorB: [number, number, number] }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useRevoluteJoint({ current: bodyA } as any, { current: bodyB } as any, [anchorA, anchorB, [0, 1, 0]]);
    return null;
};

const PrismaticJointComponent = ({ bodyA, bodyB, anchorA, anchorB }: { bodyA: RapierRigidBody, bodyB: RapierRigidBody, anchorA: [number, number, number], anchorB: [number, number, number] }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    usePrismaticJoint({ current: bodyA } as any, { current: bodyB } as any, [anchorA, anchorB, [0, 1, 0]]);
    return null;
};

const JointRenderer: React.FC<JointRendererProps> = ({ joint, getRB }) => {
    const bodyA = getRB(joint.bodyA);
    const bodyB = getRB(joint.bodyB);

    if (!bodyA || !bodyB) return null;

    const anchorA: [number, number, number] = [joint.anchorA.x, joint.anchorA.y, joint.anchorA.z];
    const anchorB: [number, number, number] = [joint.anchorB.x, joint.anchorB.y, joint.anchorB.z];

    switch (joint.type) {
        case 'fixed':
            return <FixedJointComponent bodyA={bodyA} bodyB={bodyB} anchorA={anchorA} anchorB={anchorB} />;
        case 'spherical':
            return <SphericalJointComponent bodyA={bodyA} bodyB={bodyB} anchorA={anchorA} anchorB={anchorB} />;
        case 'revolute':
            return <RevoluteJointComponent bodyA={bodyA} bodyB={bodyB} anchorA={anchorA} anchorB={anchorB} />;
        case 'prismatic':
            return <PrismaticJointComponent bodyA={bodyA} bodyB={bodyB} anchorA={anchorA} anchorB={anchorB} />;
        default:
            return null;
    }
};

interface UniversalRendererProps {
    worldState: WorldState;
    activeNode?: SkillNode | null;
    onCollision?: (impactMagnitude: number) => void;
}

export const UniversalRenderer: React.FC<UniversalRendererProps> = ({ worldState, activeNode, onCollision }) => {
    const [rbMap, setRbMap] = useState<Record<string, RapierRigidBody>>({});
    const [bbCtx, setBbCtx] = useState<BlackboardContext>(blackboard.getContext());

    useEffect(() => {
        return blackboard.subscribe(setBbCtx);
    }, []);

    const registerRb = (id: string, rb: RapierRigidBody | null) => {
        setRbMap(prev => {
            if (rb) {
                if (prev[id] === rb) return prev;
                return { ...prev, [id]: rb };
            } else {
                if (!prev[id]) return prev;
                const next = { ...prev };
                delete next[id];
                return next;
            }
        });
    };

    const getRB = (id: string) => rbMap[id] || null;

    // Routing Logic based on Titan Protocol v3.5
    const mode = activeNode?.engineMode || worldState.mode;

    if (mode === 'LAB' || worldState.mode === 'SCIENTIFIC') {
        const params = worldState.scientificParams;
        return (
            <LabBench 
                scenario={worldState.scenario as any}
                scientificParams={params}
                initialState={params?.initialState as number[]} 
                l1={params?.l1} 
                l2={params?.l2} 
                m1={params?.m1} 
                m2={params?.m2} 
                g={params?.g} 
            />
        );
    }

    if ((mode === 'VOX' || worldState.mode === 'VOXEL') && worldState.voxels) {
        return <VoxelRenderer voxels={worldState.voxels} />;
    }

    // Default to RAP (Physics Engine)
    return (
        <group>
            {/* The Sentinel Overlay (Visual Thinking Feedback) */}
            {worldState.sabotage_reveal && (
                <Html position={[0, 5, 0]} distanceFactor={15}>
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-red-500/20 backdrop-blur-xl border-2 border-red-500 p-6 rounded-3xl shadow-[0_0_50px_rgba(239,68,68,0.3)] w-64 pointer-events-none"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500">Structural Anomaly</span>
                        </div>
                        <p className="text-xs text-red-100 font-bold leading-tight">{worldState.sabotage_reveal}</p>
                    </motion.div>
                </Html>
            )}

            {/* Entities */}
            {worldState.entities?.map(entity => (
                <EntityRenderer
                    key={entity.id}
                    entity={entity}
                    onRegister={registerRb}
                    onCollision={onCollision}
                    blackboardContext={bbCtx}
                />
            ))}

            {/* Joints */}
            {worldState.joints?.map(joint => (
                <JointRenderer
                    key={joint.id}
                    joint={joint}
                    getRB={getRB}
                />
            ))}

            {/* Lighting */}
            <ambientLight intensity={1.5} />
            <pointLight position={[10, 10, 10]} intensity={2} castShadow />
            <directionalLight position={[-5, 5, 5]} intensity={1} />
        </group>
    );
};