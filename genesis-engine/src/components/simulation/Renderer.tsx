'use client';

import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { RigidBody, CuboidCollider, BallCollider, RapierRigidBody, useFixedJoint, useSphericalJoint, useRevoluteJoint, usePrismaticJoint, CollisionEnterPayload } from '@react-three/rapier';
import { Html } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Search } from 'lucide-react';
import { Entity, Joint, VoxelData } from '@/lib/simulation/schema';
import { useTextureGen } from '@/lib/simulation/useTextureGen';
import { LabBench } from './LabBench';
import { VoxelRenderer } from './VoxelRenderer';
import { UniversalCanvas } from './UniversalCanvas';
import { DynamicShaderMaterial } from './DynamicShaderMaterial';
import { StructuralHeatmapSchema } from '@/lib/genkit/schemas';
import { blackboard, BlackboardContext } from '@/lib/genkit/context';
import { useGenesisStore } from '@/lib/store/GenesisContext';
import { ECSRenderer } from './ECSRenderer';
import { syncFromWorldState } from '@/lib/ecs/systems';
import { z } from 'zod';
import { useSynesthesia } from '@/hooks/useSynesthesia';

import { p2p } from '@/lib/multiplayer/P2PConnector';

// ECS Performance Threshold: Switch to ECS when entity count exceeds this
const ECS_THRESHOLD = 50;

const VisualEffectRenderer = ({ events }: { events: any[] }) => {
    return (
        <group>
            {events.map((event, i) => (
                <group key={`${event.entityId}-${event.timestamp}`}>
                    {event.type === 'IMPACT_RIPPLE' && (
                        <mesh position={[event.position?.x || 0, 0, event.position?.z || 0]}>
                            <sphereGeometry args={[0.1, 32, 32]} />
                            <meshBasicMaterial color="#06b6d4" transparent opacity={0.8} />
                            <pointLight color="#06b6d4" intensity={event.magnitude / 10} distance={10} />
                        </mesh>
                    )}
                </group>
            ))}
        </group>
    );
};

const StructuralHeatmapRenderer = ({ heatmap }: { heatmap: z.infer<typeof StructuralHeatmapSchema> }) => {
    return (
        <group>
            {heatmap.points.map((point, i) => (
                <group key={i} position={[point.x, point.y, point.z]}>
                    <mesh>
                        <sphereGeometry args={[0.3, 16, 16]} />
                        <meshBasicMaterial
                            color="#ef4444"
                            transparent
                            opacity={point.severity * 0.6}
                        />
                    </mesh>
                    <pointLight color="#ef4444" intensity={point.severity * 2} distance={3} />
                    {point.reason && (
                        <Html distanceFactor={10} position={[0, 0.5, 0]}>
                            <div className="bg-red-500/90 text-white text-[8px] font-black p-1 rounded whitespace-nowrap uppercase tracking-tighter">
                                {point.reason}
                            </div>
                        </Html>
                    )}
                </group>
            ))}
        </group>
    );
};

interface EntityRendererProps {
    entity: Entity;
    onRegister: (id: string, ref: RapierRigidBody | null) => void;
    onCollision?: (impactMagnitude: number) => void;
    onSelect?: (id: string) => void;
    blackboardContext?: BlackboardContext;
    isSelected?: boolean;
    domain?: 'SCIENCE' | 'HISTORY' | 'MUSIC' | 'TRADE' | 'ABSTRACT';
    drift?: number;
    biomeDamping?: number;
}

