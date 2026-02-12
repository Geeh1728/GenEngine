'use client';

import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody, RapierRigidBody, useFixedJoint, useRevoluteJoint, useSphericalJoint } from '@react-three/rapier';
import { Instances, Instance } from '@react-three/drei';
import * as THREE from 'three';
import { ecsWorld, renderableEntities, getEntityCount, jointEntities } from '@/lib/ecs/world';
import { syncFromRapier, registerRigidBody, selectEntity, getRenderTransforms, RenderTransform, runHarmonicSync, applyChronesthesia, runEgregorCheck, runEvolutionarySelection } from '@/lib/ecs/systems';
import { DynamicShaderMaterial } from './DynamicShaderMaterial';
import { timeTurner, useTimeTurner } from '@/lib/store/TimeTurnerStore';
import { newtonEngine } from '@/lib/simulation/newton-engine';
import { useGenesisStore } from '@/hooks/useGenesisStore';
import { p2p } from '@/lib/multiplayer/P2PConnector';
import { lodManager, LODState } from '@/lib/simulation/lod-manager';
import { blackboard, BlackboardContext } from '@/lib/genkit/context';
import { useEvolutionarySelection } from '@/hooks/useEvolutionarySelection';
import { useDreamLogic } from '@/hooks/useDreamLogic';
import { useTimeline } from '@/hooks/useTimeline';
import { useHaptics } from '@/hooks/useHaptics';
import { Line, Float, Text, Html } from '@react-three/drei';
import { queryResiduesAction } from '@/app/actions';
import { SystemVitals } from '../ui/SystemVitals';
import { ArchitecturalResidue } from '@/lib/db/residue';

/**
 * ECS Renderer: High-performance entity rendering using GPU instancing.
 * Upgraded (v19.0): Integrated Newton Engine for physical law discovery.
 * Upgraded (v30.0): Module Spider - Knowledge Graph Visualization.
 * Upgraded (v35.0): The Living Ontology - Physicalized Knowledge Graph with Truth Vibration.
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
    star: new THREE.OctahedronGeometry(0.5, 0), // Placeholder for star
    hook: new THREE.TorusGeometry(0.3, 0.1, 8, 16, Math.PI), // Placeholder for hook
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
    }
`;

const GHOST_FRAG = `
    uniform float uTime;
    uniform vec3 uColor;
    uniform float uDrift;
    uniform vec3 uVelocity;
    varying vec2 vUv;
    varying vec3 vNormal;
    void main() {
        float speed = length(uVelocity);
        float pulse = (sin(uTime * (3.0 + speed * 0.1)) + 1.0) / 2.0;
        
        // Color shifts to cyan/white when moving fast or when high drift
        vec3 baseGhost = mix(uColor, vec3(0.7, 0.9, 1.0), uDrift);
        vec3 ghostColor = mix(baseGhost, vec3(1.0), 0.2 + speed * 0.01);
        
        float edge = pow(1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0), 2.0);
        
        // Jitter opacity if drift is high
        float agitation = uDrift * sin(uTime * 50.0) * 0.1;
        float alpha = clamp(0.2 + edge * 0.5 * pulse + agitation, 0.0, 1.0);
        
        gl_FragColor = vec4(ghostColor, alpha);
    }
`;

const CausalThread = ({ start, end, intensity = 1.0 }: { start: [number, number, number], end: [number, number, number], intensity?: number }) => {
    const points = useMemo(() => [new THREE.Vector3(...start), new THREE.Vector3(...end)], [start, end]);
    return (
        <line>
            <bufferGeometry attach="geometry" {...new THREE.BufferGeometry().setFromPoints(points)} />
            <lineBasicMaterial attach="material" color="#60a5fa" transparent opacity={0.4 * intensity} linewidth={1} />
        </line>
    );
};

interface RapierJointProps {
    joint: {
        id: string;
        type: 'fixed' | 'spherical' | 'revolute' | 'prismatic';
        bodyA: string;
        bodyB: string;
        anchorA: { x: number; y: number; z: number };
        anchorB: { x: number; y: number; z: number };
    };
    bodyARef: React.RefObject<RapierRigidBody>;
    bodyBRef: React.RefObject<RapierRigidBody>;
}

interface PredictionSnapshots {
    id: string;
    snapshots: Array<{
        x: number;
        y: number;
        z: number;
        rotation: { x: number; y: number; z: number; w: number };
    }>;
}

interface KnowledgeNodeData {
    id: string;
    label: string;
    type: 'CONCEPT' | 'ENTITY' | 'FORCE';
    description?: string;
    certainty: number;
    timestamp?: number;
}

interface KnowledgeEdgeData {
    source: string;
    target: string;
    label?: string;
    strength: number;
}

interface KnowledgeGraphData {
    nodes: KnowledgeNodeData[];
    edges: KnowledgeEdgeData[];
    ghostEdges?: {
        source: string;
        target: string;
        label?: string;
        userId?: string;
    }[];
}

/**
 * MODULE SPIDER: Physicalized Knowledge Node (v35.0)
 */
