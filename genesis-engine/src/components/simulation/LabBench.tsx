'use client';

import React, { useRef, useState, useLayoutEffect, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useExactPhysics } from '@/hooks/useExactPhysics';
import { State, calculatePressureDelta, verletStep } from '@/lib/physics/math';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import LiveGraph from './lab/LiveGraph';
import UniversalPhaseChange from './lab/UniversalPhaseChange';

/**
 * High-Performance 2D Physics Bridge (Module K)
 * Used for "Orphan" simulations that need raw pixel control.
 */
function UniversalCanvas({ type = 'XENOBOT' }: { type?: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const points = useRef<unknown[]>([]);
    const springs = useRef<unknown[]>([]);

    useLayoutEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Initialize points/springs based on type
        if (type === 'XENOBOT') {
            points.current = Array.from({ length: 8 }, (_, i) => ({
                x: 200 + Math.cos((i / 8) * Math.PI * 2) * 50,
                y: 200 + Math.sin((i / 8) * Math.PI * 2) * 50,
                prevX: 200 + Math.cos((i / 8) * Math.PI * 2) * 50,
                prevY: 200 + Math.sin((i / 8) * Math.PI * 2) * 50,
            }));
            // Circular springs
            springs.current = points.current.map((_, i) => ({
                a: i,
                b: (i + 1) % 8,
                length: 40,
                stiffness: 0.5
            }));
        }

        let animationFrameId: number;

        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 1. Physics Step (Verlet)
            points.current.forEach(p => {
                const next = verletStep({ x: p.x, y: p.y }, { x: p.prevX, y: p.prevY }, { x: 0, y: 0.1 }, 0.2, 0.99);
                p.prevX = next.prevX;
                p.prevY = next.prevY;
                p.x = next.x;
                p.y = next.y;

                // Floor Collision
                if (p.y > canvas.height - 20) {
                    p.y = canvas.height - 20;
                    p.prevY = p.y + (p.y - p.prevY) * 0.5;
                }
            });

            // 2. Constraints
            for (let j = 0; j < 5; j++) {
                springs.current.forEach(s => {
                    const pA = points.current[s.a];
                    const pB = points.current[s.b];
                    const dx = pB.x - pA.x;
                    const dy = pB.y - pA.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const diff = s.length - dist;
                    const percent = (diff / dist) / 2 * s.stiffness;
                    pA.x -= dx * percent;
                    pA.y -= dy * percent;
                    pB.x += dx * percent;
                    pB.y += dy * percent;
                });
            }

            // 3. Draw
            ctx.strokeStyle = '#00ff88';
            ctx.lineWidth = 3;
            ctx.beginPath();
            springs.current.forEach(s => {
                ctx.moveTo(points.current[s.a].x, points.current[s.a].y);
                ctx.lineTo(points.current[s.b].x, points.current[s.b].y);
            });
            ctx.stroke();

            points.current.forEach(p => {
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
                ctx.fill();
            });

            animationFrameId = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animationFrameId);
    }, [type]);

    return (
        <Html transform position={[0, 0, 0]}>
            <div className="relative bg-black/40 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
                <canvas 
                    ref={canvasRef} 
                    width={400} 
                    height={400} 
                    className="w-[300px] h-[300px]"
                />
                <div className="absolute top-4 left-4 flex flex-col">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Bio-Digital Feed</span>
                    <span className="text-white text-sm font-bold uppercase">{type} ENGINE</span>
                </div>
            </div>
        </Html>
    );
}

/**
 * Bio-Digital Heart Renderer (Module K)
 * Demonstrates P-V Loops and Navier-Stokes pressure.
 * Optimized with Refs for 60fps performance.
 */
function HeartRenderer({ frequency = 1 }: { frequency?: number }) {
    const meshRef = useRef<THREE.Mesh>(null);
    const pressureRef = useRef(0);
    const labelRef = useRef<HTMLDivElement>(null);
    const barRef = useRef<HTMLDivElement>(null);

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        const cycle = (Math.sin(t * frequency * Math.PI * 2) + 1) / 2;
        const volume = 50 + cycle * 70; // 50ml to 120ml
        
        // High-speed pressure calculation
        const p = calculatePressureDelta(volume, 50, 0.5, 0.1, 0.016);
        pressureRef.current = p;

        if (meshRef.current) {
            const s = 1 + cycle * 0.3;
            meshRef.current.scale.set(s, s, s);
            (meshRef.current.material as THREE.MeshStandardMaterial).color.setHSL(0, 0.8, 0.3 + cycle * 0.4);
        }

        // Direct DOM manipulation for performance (bypass React render)
        if (labelRef.current) labelRef.current.innerText = p.toFixed(1);
        if (barRef.current) barRef.current.style.width = `${Math.min(100, (p/120)*100)}%`;
    });

    return (
        <group>
            <mesh ref={meshRef}>
                <sphereGeometry args={[1, 32, 32]} />
                <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.5} />
            </mesh>
            <Html position={[2, 0, 0]}>
                <div className="bg-black/80 border border-red-500/30 p-4 rounded-2xl text-red-500 font-mono w-40 backdrop-blur-xl shadow-2xl">
                    <div className="text-[10px] uppercase font-black tracking-widest opacity-50 mb-1">LV Pressure</div>
                    <div className="text-3xl font-black tabular-nums">
                        <span ref={labelRef}>0.0</span>
                        <span className="text-[10px] ml-1 opacity-50 uppercase">mmHg</span>
                    </div>
                    <div className="w-full h-1.5 bg-red-950/50 mt-3 rounded-full overflow-hidden border border-white/5">
                        <div ref={barRef} className="h-full bg-red-500 shadow-[0_0_10px_#ef4444] transition-all duration-75" style={{ width: '0%' }} />
                    </div>
                </div>
            </Html>
        </group>
    );
}

