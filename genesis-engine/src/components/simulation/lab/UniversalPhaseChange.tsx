'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import LiveGraph from './LiveGraph';
import { motion, AnimatePresence } from 'framer-motion';
import { blackboard } from '@/lib/genkit/context';

interface PhaseChangeConfig {
    substance: string;
    boilingPoint: number;
    meltingPoint: number;
    liquidColor: string;
    gasColor: string;
    initialTemp: number;
}

export default function UniversalPhaseChange({ config }: { config: PhaseChangeConfig }) {
    const [temp, setTemp] = useState(config.initialTemp);
    const [time, setTime] = useState(0);
    const [heat, setHeat] = useState(0);
    const [dataPoints, setDataPoints] = useState<{x: number, y: number}[]>([]);
    
    const { boilingPoint, meltingPoint, substance, liquidColor, gasColor } = config;

    // Derived states
    const isSolid = temp <= meltingPoint;
    const isLiquid = temp > meltingPoint && temp < boilingPoint;
    const isGas = temp >= boilingPoint;

    useFrame((state, delta) => {
        if (heat === 0) return;

        setTime(prev => prev + delta * 5);
        
        setTemp(prev => {
            let next = prev;
            
            // Phase Change Plateau Logic
            // If we are at the melting or boiling point, stay there for a bit while energy is absorbed
            const isAtMelting = Math.abs(prev - meltingPoint) < 0.2;
            const isAtBoiling = Math.abs(prev - boilingPoint) < 0.2;

            if ((isAtMelting || isAtBoiling) && Math.random() > 0.9) {
                // Occasional breakthrough to next phase
                next += heat * delta * 2;
            } else if (!isAtMelting && !isAtBoiling) {
                // Normal heating/cooling
                next += heat * delta * 10;
            }
            
            return next;
        });
    });

    useEffect(() => {
        setDataPoints(prev => [...prev, { x: time, y: temp }].slice(-150));
        
        // Quantum Bridge: Push state to Blackboard
        blackboard.update({
            globalTemperature: temp,
            environmentalState: isGas ? 'VOLCANIC' : isSolid ? 'FROZEN' : 'STANDARD'
        });
    }, [time, temp, isGas, isSolid]);

    return (
        <group>
            {/* The Containment Field (Beaker) */}
            <mesh position={[0, -1, 0]}>
                <cylinderGeometry args={[1.5, 1.5, 3, 32]} />
                <meshStandardMaterial color="#ffffff" transparent opacity={0.1} />
            </mesh>

            {/* Solid/Liquid Visual */}
            {!isGas && (
                <mesh position={[0, -2.5 + (Math.min(1, (temp - meltingPoint) / (boilingPoint - meltingPoint)) * 1.5), 0]}>
                    <cylinderGeometry args={[1.4, 1.4, 0.5, 32]} />
                    <meshStandardMaterial 
                        color={isSolid ? '#a5f3fc' : liquidColor} 
                        emissive={isSolid ? '#0ea5e9' : liquidColor}
                        emissiveIntensity={0.5}
                    />
                </mesh>
            )}

            {/* Particle System for Phase State */}
            <group>
                {Array.from({ length: isGas ? 40 : isLiquid ? 15 : 5 }).map((_, i) => (
                    <Particle 
                        key={i} 
                        isGas={isGas} 
                        isLiquid={isLiquid} 
                        color={isGas ? gasColor : isLiquid ? liquidColor : '#ffffff'} 
                    />
                ))}
            </group>

            {/* Dashboard Overlay */}
            <Html position={[4, 2, 0]}>
                <div className="w-72 flex flex-col gap-4">
                    <LiveGraph 
                        dataPoints={dataPoints} 
                        labels={{ x: 'Time', y: `Temp (°C)` }}
                        minY={Math.min(meltingPoint - 20, config.initialTemp)}
                        maxY={Math.max(boilingPoint + 20, temp)}
                        maxX={Math.max(100, time)}
                        color={liquidColor}
                    />

                    <div className="p-6 bg-black/80 backdrop-blur-2xl border border-white/10 rounded-[32px] shadow-2xl">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">{substance} Matrix</span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isGas ? 'bg-orange-500' : isLiquid ? 'bg-blue-500' : 'bg-cyan-500'}`}>
                                {isGas ? 'GAS' : isLiquid ? 'LIQUID' : 'SOLID'}
                            </span>
                        </div>
                        <div className="text-4xl font-black text-white mb-4 tabular-nums">
                            {temp.toFixed(1)}°<span className="text-sm opacity-50 ml-1">C</span>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-[8px] font-bold uppercase text-gray-500 mb-1">
                                    <span>Thermal Energy Input</span>
                                    <span>{Math.round(heat * 100)}%</span>
                                </div>
                                <input 
                                    type="range" min="-1" max="1" step="0.01" value={heat} 
                                    onChange={(e) => setHeat(parseFloat(e.target.value))}
                                    className="w-full accent-orange-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                                    <div className="text-[7px] font-bold text-gray-500 uppercase">Melting</div>
                                    <div className="text-xs font-bold text-cyan-400">{meltingPoint}°C</div>
                                </div>
                                <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                                    <div className="text-[7px] font-bold text-gray-500 uppercase">Boiling</div>
                                    <div className="text-xs font-bold text-orange-400">{boilingPoint}°C</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Html>
        </group>
    );
}

function Particle({ isGas, isLiquid, color }: { isGas: boolean, isLiquid: boolean, color: string }) {
    const mesh = useRef<THREE.Mesh>(null);
    const speed = useRef(Math.random() * 0.05 + 0.02);
    const offset = useRef(Math.random() * Math.PI * 2);

    useFrame((state) => {
        if (!mesh.current) return;
        const t = state.clock.getElapsedTime();
        
        if (isGas) {
            // Chaotic movement
            mesh.current.position.y += speed.current * 2;
            mesh.current.position.x += Math.sin(t + offset.current) * 0.02;
            if (mesh.current.position.y > 2) mesh.current.position.y = -1;
        } else if (isLiquid) {
            // Sloshing movement
            mesh.current.position.y = -2 + Math.sin(t * 2 + offset.current) * 0.2;
            mesh.current.position.x = Math.cos(t + offset.current) * 0.8;
        } else {
            // Fixed vibrating movement
            mesh.current.position.y = -2.2 + Math.sin(t * 10 + offset.current) * 0.02;
            mesh.current.position.x = Math.cos(offset.current) * 0.5;
        }
    });

    return (
        <mesh ref={mesh}>
            <sphereGeometry args={[0.05]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isGas ? 2 : 0.5} />
        </mesh>
    );
}