function KnowledgeNode({ node, position, onSelect, onUpdate, isGlow }: { 
    node: KnowledgeNodeData, 
    position: [number, number, number], 
    onSelect: (id: string) => void,
    onUpdate: (pos: THREE.Vector3) => void,
    isGlow?: boolean
}) {
    const rbRef = useRef<RapierRigidBody>(null);
    const { mouse, camera } = useThree();
    const isFixed = node.certainty >= 0.95;

    useFrame((state) => {
        if (!rbRef.current) return;
        
        // Notify parent of current position
        const currentPos = rbRef.current.translation();
        const nodeVec = new THREE.Vector3(currentPos.x, currentPos.y, currentPos.z);
        onUpdate(nodeVec);

        // LOGIC MAGNETS (v32.0)
        const mouseVec = new THREE.Vector3(mouse.x, mouse.y, 0.5).unproject(camera);
        const dir = mouseVec.sub(camera.position).normalize();
        const distToCamera = -camera.position.z / dir.z;
        const planePos = camera.position.clone().add(dir.multiplyScalar(distToCamera));
        
        const distToMouse = nodeVec.distanceTo(planePos);
        if (distToMouse < 2.0) {
            // Magnetic attraction to cursor
            const attraction = new THREE.Vector3().subVectors(planePos, nodeVec).multiplyScalar(0.2);
            rbRef.current.applyImpulse(attraction, true);
            
            // Cursor Snapping effect: Haptic feedback if available
            if (distToMouse < 0.5 && typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(10);
            }
        }

        if (isGlow) {
            // VIOLET GLOW VIBRATION (High strength relationship)
            const vibration = Math.sin(state.clock.elapsedTime * 20) * 0.02;
            rbRef.current.applyImpulse({ x: vibration, y: vibration, z: vibration }, true);
        }

        if (isFixed) return;
        
        // Truth Vibration: Low certainty nodes 'drift' more
        const truthVibration = (1 - node.certainty) * Math.sin(state.clock.elapsedTime * 5) * 0.1;
        rbRef.current.applyImpulse({ x: 0, y: truthVibration, z: 0 }, true);
    });

    return (
        <RigidBody
            ref={rbRef}
            position={position}
            type={isFixed ? 'fixed' : 'dynamic'}
            colliders="ball"
            linearDamping={2}
            angularDamping={2}
            userData={{ nodeId: node.id }}
        >
            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                <mesh onClick={() => onSelect(node.id)}>
                    <sphereGeometry args={[0.6, 16, 16]} />
                    <meshStandardMaterial 
                        color={isGlow ? '#8b5cf6' : (node.type === 'FORCE' ? '#ef4444' : node.type === 'ENTITY' ? '#10b981' : '#60a5fa')} 
                        emissive={isGlow ? '#7c3aed' : (node.type === 'FORCE' ? '#7f1d1d' : '#1e3a8a')}
                        emissiveIntensity={isGlow ? 2.0 : 0.5}
                        transparent
                        opacity={node.certainty || 1}
                    />
                </mesh>
                <Text
                    position={[0, 1, 0]}
                    fontSize={0.3}
                    color={isGlow ? "#d8b4fe" : "white"}
                    anchorX="center"
                    anchorY="middle"
                >
                    {node.label}
                </Text>
            </Float>
            <pointLight distance={3} intensity={isGlow ? 1.5 : 0.5} color={isGlow ? '#a855f7' : (node.type === 'FORCE' ? '#ff0000' : '#0088ff')} />
        </RigidBody>
    );
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

/**
 * MODULE SPIDER: The Living Ontology Graph (v35.0)
 */
function LivingOntologyGraph({ 
    graph, 
    discoveryYear,
    chronesthesiaEnabled,
    onSelect 
}: { 
    graph: KnowledgeGraphData, 
    discoveryYear: number,
    chronesthesiaEnabled: boolean,
    onSelect: (id: string) => void 
}) {
    // 1. CHRONESTHESIA FILTERING: Remove nodes from the future
    const visibleNodes = useMemo(() => {
        if (!chronesthesiaEnabled) return graph.nodes;
        return graph.nodes.filter((n) => !n.timestamp || n.timestamp <= discoveryYear);
    }, [graph.nodes, discoveryYear, chronesthesiaEnabled]);

    const visibleEdges = useMemo(() => {
        const nodeIds = new Set(visibleNodes.map((n) => n.id));
        return graph.edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));
    }, [visibleNodes, graph.edges]);

    // Identification of high-strength related nodes (v32.0)
    const glowNodeIds = useMemo(() => {
        const ids = new Set<string>();
        visibleEdges.forEach(e => {
            if (e.strength > 0.8) {
                ids.add(e.source);
                ids.add(e.target);
            }
        });
        return ids;
    }, [visibleEdges]);

    const [nodePositions, setNodePositions] = useState<Record<string, THREE.Vector3>>({});
    
    // Initial layout
    const initialPositions = useMemo(() => {
        const pos: Record<string, [number, number, number]> = {};
        graph.nodes.forEach((node, i) => {
            const angle = (i / graph.nodes.length) * Math.PI * 2;
            const radius = 10 + Math.sin(i) * 3;
            pos[node.id] = [
                Math.cos(angle) * radius,
                Math.sin(i * 0.5) * 5 + 5,
                Math.sin(angle) * radius
            ];
        });
        return pos;
    }, [graph]);

    // Track node positions for edges
    const handleNodeUpdate = useCallback((id: string, pos: THREE.Vector3) => {
        setNodePositions(prev => ({ ...prev, [id]: pos }));
    }, []);

    return (
        <group name="knowledge-spider">
            {visibleNodes.map((node) => (
                <KnowledgeNode 
                    key={node.id} 
                    node={node} 
                    position={initialPositions[node.id]} 
                    isGlow={glowNodeIds.has(node.id)}
                    onSelect={onSelect}
                    onUpdate={(pos) => handleNodeUpdate(node.id, pos)}
                />
            ))}

            {visibleEdges.map((edge, i) => (
                <KnowledgeEdge 
                    key={`edge-${edge.source}-${edge.target}`} 
                    edge={edge} 
                    start={nodePositions[edge.source]} 
                    end={nodePositions[edge.target]}
                />
            ))}

            {graph.ghostEdges?.map((edge, i) => (
                <KnowledgeEdge 
                    key={`ghost-${edge.source}-${edge.target}`} 
                    edge={edge} 
                    start={nodePositions[edge.source]} 
                    end={nodePositions[edge.target]}
                    isGhost={true}
                />
            ))}
        </group>
    );
}