const EntityRenderer: React.FC<EntityRendererProps> = ({
    entity,
    onRegister,
    onCollision,
    onSelect,
    blackboardContext,
    isSelected,
    domain = 'SCIENCE',
    drift = 0,
    biomeDamping = 0
}) => {
    const { dispatch } = useGenesisStore();
    const rbRef = useRef<RapierRigidBody>(null);
    const [showCitation, setShowCitation] = useState(false);

    // MODULE P: Reactive Softbody State
    const [softScale, setSoftScale] = useState({ x: 1, y: 1, z: 1 });
    const originalDimensions = useRef(entity.dimensions || { x: 1, y: 1, z: 1 });
    const [shaderTime, setShaderTime] = useState(0);
    const material = useTextureGen({
        prompt: entity.visual.texture,
        color: isSelected ? '#ffffff' : entity.visual.color,
    });

    // Animate shader time for dynamic effects
    useEffect(() => {
        if (!entity.shaderCode) return;
        let animationId: number;
        const startTime = performance.now();
        const animate = () => {
            setShaderTime((performance.now() - startTime) / 1000);
            animationId = requestAnimationFrame(animate);
        };
        animationId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationId);
    }, [entity.shaderCode]);

    // Neural Heatmap Colors
    const getTruthColor = (source?: string) => {
        switch (source) {
            case 'GROUNDED': return '#22c55e'; // Green
            case 'CALCULATED': return '#3b82f6'; // Blue
            case 'METAPHOR': return '#eab308'; // Gold
            default: return null;
        }
    };

    const truthColor = getTruthColor(entity.truthSource);

    useEffect(() => {
        onRegister(entity.id, rbRef.current);
        return () => onRegister(entity.id, null);
    }, [entity.id, onRegister]);

    // Memoize Geometries for Performance
    const { geometry, collider } = React.useMemo(() => {
        const dims = entity.dimensions || { x: 1, y: 1, z: 1 };
        if (entity.shape === 'sphere') {
            return {
                geometry: new THREE.SphereGeometry(dims.x, 32, 32),
                collider: <BallCollider args={[dims.x]} />
            };
        }
        return {
            geometry: new THREE.BoxGeometry(dims.x, dims.y, dims.z),
            collider: <CuboidCollider args={[dims.x / 2, dims.y / 2, dims.z / 2]} />
        };
    }, [entity.shape, entity.dimensions]);

    // Apply Physical Overrides (Quantum Bridge)
    let restitution = entity.physics.restitution;
    let friction = entity.physics.friction;

    if (blackboardContext) {
        if (blackboardContext.environmentalState === 'FROZEN') {
            restitution = Math.max(0, restitution - 0.2);
            friction = Math.min(1, friction + 0.1);
        }
    }

    const handleCollision = (event: CollisionEnterPayload) => {
        if (!onCollision) return;
        // @ts-expect-error - Rapier impulse data mapping
        const impulse = event.totalForceMagnitude || 0;
        if (impulse > 50) {
            onCollision(impulse);

            // MODULE P: Reactive Energy Absorption (Bio-Softbody)
            if (entity.personality?.isSoftBody) {
                const pressure = entity.personality.pressure || 0.5;
                const squashFactor = Math.min(impulse / (500 * pressure), 0.5);
                const k = 1.0 - squashFactor;

                // Volume Preservation: k * (1/sqrt(k)) * (1/sqrt(k)) = 1
                setSoftScale({
                    x: 1 / Math.sqrt(k),
                    y: k,
                    z: 1 / Math.sqrt(k)
                });

                // Elastic snap-back
                setTimeout(() => setSoftScale({ x: 1, y: 1, z: 1 }), 150);
            }

            // FRACTURE CHECK
            const fractureThreshold = entity.neuralPhysics?.fracturePoint || 500;
            if (impulse > fractureThreshold) {
                console.log(`[Fracture] Entity ${entity.id} shattered! (Impulse: ${impulse.toFixed(1)})`);
                dispatch({
                    type: 'SHATTER_ENTITY',
                    payload: {
                        id: entity.id,
                        position: entity.position,
                        color: entity.visual.color
                    }
                });
                return;
            }

            // MODULE A-S: Sync Ripples & Interrupt Sensitivity
            dispatch({ type: 'RECORD_INSTRUMENT_ACTIVITY' });

            p2p.broadcastVisualEvent({
                type: 'IMPACT_RIPPLE',
                entityId: entity.id,
                magnitude: impulse,
                position: entity.position
            });
        }
    };

    useEffect(() => {
        if (!entity.softbody) return;

        const interval = setInterval(() => {
            const rb = rbRef.current;
            if (!rb) return;

            const vel = rb.linvel();
            const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z);
            const volumePres = entity.softbody?.volumePreservation ?? 0.5;

            // Squash & Stretch based on velocity direction
            if (speed > 0.1) {
                const stretch = 1 + (speed * 0.05 * (entity.softbody?.pressure || 1));
                const squash = 1 / Math.sqrt(stretch); // Simplified volume preservation

                // Align stretch with velocity direction (simplified for now: mainly Y bias)
                const isVertical = Math.abs(vel.y) > Math.abs(vel.x) && Math.abs(vel.y) > Math.abs(vel.z);

                if (isVertical) {
                    setSoftScale({
                        x: squash * (1 - volumePres) + volumePres,
                        y: stretch,
                        z: squash * (1 - volumePres) + volumePres
                    });
                } else {
                    setSoftScale({
                        x: stretch,
                        y: squash * (1 - volumePres) + volumePres,
                        z: squash * (1 - volumePres) + volumePres
                    });
                }
            } else {
                setSoftScale({ x: 1, y: 1, z: 1 });
            }
        }, 16); // 60fps local update

        return () => clearInterval(interval);
    }, [entity.softbody, entity.id]);

    return (
        <RigidBody
            ref={rbRef}
            type={entity.isRemote ? 'kinematicPosition' : (entity.physics.isStatic ? 'fixed' : 'dynamic')}
            position={[entity.position.x, entity.position.y, entity.position.z]}
            quaternion={entity.rotation ? [entity.rotation.x, entity.rotation.y, entity.rotation.z, entity.rotation.w] : [0, 0, 0, 1]}
            colliders={false}
            mass={entity.physics.mass}
            friction={friction}
            restitution={restitution}
            linearDamping={biomeDamping + (entity.personality?.linearDamping || 0)}
            onCollisionEnter={handleCollision}
        >
            <mesh
                geometry={geometry}
                material={entity.shaderCode ? undefined : material}
                position={entity.personality?.isNervous ? [
                    Math.sin(shaderTime * 50) * 0.02,
                    Math.cos(shaderTime * 50) * 0.02,
                    Math.sin(shaderTime * 40) * 0.02
                ] : [0, 0, 0]}
                scale={[softScale.x, softScale.y, softScale.z]}
                onClick={(e) => {
                    e.stopPropagation();
                    onSelect?.(entity.id);
                }}
            >
                {/* OMNI-SHADER ENGINE: Use dynamic shader if provided */}
                {entity.shaderCode && (
                    <DynamicShaderMaterial
                        shaderCode={entity.shaderCode}
                        color={entity.visual.color || '#3b82f6'}
                        time={shaderTime}
                        density={entity.neuralPhysics?.elasticity || 0.5}
                        stress={Math.max(
                            entity.physics.mass > 50 ? 0.8 : (entity.isUnstable ? 0.5 : 0.0),
                            blackboardContext?.userVibe.intensity || 0
                        )}
                        drift={drift + (blackboardContext?.userVibe.intensity || 0) * 0.5}
                        isManifesting={entity.truthSource === 'METAPHOR'} // MOCK: Generative objects glow
                        isTransparent={entity.visual.texture?.toLowerCase().includes('glass') || entity.visual.texture?.toLowerCase().includes('transparent')}
                        domain={domain}
                        velocity={rbRef.current?.linvel() || { x: 0, y: 0, z: 0 }}
                        elasticity={entity.neuralPhysics?.elasticity || 0.1}
                        certainty={entity.certainty}
                        shimmer={entity.disagreementScore}
                    />
                )}
                {truthColor && (
                    <mesh geometry={geometry} position={[0, 0, 0]} scale={1.05}>
                        <meshBasicMaterial color={truthColor} transparent opacity={0.2} wireframe />
                    </mesh>
                )}
            </mesh>
            {truthColor && <pointLight color={truthColor} intensity={0.5} distance={2} />}
            {collider}

            {/* PROBABILITY CLOUDS (v30.0) */}
            {blackboardContext?.xRayMode && entity.probabilitySnapshots && entity.probabilitySnapshots.length > 0 && (
                <group>
                    {entity.probabilitySnapshots.map((snap, idx) => (
                        <mesh
                            key={`prob-${idx}`}
                            geometry={geometry}
                            position={[snap.position.x - entity.position.x, snap.position.y - entity.position.y, snap.position.z - entity.position.z]}
                            quaternion={[snap.rotation.x, snap.rotation.y, snap.rotation.z, snap.rotation.w]}
                            scale={0.9}
                        >
                            <meshBasicMaterial color={entity.visual.color} transparent opacity={0.05} wireframe />
                        </mesh>
                    ))}
                </group>
            )}

            {/* ANALOGY LABEL */}
            {entity.analogyLabel && (
                <Html distanceFactor={10} position={[0, (entity.dimensions?.y || 1) / 2 + 0.5, 0]}>
                    <div className="bg-black/80 border border-blue-500/50 text-blue-400 px-2 py-1 rounded text-[10px] font-black uppercase whitespace-nowrap shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                        {entity.analogyLabel}
                    </div>
                </Html>
            )}

            {/* CITATION ICON */}
            {entity.citation && (
                <Html distanceFactor={8} position={[0, -(entity.dimensions?.y || 1) / 2 - 0.5, 0]}>
                    <div className="relative group">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowCitation(!showCitation);
                            }}
                            className={`p-1.5 rounded-full border transition-all ${showCitation ? 'bg-cyan-500 border-cyan-400 text-black' : 'bg-black/60 border-white/20 text-cyan-400 hover:border-cyan-500/50'}`}
                        >
                            <BookOpen className="w-3 h-3" />
                        </button>

                        <AnimatePresence>
                            {showCitation && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 bg-black/90 backdrop-blur-xl border border-cyan-500/30 p-3 rounded-xl shadow-2xl pointer-events-auto"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <Search className="w-2.5 h-2.5 text-cyan-400" />
                                        <span className="text-[8px] font-black uppercase tracking-widest text-cyan-400">Grounding Source</span>
                                    </div>
                                    <p className="text-[10px] font-bold text-white mb-1">{entity.citation.source}</p>
                                    {entity.citation.snippet && (
                                        <p className="text-[9px] text-gray-400 italic leading-tight line-clamp-3">&quot;{entity.citation.snippet}&quot;</p>
                                    )}
                                    {entity.citation.url && (
                                        <a
                                            href={entity.citation.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-2 block text-[8px] text-cyan-500 hover:underline truncate"
                                        >
                                            {entity.citation.url}
                                        </a>
                                    )}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-black/90" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </Html>
            )}
        </RigidBody>
    );
};

