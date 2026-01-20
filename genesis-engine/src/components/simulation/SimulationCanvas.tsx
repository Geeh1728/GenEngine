'use client';

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics, RigidBody, RigidBodyProps } from '@react-three/rapier';
import { OrbitControls, PerspectiveCamera, Stars } from '@react-three/drei';
import { WorldState, Entity } from '@/lib/simulation/schema';
// import { useTextureGen } from '@/lib/simulation/useTextureGen';

const EntityMaterial = ({ color, type }: { color?: string, type: string, texturePrompt?: string }) => {
    // texturePrompt logic can be re-enabled when useTextureGen is fully implemented
    // const material = useTextureGen({
    //     prompt: texturePrompt,
    //     color,
    //     fallbackColor: type === 'plane' ? '#444' : '#fff'
    // });
    // return <primitive object={material} attach="material" />;
    return <meshStandardMaterial color={color || (type === 'plane' ? '#444' : '#fff')} />;
};

const PhysicsEntity = ({ entity }: { entity: Entity }) => {
    const { type, position, rotation, dimensions = { x: 1, y: 1, z: 1 }, physics, isStatic, id } = entity;
    const { mass, friction, restitution } = physics;

    const rigidBodyType: RigidBodyProps['type'] = isStatic ? 'fixed' : 'dynamic';

    // Specific adjustments for plane/floor to ensure it acts as ground
    let finalPos = [position.x, position.y, position.z] as [number, number, number];

    if (type === 'plane') {
        // If plane, usually we want a large fixed ground. 
        // Adjust for thickness if using box so surface is at y
        finalPos = [position.x, position.y - 0.5, position.z];
    }

    const renderGeometry = () => {
        switch (type) {
            case 'box':
            case 'cube':
                return <boxGeometry args={[dimensions.x, dimensions.y, dimensions.z]} />;
            case 'sphere':
                return <sphereGeometry args={[dimensions.x, 32, 32]} />;
            case 'cylinder':
                return <cylinderGeometry args={[dimensions.x, dimensions.x, dimensions.y, 32]} />;
            case 'plane':
                // Using a large box for the floor/plane for reliable collisions
                return <boxGeometry args={[100, 1, 100]} />;
            default:
                return <boxGeometry />;
        }
    };

    return (
        <RigidBody
            key={id}
            type={rigidBodyType}
            position={finalPos}
            rotation={rotation ? [rotation.x, rotation.y, rotation.z] : [0, 0, 0]}
            mass={mass}
            friction={friction}
            restitution={restitution}
            colliders={type === 'plane' ? 'cuboid' : 'hull'}
        >
            <mesh castShadow receiveShadow>
                {renderGeometry()}
                <EntityMaterial color={entity.color} type={type} texturePrompt={entity.texturePrompt} />
            </mesh>
        </RigidBody>
    );
};

interface SimulationCanvasProps {
    worldState?: WorldState;
    debug?: boolean;
}

export const SimulationCanvas: React.FC<SimulationCanvasProps> = ({ worldState, debug = false }) => {
    // Default gravity
    const gravity = worldState?.environment?.gravity
        ? [worldState.environment.gravity.x, worldState.environment.gravity.y, worldState.environment.gravity.z] as [number, number, number]
        : [0, -9.81, 0] as [number, number, number];

    return (
        <div className="w-full h-full bg-black relative">
            <Canvas shadows className="w-full h-full">
                <PerspectiveCamera makeDefault position={[0, 5, 10]} fov={50} />
                <OrbitControls makeDefault />

                {/* Lighting */}
                <ambientLight intensity={0.5} />
                <directionalLight
                    position={[10, 10, 5]}
                    intensity={1}
                    castShadow
                    shadow-mapSize={[1024, 1024]}
                />
                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

                {/* Physics World */}
                <Physics gravity={gravity} debug={debug}>
                    {worldState?.entities?.map((entity) => (
                        <PhysicsEntity key={entity.id} entity={entity} />
                    ))}

                    {/* Fallback Floor if no state - helpful for dev */}
                    {!worldState && (
                        <>
                            <RigidBody type="fixed" position={[0, -2, 0]} restitution={0.5}>
                                <mesh receiveShadow>
                                    <boxGeometry args={[50, 2, 50]} />
                                    <meshStandardMaterial color="#333" />
                                </mesh>
                            </RigidBody>
                            <RigidBody position={[0, 5, 0]} restitution={0.7} colliders="ball">
                                <mesh castShadow>
                                    <sphereGeometry args={[1, 32, 32]} />
                                    <meshStandardMaterial color="cyan" />
                                </mesh>
                            </RigidBody>
                        </>
                    )}
                </Physics>
            </Canvas>

            {/* UI Overlay */}
            <div className="absolute top-4 left-4 z-20 pointer-events-none">
                <p className="text-[10px] uppercase tracking-[0.3em] text-blue-400/50 font-bold mb-1">
                    Holographic Feed
                </p>
                <h4 className="text-xl font-outfit font-bold text-white uppercase tracking-wider">
                    {worldState?.scenario || 'Simulation Idle'}
                </h4>
            </div>
        </div>
    );
};