/**
 * MODULE SPIDER: Semantic Link (Spring Edge)
 */
function KnowledgeEdge({ edge, start, end, isGhost }: { edge: KnowledgeEdgeData, start?: THREE.Vector3, end?: THREE.Vector3, isGhost?: boolean }) {
    const lineRef = useRef<any>(null);

    useFrame(() => {
        if (lineRef.current && start && end) {
            (lineRef.current as any).setPoints([start, end]);
        }
    });

    if (!start || !end) return null;

    return (
        <Line
            ref={lineRef}
            points={[start, end]}
            color={isGhost ? "#8b5cf6" : "#ffffff"}
            lineWidth={isGhost ? 1 : (edge.strength || 0.5) * 2}
            transparent
            opacity={isGhost ? 0.6 : 0.3}
            dashed={isGhost}
            dashScale={2}
        />
    );
}

/**
 * MODULE K: KINETIC HUD (v31.0 - Fellow Scholar)
 * Objective: Render real-time calculus overlays above moving entities.
 */
function KineticLabel({ body, label }: { body: RapierRigidBody, label: string }) {
    const textRef = useRef<any>(null);
    
    useFrame(() => {
        if (!textRef.current) return;
        const vel = body.linvel();
        const speed = Math.sqrt(vel.x ** 2 + vel.y ** 2 + vel.z ** 2);
        
        if (speed > 0.1) {
            const pos = body.translation();
            textRef.current.position.set(pos.x, pos.y + 1.5, pos.z);
            (textRef.current as any).text = `${label}: v = ${speed.toFixed(2)}m/s\nΔv/Δt = ${(speed / 0.016).toFixed(1)}`;
            textRef.current.visible = true;
        } else {
            textRef.current.visible = false;
        }
    });

    return (
        <Text
            ref={textRef}
            fontSize={0.25}
            color="#60a5fa"
            anchorX="center"
            anchorY="middle"
            opacity={0.6}
            font="/fonts/JetBrainsMono-Bold.woff"
        />
    );
}