const GhostRenderer = ({ entities }: { entities: any[] }) => {
    // Shared time for all ghosts
    const [time, setTime] = useState(0);

    useEffect(() => {
        let animationId: number;
        const startTime = performance.now();
        const animate = () => {
            setTime((performance.now() - startTime) / 1000);
            animationId = requestAnimationFrame(animate);
        };
        animationId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationId);
    }, []);

    return (
        <group>
            {entities.map((entity, i) => (
                <mesh
                    key={`ghost-${entity.id}-${i}`}
                    position={[entity.position.x, entity.position.y, entity.position.z]}
                    quaternion={entity.rotation ? [entity.rotation.x, entity.rotation.y, entity.rotation.z, entity.rotation.w] : [0, 0, 0, 1]}
                >
                    <boxGeometry args={[1, 1, 1]} />
                    {/* GHOST SHADER (v27.0): Ethereal trail effect */}
                    <DynamicShaderMaterial
                        shaderCode={`
                            void main() {
                                float alpha = 0.3 - (vPosition.y * 0.1);
                                float streak = sin(vPosition.z * 10.0 - uTime * 5.0);
                                float speed = length(uVelocity);
                                vec3 ghostColor = vec3(0.2, 0.4, 1.0);
                                gl_FragColor = vec4(ghostColor, alpha * streak * 0.5 * (1.0 + speed));
                            }
                        `}
                        color="#3b82f6"
                        isTransparent={true}
                        domain="ABSTRACT"
                        time={time}
                        velocity={entity.velocity || { x: 0, y: 0, z: 0 }}
                    />
                </mesh>
            ))}
        </group>
    );
};