interface DoublePendulumProps {
    l1: number;
    l2: number;
    m1: number;
    m2: number;
    g: number;
    initialState: State;
}

interface LabBenchProps {
    scenario?: 'PENDULUM' | 'HEART' | 'XENOBOT' | 'ETHANOL' | 'PHASE_CHANGE';
    initialState?: State;
    scientificParams?: any;
    l1?: number;
    l2?: number;
    m1?: number;
    m2?: number;
    g?: number;
}

/**
 * Module K: The Lab Bench
 * Renders high-accuracy simulations based on the active scenario.
 */
export function LabBench({
    scenario = 'PENDULUM',
    initialState = [Math.PI / 2, Math.PI / 4, 0, 0],
    scientificParams,
    l1 = 2,
    l2 = 2,
    m1 = 1,
    m2 = 1,
    g = 9.81
}: LabBenchProps) {
    if (scenario === 'HEART') return <HeartRenderer />;
    if (scenario === 'XENOBOT') return <UniversalCanvas type="XENOBOT" />;
    if (scenario === 'PHASE_CHANGE') {
        return <UniversalPhaseChange config={{
            substance: scientificParams?.substance || 'Water',
            boilingPoint: scientificParams?.boilingPoint || 100,
            meltingPoint: scientificParams?.meltingPoint || 0,
            liquidColor: scientificParams?.liquidColor || '#3b82f6',
            gasColor: scientificParams?.gasColor || '#ffffff',
            initialTemp: scientificParams?.initialTemp || 20
        }} />;
    }

    // Default: Double Pendulum
    return <DoublePendulum l1={l1} l2={l2} m1={m1} m2={m2} g={g} initialState={initialState} />;
}

function DoublePendulum({ l1, l2, m1, m2, g, initialState }: DoublePendulumProps) {
    const stateRef = useExactPhysics(initialState, { l1, l2, m1, m2, g });
    
    const rod1Ref = useRef<THREE.Group>(null);
    const rod2Ref = useRef<THREE.Group>(null);
    const bob1Ref = useRef<THREE.Mesh>(null);
    const bob2Ref = useRef<THREE.Mesh>(null);

    useFrame(() => {
        if (!stateRef.current) return;
        const [theta1, theta2] = stateRef.current;

        const x1 = l1 * Math.sin(theta1);
        const y1 = -l1 * Math.cos(theta1);
        
        if (bob1Ref.current) bob1Ref.current.position.set(x1, y1, 0);
        if (rod1Ref.current) rod1Ref.current.rotation.z = -theta1;

        const x2 = x1 + l2 * Math.sin(theta2);
        const y2 = y1 - l2 * Math.cos(theta2);

        if (bob2Ref.current) bob2Ref.current.position.set(x2, y2, 0);
        if (rod2Ref.current) {
            rod2Ref.current.position.set(x1, y1, 0);
            rod2Ref.current.rotation.z = -theta2;
        }
    });

    return (
        <group>
            <mesh>
                <sphereGeometry args={[0.1, 16, 16]} />
                <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2} />
            </mesh>

            <group ref={rod1Ref}>
                <mesh position={[0, -l1 / 2, 0]}>
                    <boxGeometry args={[0.05, l1, 0.05]} />
                    <meshStandardMaterial color="#00ffff" transparent opacity={0.6} />
                </mesh>
            </group>

            <mesh ref={bob1Ref}>
                <sphereGeometry args={[0.2, 32, 32]} />
                <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={1.5} />
            </mesh>

            <group ref={rod2Ref}>
                <mesh position={[0, -l2 / 2, 0]}>
                    <boxGeometry args={[0.05, l2, 0.05]} />
                    <meshStandardMaterial color="#ff00ff" transparent opacity={0.6} />
                </mesh>
            </group>

            <mesh ref={bob2Ref}>
                <sphereGeometry args={[0.2, 32, 32]} />
                <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={1.5} />
            </mesh>
        </group>
    );
}