/**
 * MODULE HUD: Living Citation Overlay (v32.5)
 * Objective: Render floating physical principles next to entities.
 */
function LivingCitation({ position, text, status }: { position: [number, number, number], text: string, status: 'VERIFIED' | 'VIOLATION' }) {
    return (
        <group position={position}>
            <Float speed={5} rotationIntensity={0.2} floatIntensity={0.5}>
                <mesh position={[0, 0.5, 0]}>
                    <planeGeometry args={[text.length * 0.12, 0.4]} />
                    <meshBasicMaterial 
                        color={status === 'VERIFIED' ? "#10b981" : "#f59e0b"} 
                        transparent 
                        opacity={0.2} 
                    />
                </mesh>
                <Text
                    fontSize={0.15}
                    color={status === 'VERIFIED' ? "#34d399" : "#fbbf24"}
                    anchorX="center"
                    anchorY="middle"
                    font="/fonts/GeistMono-Bold.ttf"
                >
                    {text}
                </Text>
                {/* Aether Glow (v2) */}
                <pointLight 
                    intensity={1} 
                    distance={2} 
                    color={status === 'VERIFIED' ? "#10b981" : "#f59e0b"} 
                />
            </Float>
        </group>
    );
}

export function ECSRenderer({ onCollision, onSelect }: ECSRendererProps) {
    const { camera } = useThree();
    const { state, dispatch } = useGenesisStore();
    const [isWorkerReady, setIsWorkerReady] = useState(false);
    const [transforms, setTransforms] = useState<RenderTransform[]>([]);
    const [entityCount, setEntityCount] = useState(0);
    const [xRayMode, setXRayMode] = useState(false);
    const [lodState, setLodState] = useState<LODState>(lodManager.getState());
    const [predictions, setPredictions] = useState<PredictionSnapshots[]>([]);
    const [blackboardContext, setBlackboardContext] = useState<BlackboardContext>(blackboard.getContext());
    const [residues, setResidues] = useState<ArchitecturalResidue[]>([]);
    const { pinBranch } = useTimeline();
    
    // v50.0: Activate Structural Pain Haptics
    useHaptics();

    const globalShimmer = (100 - blackboardContext.consensusScore) / 100;

    useEffect(() => {
        return blackboard.subscribe((ctx) => setBlackboardContext(ctx));
    }, []);

    // v31.0: Temporal Mirroring - Query residues when world state changes
    useEffect(() => {
        if (state.worldState?.scenario) {
            const fetchResidues = async () => {
                const results = await queryResiduesAction(state.worldState.scenario.split(' ')[0]);
                setResidues(results.slice(0, 3));
            };
            fetchResidues();
        }
    }, [state.worldState?.scenario]);

    // v29.0 Advanced Consciousness Hooks
    useEvolutionarySelection();
    useDreamLogic();

    const workerRef = useRef<Worker | null>(null);
    const sharedBufferRef = useRef<Float32Array | null>(null);
    const historyRef = useRef<RenderTransform[][]>([]);
    const lastVelocities = useRef<Map<string, THREE.Vector3>>(new Map());
    const [rigidBodies, setRigidBodies] = useState<Map<string, RapierRigidBody>>(new Map());

    const USE_GHOST_KERNEL = true;
    const HISTORY_MAX_FRAMES = 600;

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                setXRayMode(prev => {
                    const next = !prev;
                    blackboard.update({ xRayMode: next });
                    return next;
                });
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        const unsubscribe = p2p.onVisualEvent((event) => {
            if (event.type === 'COLLECTIVE_SHATTER') {
                console.warn("[Hegemony] Collective Shatter Event Received.");
                ecsWorld.entities.forEach(entity => {
                    if (!entity.physics.isStatic && !entity.isHidden) {
                        dispatch({
                            type: 'SHATTER_ENTITY',
                            payload: {
                                id: entity.id,
                                position: entity.position,
                                color: entity.visual?.color || '#ffffff'
                            }
                        });
                    }
                });
            }
        });
        return () => unsubscribe();
    }, [dispatch]);

    useEffect(() => {
        if (!USE_GHOST_KERNEL) return;
        const worker = new Worker(new URL('../../lib/physics/physics-worker.ts', import.meta.url));
        const sab = new SharedArrayBuffer(4000 * 4);
        const floatView = new Float32Array(sab);
        
        // v60.0 GOLD: Key is now secured via Proxy Route
        worker.postMessage({ 
            type: 'INIT', 
            payload: { 
                buffer: sab
            } 
        });
        
        worker.onmessage = (e) => {
            if (e.data.type === 'ORACLE_PREDICTION') {
                setPredictions(e.data.predictions);
            } else if (e.data.type === 'DISSONANCE_SHATTER') {
                // v50.0 Aetheric Resonance: High dissonance shatters non-static entities
                // v60.0 Neural Hegemony: Broadcast to mesh
                p2p.broadcastShatter(state.worldState?._resonanceBalance || 0);

                ecsWorld.entities.forEach(entity => {
                    if (!entity.physics.isStatic && !entity.isHidden) {
                        dispatch({
                            type: 'SHATTER_ENTITY',
                            payload: {
                                id: entity.id,
                                position: entity.position,
                                color: entity.visual?.color || '#ffffff'
                            }
                        });
                    }
                });
            } else if (e.data.type === 'ASTRA_VOICE') {
                // v60.0: Unified Astra Notification
                dispatch({
                    type: 'ADD_MISSION_LOG',
                    payload: {
                        agent: 'Astra',
                        message: e.data.payload,
                        type: 'SUCCESS'
                    }
                });
            }
        };

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
                texture: e.renderable.texturePrompt,
                behavior: e.behavior // Pass behavior to worker
            })),
            joints: jointEntities.entities.map(j => j.joint),
            explosivePotential: state.worldState?.explosive_potential || 0,
            axiomFilter: state.worldState?.axiom_filter,
            _resonanceBalance: state.worldState?._resonanceBalance,
            vectorWind: state.vectorWind
        };
        workerRef.current.postMessage({ type: 'SYNC_WORLD', payload });
    }, [isWorkerReady, entityCount, state.worldState?.explosive_potential, state.worldState?.axiom_filter, state.worldState?._resonanceBalance, state.vectorWind]);

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

        // v33.0: THE NEURAL TRACE (Provenance HUD)
        // If the object is speculative (Muddy), log its metadata trail to the blackboard
        const entity = ecsWorld.entities.find(e => e.id === id);
        if (entity && entity.certainty < 0.6) {
            const source = entity.renderable.truthSource || 'DeepSeek';
            const label = entity.selectable.name || 'Object';
            blackboard.log('NeuralTrace', `Inspecting [${label}]: Metaphor derived via [Librarian] -> Citation Missing -> [${source}] -> Hallucination Risk Detected.`, 'THOUGHT');
        }
    };

    const { isPlaying, currentIndex } = useTimeTurner();

    useFrame(({ clock }) => {
        const delta = clock.getDelta();

        // Track 3: Harmonic Sync
        if (isPlaying) {
            runHarmonicSync(delta);
            
            // v29.0 Systems
            applyChronesthesia();
            runEgregorCheck();
        }

        // Update LOD
        const targetPos = new THREE.Vector3(0, 0, 0); // Assuming center for now, or use orbit controls target if available
        const newLodState = lodManager.update(camera, targetPos);
        if (newLodState.currentLayer !== lodState.currentLayer) {
             lodManager.performSemanticSwap(lodState.currentLayer, newLodState.currentLayer, ecsWorld);
             setLodState(newLodState);
        }

        // v35.5: Semantic Pruning (Performance Optimization)
        lodManager.performSemanticPruning(camera, ecsWorld);

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

                if (e.isHidden) continue;

                // NEWTON ENGINE: Record trajectory
                newtonEngine.record(e.id, {
                    t: clock.getElapsedTime(),
                    pos: { x: buffer[offset], y: buffer[offset + 1], z: buffer[offset + 2] },
                    vel: { x: 0, y: 0, z: 0 } // Velocity inferred in NewtonEngine if needed
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
                e.physics.velocity = { x: velocity.x, y: velocity.y, z: velocity.z };

                e.position.x = buffer[offset];
                e.position.y = buffer[offset + 1];
                e.position.z = buffer[offset + 2];
                if (!e.rotation) e.rotation = { x: 0, y: 0, z: 0, w: 1 };
                e.rotation.x = buffer[offset + 3];
                e.rotation.y = buffer[offset + 4];
                e.rotation.z = buffer[offset + 5];
                e.rotation.w = buffer[offset + 6];
                
                // v40.0: Update structural stress from buffer
                e.stress_intensity = buffer[offset + 7];
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
            setRigidBodies(prev => {
                const next = new Map(prev);
                next.set(id, ref);
                return next;
            });
            registerRigidBody(id, ref);
        } else {
            setRigidBodies(prev => {
                const next = new Map(prev);
                next.delete(id);
                return next;
            });
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

                            const useNeuralLOD = lodState.currentLayer === 'MACRO';

                            const handleGhostClick = (e: any) => {
                                e.stopPropagation();
                                if (entity.renderable.isGhost) {
                                    dispatch({ type: 'PROMOTE_GHOST', payload: { id: t.id } });
                                } else {
                                    handleSelect(t.id);
                                }
                            };

                            const MeshMaterial = t.isUnstable ? (
                                <DynamicShaderMaterial 
                                    shaderCode={SENTINEL_FRAG} 
                                    color="#ff0000" 
                                    xRayMode={xRayMode} 
                                    transitionProgress={lodState.transitionProgress}
                                />
                            ) : entity.renderable.isGhost ? (
                                <DynamicShaderMaterial
                                    shaderCode={GHOST_FRAG}
                                    color="#60a5fa"
                                    isTransparent={true}
                                    wireframe={true}
                                    xRayMode={xRayMode}
                                    drift={t.drift}
                                    velocity={entity.physics.velocity}
                                    certainty={entity.certainty}
                                    transitionProgress={lodState.transitionProgress}
                                />
                            ) : useNeuralLOD ? (
                                <DynamicShaderMaterial 
                                    shaderCode={NEURAL_LOD_FRAG} 
                                    color={t.color} 
                                    xRayMode={xRayMode} 
                                    certainty={entity.certainty} 
                                    transitionProgress={lodState.transitionProgress}
                                />
                            ) : t.shaderCode ? (
                                <DynamicShaderMaterial 
                                    shaderCode={t.shaderCode} 
                                    color={t.color} 
                                    xRayMode={xRayMode} 
                                    forceVector={entity.physics.velocity}
                                    drift={t.drift}
                                    velocity={entity.physics.velocity}
                                    elasticity={entity.personality?.isSoftBody ? 1.0 : 0.1}
                                    stress={t.stress_intensity}
                                    certainty={entity.certainty}
                                    shimmer={entity.disagreementScore + globalShimmer}
                                    transitionProgress={lodState.transitionProgress}
                                />
                            ) : (
                                <DynamicShaderMaterial 
                                    shaderCode="" 
                                    color={t.isSelected ? '#ffffff' : t.color} 
                                    xRayMode={xRayMode} 
                                    forceVector={entity.physics.velocity}
                                    drift={t.drift}
                                    velocity={entity.physics.velocity}
                                    elasticity={entity.personality?.isSoftBody ? 1.0 : 0.1}
                                    stress={t.stress_intensity}
                                    certainty={entity.certainty}
                                    shimmer={entity.disagreementScore + globalShimmer}
                                    transitionProgress={lodState.transitionProgress}
                                />
                            );

                            if (USE_GHOST_KERNEL) {
                                return (
                                    <group key={t.id}>
                                        <group position={t.position} rotation={t.rotation}>
                                            <mesh
                                                geometry={geometry}
                                                scale={t.scale}
                                                onClick={handleGhostClick}
                                                userData={{ entityId: t.id }}
                                            >
                                                {MeshMaterial}
                                            </mesh>
                                        </group>

                                        {/* PROBABILITY CLOUDS (v30.0) */}
                                        {xRayMode && entity.probabilitySnapshots && entity.probabilitySnapshots.length > 0 && (
                                            <group>
                                                {entity.probabilitySnapshots.map((snap, idx) => (
                                                    <mesh
                                                        key={`${t.id}-prob-${idx}`}
                                                        geometry={geometry}
                                                        position={[snap.position.x, snap.position.y, snap.position.z]}
                                                        quaternion={[
                                                            snap.rotation.x || 0, 
                                                            snap.rotation.y || 0, 
                                                            snap.rotation.z || 0, 
                                                            snap.rotation.w ?? 1
                                                        ]}
                                                        scale={[t.scale[0] * 0.9, t.scale[1] * 0.9, t.scale[2] * 0.9]}
                                                    >
                                                        <meshBasicMaterial 
                                                            color={t.color} 
                                                            transparent={true} 
                                                            opacity={0.05} 
                                                            wireframe={true} 
                                                        />
                                                    </mesh>
                                                ))}
                                            </group>
                                        )}

                                        {/* CAUSAL FORESIGHT GHOSTS (v40.0) */}
                                        {xRayMode && predictions.find(p => p.id === t.id)?.snapshots.map((snap: any, idx: number) => (
                                            <group key={`${t.id}-ghost-${idx}`}>
                                                <mesh
                                                    geometry={geometry}
                                                    position={[snap.x, snap.y, snap.z]}
                                                    quaternion={[snap.rotation.x, snap.rotation.y, snap.rotation.z, snap.rotation.w]}
                                                    scale={[t.scale[0] * (1 - idx * 0.05), t.scale[1] * (1 - idx * 0.05), t.scale[2] * (1 - idx * 0.05)]}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        // Pin this future branch
                                                        pinBranch({ 
                                                            label: `Future Branch ${idx + 1}`, 
                                                            entities: predictions.map(p => ({
                                                                id: p.id,
                                                                position: p.snapshots[idx],
                                                                rotation: p.snapshots[idx].rotation
                                                            })),
                                                            confidence: 0.9,
                                                            probability: 0.9
                                                        });
                                                    }}
                                                >
                                                    <meshBasicMaterial 
                                                        color="#60a5fa" 
                                                        transparent={true} 
                                                        opacity={0.2 / (idx + 1)} 
                                                        wireframe={true} 
                                                    />
                                                </mesh>
                                            </group>
                                        ))}

                                        {/* ASTRA'S DREAM GHOSTS (v40.0) */}
                                        {xRayMode && state.worldState?.dream_ghosts?.map((ghost, gIdx) => {
                                            const ghostEntity = ghost.entities.find((e: any) => e.id === t.id);
                                            if (!ghostEntity) return null;
                                            return (
                                                <mesh
                                                    key={`${t.id}-dream-${gIdx}`}
                                                    geometry={geometry}
                                                    position={[ghostEntity.position.x, ghostEntity.position.y, ghostEntity.position.z]}
                                                    quaternion={[
                                                        ghostEntity.rotation?.x || 0,
                                                        ghostEntity.rotation?.y || 0,
                                                        ghostEntity.rotation?.z || 0,
                                                        ghostEntity.rotation?.w ?? 1
                                                    ]}
                                                    scale={t.scale}
                                                    onDoubleClick={(e) => {
                                                        e.stopPropagation();
                                                        // v50.0 Consensus Collapse: Solidify the ghost
                                                        dispatch({ type: 'PROMOTE_GHOST', payload: { id: t.id } });
                                                        sfx.playSuccess();
                                                    }}
                                                >
                                                    <meshBasicMaterial 
                                                        color="#8b5cf6" 
                                                        transparent={true} 
                                                        opacity={0.15} 
                                                        wireframe={true} 
                                                    />
                                                </mesh>
                                            );
                                        })}
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
                                    <mesh 
                                        geometry={geometry} 
                                        scale={t.scale} 
                                        onClick={handleGhostClick}
                                        userData={{ entityId: t.id }}
                                    >
                                        {MeshMaterial}
                                    </mesh>
                                </RigidBody>
                            );
                        })}
                    </group>
                );
            })}

            {/* KINETIC HUD: Calculus Overlays (v31.0 - Attention Gated v60.0) */}
            {Array.from(rigidBodies.entries()).map(([id, body]) => {
                const entity = ecsWorld.entities.find(e => e.id === id);
                if (entity?.physics.isStatic) return null;
                // v60.0 Attention Gating: Only render HUD if selected
                if (state.selectedEntityId && id !== state.selectedEntityId) return null;
                return <KineticLabel key={`kinetic-${id}`} body={body} label={entity?.selectable?.name || 'Object'} />;
            })}

            {/* v32.5 LIVING CITATIONS (Focus Gated v31.0) */}
            {blackboardContext.activeCitations
                .filter(citation => !state.selectedEntityId || citation.entityId === state.selectedEntityId)
                .map((citation, idx) => {
                    const entity = ecsWorld.entities.find(e => e.id === citation.entityId);
                    if (!entity) return null;
                    return (
                        <LivingCitation 
                            key={`citation-${idx}`}
                            position={[entity.position.x, entity.position.y + 2, entity.position.z]}
                            text={citation.rule}
                            status={citation.status}
                        />
                    );
                })}

            {/* CAUSAL WEB RENDERING (v30.0 - Focus Gated v31.0) */}
            {state.worldState?.causal_links
                ?.filter(link => !state.selectedEntityId || link.sourceId === state.selectedEntityId)
                .map((link, idx) => {
                    const entity = ecsWorld.entities.find(e => e.id === link.sourceId);
                    if (!entity) return null;
                    return (
                        <CausalThread 
                            key={`causal-${idx}`}
                            start={[entity.position.x, entity.position.y, entity.position.z]}
                            end={[link.anchorPosition.x, link.anchorPosition.y, link.anchorPosition.z]}
                            intensity={link.intensity}
                        />
                    );
                })}

            {/* v31.0 TEMPORAL MIRRORING: Residue Ghosts */}
            {xRayMode && residues.map((residue, rIdx) => {
                try {
                    const structuralData = JSON.parse(residue.structuralData);
                    const entities = structuralData.entities || [];
                    return (
                        <group key={`residue-${residue.id}`}>
                            {entities.map((e: any, eIdx: number) => {
                                const geometry = PRIMITIVE_GEOMETRIES[e.shape as keyof typeof PRIMITIVE_GEOMETRIES] || PRIMITIVE_GEOMETRIES.box;
                                return (
                                    <mesh
                                        key={`${residue.id}-${e.id || eIdx}`}
                                        geometry={geometry}
                                        position={[e.position.x, e.position.y, e.position.z]}
                                        quaternion={[
                                            e.rotation?.x || 0,
                                            e.rotation?.y || 0,
                                            e.rotation?.z || 0,
                                            e.rotation?.w ?? 1
                                        ]}
                                        scale={[
                                            e.dimensions?.x || 1,
                                            e.dimensions?.y || 1,
                                            e.dimensions?.z || 1
                                        ]}
                                    >
                                        <meshBasicMaterial 
                                            color={residue.outcome === 'STABLE' ? '#10b981' : '#ef4444'} 
                                            transparent 
                                            opacity={0.05} 
                                            wireframe 
                                        />
                                    </mesh>
                                );
                            })}
                        </group>
                    );
                } catch (e) {
                    return null;
                }
            })}

            {jointEntities.entities.map((j) => {
                const bodyA = rigidBodies.get(j.joint!.bodyA);
                const bodyB = rigidBodies.get(j.joint!.bodyB);
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

            {/* MODULE SPIDER: Knowledge Graph Visualization (v30.0 / v35.0) */}
            {state.knowledgeGraph && (
                <LivingOntologyGraph 
                    graph={state.knowledgeGraph} 
                    discoveryYear={state.discoveryYear}
                    chronesthesiaEnabled={state.chronesthesiaEnabled}
                    onSelect={handleSelect} 
                />
            )}

            <Html>
                <SystemVitals />
            </Html>
        </group>
    );
}