interface JointRendererProps {
    joint: Joint;
    getRB: (id: string) => RapierRigidBody | null;
}

const FixedJointComponent = ({ bodyA, bodyB, anchorA, anchorB }: { bodyA: RapierRigidBody, bodyB: RapierRigidBody, anchorA: [number, number, number], anchorB: [number, number, number] }) => {
    useFixedJoint(
        { current: bodyA } as React.RefObject<RapierRigidBody>,
        { current: bodyB } as React.RefObject<RapierRigidBody>,
        [anchorA, [0, 0, 0, 1], anchorB, [0, 0, 0, 1]]
    );
    return null;
};

const SphericalJointComponent = ({ bodyA, bodyB, anchorA, anchorB }: { bodyA: RapierRigidBody, bodyB: RapierRigidBody, anchorA: [number, number, number], anchorB: [number, number, number] }) => {
    useSphericalJoint(
        { current: bodyA } as React.RefObject<RapierRigidBody>,
        { current: bodyB } as React.RefObject<RapierRigidBody>,
        [anchorA, anchorB]
    );
    return null;
};

const RevoluteJointComponent = ({ bodyA, bodyB, anchorA, anchorB }: { bodyA: RapierRigidBody, bodyB: RapierRigidBody, anchorA: [number, number, number], anchorB: [number, number, number] }) => {
    useRevoluteJoint(
        { current: bodyA } as React.RefObject<RapierRigidBody>,
        { current: bodyB } as React.RefObject<RapierRigidBody>,
        [anchorA, anchorB, [0, 1, 0]]
    );
    return null;
};

