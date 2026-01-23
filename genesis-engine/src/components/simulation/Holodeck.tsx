'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { OrbitControls, Environment, Sky, Float, ContactShadows, Html } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing';
import { UniversalRenderer } from './Renderer';
import { WorldState } from '@/lib/simulation/schema';
import { SkillNodeSchema } from '@/lib/genkit/schemas';
import { z } from 'zod';
import { bridgeScenario } from '@/lib/scenarios/bridge';
import { LSystemTree } from './LSystemTree';
// SoundManager decoupled

type SkillNode = z.infer<typeof SkillNodeSchema>;

interface HolodeckProps {
    worldState: WorldState | null;
    activeNode?: SkillNode | null;
    debug?: boolean;
    isPaused?: boolean;
    onCollision?: (impactMagnitude: number) => void;
    backgroundMode?: boolean;
    gardenNodes?: Array<{ id: string; topic: string; health: number }>;
}

/**
 * THE HOLODECK (Titan v3.5 - 100% Potential)
 * Logic: Renders the simulation using R3F and Rapier.
 * Performance: Optimized for low-end devices by keeping Main Thread clear.
 */
export const Holodeck: React.FC<HolodeckProps> = ({
    worldState,
    activeNode,
    debug = true,
    isPaused = false,
    onCollision,
    backgroundMode = false,
    gardenNodes = []
}) => {
    // Falls back to bridge scenario if no state is provided
    const activeState = worldState || bridgeScenario;

    // Sound decoupled to parent

    return (
        <div className="w-full h-full relative overflow-hidden">
            <Canvas
                shadows
                camera={{ position: [0, 5, 12], fov: 50 }}
                gl={{ antialias: true, powerPreference: "high-performance" }}
                dpr={[1, 2]} // Performance scaling
            >
                <color attach="background" args={['#020205']} />

                <Suspense fallback={<Html><div className="text-white">Loading Holodeck...</div></Html>}>
                    {backgroundMode ? (
                        <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
                            <LSystemTree nodes={gardenNodes} />
                        </Float>
                    ) : (
                        <Physics
                            gravity={[
                                activeState.environment?.gravity.x ?? 0,
                                activeState.environment?.gravity.y ?? -9.81,
                                activeState.environment?.gravity.z ?? 0
                            ]}
                            debug={debug}
                            paused={isPaused}
                        >
                            <UniversalRenderer
                                worldState={activeState}
                                activeNode={activeNode}
                                onCollision={onCollision}
                            />
                        </Physics>
                    )}

                    {/* High-Fidelity Environment */}
                    <Sky sunPosition={[100, 20, 100]} />
                    <Environment preset="night" />
                    <ContactShadows opacity={0.4} scale={20} blur={24} far={10} resolution={256} color="#000000" />
                    <OrbitControls makeDefault />

                    {/* Neural Post-Processing */}
                    <EffectComposer disableNormalPass>
                        <Bloom luminanceThreshold={1} mipmapBlur intensity={0.5} />
                        <ChromaticAberration offset={[0.0005, 0.0005]} />
                        <Vignette eskil={false} offset={0.1} darkness={1.1} />
                    </EffectComposer>
                </Suspense>
            </Canvas>

            {/* Overlay Info */}
            <div className="absolute top-6 left-6 z-10 pointer-events-none max-w-sm">
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-[0.4em] text-blue-400/50 font-bold">
                        Holographic Reality
                    </span>
                    <h3 className="text-xl font-outfit font-bold text-white uppercase tracking-wider mb-2">
                        {activeState.scenario}
                    </h3>
                    <p className="text-xs text-white/60 font-medium leading-relaxed bg-white/5 p-3 rounded-lg border border-white/10 backdrop-blur-sm pointer-events-auto">
                        {activeState.explanation || activeState.description}
                    </p>
                </div>
            </div>

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
