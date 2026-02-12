'use client';

import React, { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { OrbitControls, Environment, Sky, Float, ContactShadows, Html, AdaptiveDpr, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing';
import { UniversalRenderer } from './Renderer';
import { SentinelManager } from './SentinelManager';
import { BIOME_PRESETS, BiomeType } from '@/lib/simulation/biomes';
import { useGenesisStore } from '@/lib/store/GenesisContext';
import { bridgeScenario } from '@/lib/scenarios/bridge';
import { LSystemTree } from './LSystemTree';

// v29.0 Iron Man HUD: WebXR Support
// To activate: npm install @react-three/xr
// import { XR, ARButton, VRButton, Hands } from '@react-three/xr';

interface HolodeckProps {
    debug?: boolean;
    isPaused?: boolean;
    onCollision?: (impactMagnitude: number) => void;
    backgroundMode?: boolean;
    gardenNodes?: Array<{ id: string; topic: string; health: number }>;
}

/**
 * THE HOLODECK (Titan v3.5 - 100% Potential)
 * Logic: Renders the simulation using R3F and Rapier.
 * Upgraded with Dynamic Biomes (v23.0).
 */
export const Holodeck: React.FC<HolodeckProps> = ({
    debug = true,
    isPaused = false,
    onCollision,
    backgroundMode = false,
    gardenNodes = []
}) => {
    // Falls back to bridge scenario if no state is provided (mostly for environment now)
    const { state } = useGenesisStore();
    const activeState = state.worldState || bridgeScenario;

    const handleContextLost = React.useCallback((event: any) => {
        event.preventDefault();
        console.error("CRITICAL: WebGL Context Lost! The GPU has crashed or reset. Restarting renderer...", event);
    }, []);

    // --- BIOME LOGIC (v23.0) ---
    const currentBiomeId = activeState.environment?.biome as BiomeType;
    const biomeConfig = BIOME_PRESETS[currentBiomeId];

    const gravity = useMemo(() => {
        if (biomeConfig) {
            return [biomeConfig.physics.gravity.x, biomeConfig.physics.gravity.y, biomeConfig.physics.gravity.z] as [number, number, number];
        }
        return [
            activeState.environment?.gravity.x ?? 0,
            activeState.environment?.gravity.y ?? -9.81,
            activeState.environment?.gravity.z ?? 0
        ] as [number, number, number];
    }, [biomeConfig, activeState.environment?.gravity]);

    return (
        <div className="w-full h-full relative overflow-hidden">
            {/* MODULE C: WebXR HUD (v29.0) */}
            <div className="absolute top-6 left-6 z-[100] flex flex-col gap-2 pointer-events-auto">
                <div id="xr-buttons" />
            </div>

            <Canvas
                shadows
                camera={{ position: [0, 5, 12], fov: 50 }}
                gl={{ 
                    powerPreference: "high-performance",
                    antialias: false,
                    stencil: false,
                    alpha: false,
                    depth: true,
                    failIfMajorPerformanceCaveat: true
                }}
                onCreated={({ gl }) => {
                    gl.domElement.addEventListener('webglcontextlost', handleContextLost, false);
                }}
                dpr={[1, 1.5]} // Lowered for stability on mobile
            >
                <AdaptiveDpr pixelated />
                <color attach="background" args={[biomeConfig?.visuals.fogColor || '#020205']} />

                <Suspense fallback={<Html><div className="text-white">Loading Holodeck...</div></Html>}>
                    {!backgroundMode && <SentinelManager />}
                    {backgroundMode ? (
                        <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
                            <LSystemTree nodes={gardenNodes} />
                        </Float>
                    ) : (
                        <Physics
                            gravity={gravity}
                            debug={debug}
                            paused={isPaused}
                        >
                            <UniversalRenderer
                                onCollision={onCollision}
                                biomeDamping={biomeConfig?.physics.wrapperDamping}
                            />
                        </Physics>
                    )}

                    {/* High-Fidelity Environment */}
                    {biomeConfig?.visuals.skybox === 'stars' ? (
                        <Stars radius={100} depth={50} count={biomeConfig.visuals.starCount || 5000} factor={4} saturation={0} fade speed={1} />
                    ) : (
                        <Sky sunPosition={[100, 20, 100]} />
                    )}
                    
                    <Environment preset={currentBiomeId === 'SPACE' ? 'night' : (currentBiomeId === 'OCEAN' ? 'city' : 'night')} />
                    <ContactShadows 
                        opacity={0.7} 
                        scale={30} 
                        blur={1.5} 
                        far={10} 
                        resolution={512} 
                        color="#000000" 
                    />
                    <OrbitControls makeDefault />

                    {/* Neural Post-Processing */}
                    <EffectComposer enableNormalPass={false}>
                        <Bloom luminanceThreshold={1} mipmapBlur intensity={0.5} />
                        <ChromaticAberration offset={[0.0005, 0.0005]} />
                        <Vignette eskil={false} offset={0.1} darkness={1.1} />
                    </EffectComposer>
                </Suspense>
            </Canvas>

            {/* Debug Label */}
            {debug && (
                <div className="absolute top-6 right-6 z-10 pointer-events-none">
                    <span className="px-2 py-1 bg-amber-500/20 border border-amber-500/50 rounded text-[8px] font-bold text-amber-500 uppercase tracking-widest">
                        Physics Debug Active
                    </span>
                </div>
            )}
        </div>
    );
};