const PrismaticJointComponent = ({ bodyA, bodyB, anchorA, anchorB }: { bodyA: RapierRigidBody, bodyB: RapierRigidBody, anchorA: [number, number, number], anchorB: [number, number, number] }) => {
    usePrismaticJoint(
        { current: bodyA } as React.RefObject<RapierRigidBody>,
        { current: bodyB } as React.RefObject<RapierRigidBody>,
        [anchorA, anchorB, [0, 1, 0]]
    );
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
    onCollision?: (impactMagnitude: number) => void;
    biomeDamping?: number;
}

export const UniversalRenderer: React.FC<UniversalRendererProps> = ({ onCollision, biomeDamping = 0 }) => {
    const [rbMap, setRbMap] = useState<Record<string, RapierRigidBody>>({});
    const [bbCtx, setBbCtx] = useState<BlackboardContext>(blackboard.getContext());
    const [visualEvents, setVisualEvents] = useState<any[]>([]);
    const { state, dispatch } = useGenesisStore();
    const { worldState, activeNode, selectedEntityId } = state;

    // MODULE S: Synesthesia (Physics-to-Audio)
    useSynesthesia(worldState._kineticEnergy || 0, state.isProcessing ? 0.8 : 0);

    useEffect(() => {
        const unsubscribe = blackboard.subscribe(setBbCtx);
        const unp2p = p2p.onVisualEvent((event) => {
            setVisualEvents(prev => [...prev, event]);
            setTimeout(() => {
                setVisualEvents(prev => prev.filter(e => e !== event));
            }, 2000);
        });

        return () => {
            unsubscribe();
            unp2p();
        };
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

    const handleSelect = (id: string) => {
        if (id === selectedEntityId) {
            dispatch({ type: 'DESELECT_ENTITY' });
        } else {
            dispatch({ type: 'SELECT_ENTITY', payload: id });
        }
    };

    const mode = activeNode?.engineMode || worldState.mode;

    const handleCanvasFailure = (err: string) => {
        dispatch({
            type: 'ADD_MISSION_LOG',
            payload: {
                agent: 'Sentinel',
                message: `GPU Alert: ${err}. Falling back to stable Voxel mode.`,
                type: 'ERROR'
            }
        });

        // Force Voxel Fallback: Generate generic voxels if custom code fails
        dispatch({
            type: 'SYNC_WORLD',
            payload: {
                ...worldState,
                mode: 'VOXEL',
                custom_canvas_code: undefined,
                voxels: [
                    { x: 0, y: 0, z: 0, color: '#3b82f6' },
                    { x: 1, y: 0, z: 0, color: '#3b82f6' },
                    { x: 0, y: 1, z: 0, color: '#3b82f6' }
                ]
            }
        });
    };

    const entities = worldState.entities || [];
    const voxels = worldState.voxels || [];

    // --- ECS PERFORMANCE MANAGEMENT ---
    useEffect(() => {
        if (entities.length > ECS_THRESHOLD) {
            console.log(`[Renderer] Syncing ${entities.length} entities to ECS world (Threshold: ${ECS_THRESHOLD})`);
            syncFromWorldState(worldState);
        }
    }, [worldState, entities.length]);

    const calculateDrift = (entityId: string, currentPos: { x: number, y: number, z: number }) => {
        if (!worldState._computedTrajectories) return 0;
        const trajectory = worldState._computedTrajectories.find((t: any) => t.id === entityId);
        if (!trajectory || trajectory.path.length === 0) return 0;

        // Compare current position with the last point of the predicted path (as a simple heuristic)
        const predicted = trajectory.path[trajectory.path.length - 1];
        const dist = Math.sqrt(
            Math.pow(currentPos.x - predicted.x, 2) +
            Math.pow(currentPos.y - predicted.y, 2) +
            Math.pow(currentPos.z - predicted.z, 2)
        );

        return dist > 0.5 ? Math.min((dist - 0.5) / 5, 1.0) : 0;
    };

    if (worldState.custom_canvas_code) {

        return (
            <Html transform position={[0, 0, 0]}>
                <UniversalCanvas
                    customCode={worldState.custom_canvas_code}
                    onFailure={handleCanvasFailure}
                />
            </Html>
        );
    }

    if (mode === 'SCIENTIFIC') {
        const params = worldState.scientificParams;
        return (
            <LabBench
                scenario={worldState.scenario}
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

    const hasGround = entities.some(e => e.id === 'ground' || e.name?.toLowerCase().includes('ground'));

    // MODULE E: Environment Presets (Atmospheric Context)
    const domain = (worldState.domain || 'SCIENCE') as keyof typeof presets;
    const presets = {
        SCIENCE: { ambient: 1.5, point: 2, fogColor: '#020617', fogNear: 10, fogFar: 50 },
        HISTORY: { ambient: 0.8, point: 1.5, fogColor: '#2d1b0e', fogNear: 5, fogFar: 30 },
        MUSIC: { ambient: 1.2, point: 3, fogColor: '#1e0b36', fogNear: 15, fogFar: 60 },
        ABSTRACT: { ambient: 0.5, point: 5, fogColor: '#000000', fogNear: 2, fogFar: 20 },
        TRADE: { ambient: 2.0, point: 1, fogColor: '#111827', fogNear: 20, fogFar: 100 }
    } as const;
    const currentPreset = presets[domain] || presets.SCIENCE;

    return (
        <group onPointerMissed={() => dispatch({ type: 'DESELECT_ENTITY' })}>
            <color attach="background" args={[currentPreset.fogColor]} />
            <fog attach="fog" args={[currentPreset.fogColor, currentPreset.fogNear, currentPreset.fogFar]} />

            <VoxelRenderer voxels={voxels} />
            <VisualEffectRenderer events={visualEvents} />

            {domain === 'MUSIC' && (
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 0]} receiveShadow>
                    <planeGeometry args={[100, 100, 64, 64]} />
                    <DynamicShaderMaterial
                        shaderCode={`
                            void main() {
                                float dist = length(vPosition.xz);
                                float ripple = sin(dist * 2.0 - uTime * 5.0) * 0.1;
                                vec3 color = mix(uColor, vec3(0.1, 0.0, 0.2), dist * 0.02);
                                gl_FragColor = vec4(color + ripple, 0.8);
                            }
                        `}
                        color="#8b5cf6"
                        domain="MUSIC"
                        isTransparent
                    />
                </mesh>
            )}

            {state.structuralHeatmap && <StructuralHeatmapRenderer heatmap={state.structuralHeatmap} />}
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

            {!hasGround && (
                <RigidBody type="fixed" position={[0, -0.5, 0]}>
                    <mesh receiveShadow>
                        <boxGeometry args={[100, 1, 100]} />
                        <meshStandardMaterial color="#111" />
                    </mesh>
                    <CuboidCollider args={[50, 0.5, 50]} />
                </RigidBody>
            )}

            {/* ECS PERFORMANCE SWITCH: Use GPU-optimized renderer for large scenes */}
            {entities.length > ECS_THRESHOLD ? (
                <ECSRenderer
                    onCollision={onCollision}
                    onSelect={handleSelect}
                />
            ) : entities.length > 0 ? entities.map(entity => (

                <EntityRenderer
                    key={entity.id}
                    entity={entity}
                    onRegister={registerRb}
                    onCollision={onCollision}
                    onSelect={handleSelect}
                    isSelected={entity.id === state.selectedEntityId}
                    blackboardContext={bbCtx}
                    domain={domain}
                    drift={calculateDrift(entity.id, entity.position)}
                    biomeDamping={biomeDamping}
                />
            )) : (
                <group>
                    <EntityRenderer
                        entity={{
                            id: 'sentinel-obelisk',
                            shape: 'box',
                            position: { x: 0, y: 4, z: 0 },
                            rotation: { x: 0, y: 0, z: 0, w: 1 },
                            dimensions: { x: 0.5, y: 8, z: 0.5 },
                            physics: { mass: 0, friction: 0.5, restitution: 0.5, isStatic: true },
                            visual: {
                                color: '#3b82f6',
                                texture: 'glowing obsidian with neon blue circuits'
                            },
                            certainty: 1.0,
                            name: 'Quantum Obelisk'
                        }}
                        onRegister={registerRb}
                        onCollision={onCollision}
                        onSelect={handleSelect}
                        isSelected={'sentinel-obelisk' === state.selectedEntityId}
                        blackboardContext={bbCtx}
                        domain={domain}
                        biomeDamping={biomeDamping}
                    />
                    {/* Visual Flare for the Obelisk */}
                    <pointLight position={[0, 5, 0]} intensity={5} color="#3b82f6" />
                </group>
            )}

            {worldState.joints?.map(joint => (

                <JointRenderer key={joint.id} joint={joint} getRB={getRB} />

            ))}

            {/* OMEGA LOOP: Ghost Projections of the Future */}
            {worldState.omegaPoint && (
                <GhostRenderer entities={worldState.omegaPoint} />
            )}

            <ambientLight intensity={currentPreset.ambient} />

            <pointLight position={[10, 10, 10]} intensity={currentPreset.point} castShadow />

            <directionalLight position={[-5, 5, 5]} intensity={1} />

        </group>

    );

};

