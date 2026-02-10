'use client';

import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics, RigidBody, RigidBodyProps } from '@react-three/rapier';
import { OrbitControls, PerspectiveCamera, Stars, Environment, Cloud } from '@react-three/drei';
import { WorldState, Entity } from '@/lib/simulation/schema';
import * as THREE from 'three';
import { BIOME_PRESETS, BiomeType } from '@/lib/simulation/biomes';
// import { useTextureGen } from '@/lib/simulation/useTextureGen';

const EntityMaterial = ({ color, shape }: { color?: string, shape: string, texturePrompt?: string }) => {
    // texturePrompt logic can be re-enabled when useTextureGen is fully implemented
    // const material = useTextureGen({
    //     prompt: texturePrompt,
    //     color,
    //     fallbackColor: shape === 'plane' ? '#444' : '#fff'
    // });
    // return <primitive object={material} attach="material" />;
    return <meshStandardMaterial color={color || (shape === 'plane' ? '#444' : '#fff')} />;
};

const PhysicsEntity = ({ entity, biomeDamping = 0 }: { entity: Entity, biomeDamping?: number }) => {
    const { shape, position, rotation, dimensions = { x: 1, y: 1, z: 1 }, physics, id, isRemote } = entity;
    const { mass, friction, restitution, isStatic } = physics;

    const rigidBodyType: RigidBodyProps['type'] = isRemote ? 'kinematicPosition' : (isStatic ? 'fixed' : 'dynamic');

    // Specific adjustments for plane/floor to ensure it acts as ground
    let finalPos = [position.x, position.y, position.z] as [number, number, number];

    if (shape === 'plane') {
        // If plane, usually we want a large fixed ground. 
        // Adjust for thickness if using box so surface is at y
        finalPos = [position.x, position.y - 0.5, position.z];
    }

    // Rotation Logic: Prioritize Quaternion
    const quaternionProps = rotation && rotation.w !== undefined
        ? { quaternion: new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w) }
        : { rotation: rotation ? [rotation.x, rotation.y, rotation.z] as [number, number, number] : [0, 0, 0] as [number, number, number] };


    const renderGeometry = () => {
        switch (shape) {
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
            {...quaternionProps}
            mass={mass}
            friction={friction}
            restitution={restitution}
            linearDamping={biomeDamping}
            colliders={shape === 'plane' ? 'cuboid' : 'hull'}
        >
            <mesh castShadow receiveShadow>
                {renderGeometry()}
                <EntityMaterial color={entity.visual.color} shape={shape} texturePrompt={entity.visual.texture} />
            </mesh>
        </RigidBody>
    );
};

interface SimulationCanvasProps {
    worldState?: WorldState;
    debug?: boolean;
}

const BiomeEnvironment = ({ biomeId }: { biomeId?: string }) => {
    const biome = BIOME_PRESETS[biomeId as BiomeType] || BIOME_PRESETS.EARTH;

    return (
        <>
            <ambientLight intensity={biome.visuals.ambientLightIntensity} />
            <directionalLight
                position={[10, 10, 5]}
                intensity={1}
                castShadow
                shadow-mapSize={[1024, 1024]}
            />

            {/* Fog for Atmosphere */}
            {biome.visuals.fogColor && (
                <fog attach="fog" args={[biome.visuals.fogColor, 5, 20 / (biome.visuals.fogDensity || 0.05)]} />
                // Simple exponential fog approximation
            )}

            {/* Skybox / Background Elements */}
            {biome.visuals.skybox === 'stars' && (
                <Stars radius={100} depth={50} count={biome.visuals.starCount || 5000} factor={4} saturation={0} fade speed={1} />
            )}
            {biome.visuals.skybox === 'ocean' && (
                <>
                    <color attach="background" args={['#001e36']} />
                    <Stars radius={100} depth={50} count={1000} factor={4} saturation={0} fade speed={0.5} />
                </>
            )}
            {biome.visuals.skybox === 'city' && (
                <color attach="background" args={['#101010']} />
            )}
            {biome.visuals.skybox === 'warehouse' && (
                <color attach="background" args={['#222']} />
            )}
            {/* Add more environmental effects like Clouds if needed */}
        </>
    );
};

export const SimulationCanvas: React.FC<SimulationCanvasProps> = ({ worldState, debug = false }) => {

    // Determine Biome Configuration
    const currentBiomeId = worldState?.environment?.biome as BiomeType;
    const biomeConfig = BIOME_PRESETS[currentBiomeId];

    // Gravity Logic: Biome presets override manual gravity if a biome is explicitly set
    // Otherwise fallback to manual gravity or Earth default
    const gravity = useMemo(() => {
        if (biomeConfig) {
            return [biomeConfig.physics.gravity.x, biomeConfig.physics.gravity.y, biomeConfig.physics.gravity.z] as [number, number, number];
        }
        if (worldState?.environment?.gravity) {
            return [worldState.environment.gravity.x, worldState.environment.gravity.y, worldState.environment.gravity.z] as [number, number, number];
        }
        return [0, -9.81, 0] as [number, number, number];
    }, [biomeConfig, worldState?.environment?.gravity]);

    return (
        <div className="w-full h-full bg-black relative">
            <Canvas shadows className="w-full h-full">
                <PerspectiveCamera makeDefault position={[0, 5, 10]} fov={50} />
                <OrbitControls makeDefault />

                {/* Dynamic Environment */}
                <BiomeEnvironment biomeId={currentBiomeId} />

                {/* Physics World */}
                <Physics gravity={gravity} debug={debug}>
                    {worldState?.entities?.map((entity) => (
                        <PhysicsEntity key={entity.id} entity={entity} biomeDamping={biomeConfig?.physics.wrapperDamping} />
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
                {currentBiomeId && (
                    <div className="mt-1 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs text-emerald-400 font-mono">BIOME: {currentBiomeId}</span>
                    </div>
                )}
            </div>
        </div>
    );
};