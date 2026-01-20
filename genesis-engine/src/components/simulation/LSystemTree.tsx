'use client';

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';

interface BranchProps {
    start: THREE.Vector3;
    end: THREE.Vector3;
    thickness: number;
    color: string;
    label?: string;
    health: number;
}

const Branch: React.FC<BranchProps> = ({ start, end, thickness, color, label, health }) => {
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();
    const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direction.clone().normalize()
    );

    return (
        <group>
            <mesh position={midpoint} quaternion={quaternion}>
                <cylinderGeometry args={[thickness * 0.7, thickness, length, 8]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={health * 0.5}
                    transparent
                    opacity={0.8 + health * 0.2}
                />
            </mesh>
            {label && (
                <Html position={end} distanceFactor={10}>
                    <div className="bg-black/90 border border-white/20 px-2 py-1 rounded-md whitespace-nowrap">
                        <p className="text-[10px] font-bold text-white uppercase tracking-tighter">
                            {label}
                        </p>
                        <div className="w-full h-1 bg-gray-800 rounded-full mt-1 overflow-hidden">
                            <div
                                className="h-full transition-all duration-1000"
                                style={{
                                    width: `${health * 100}%`,
                                    backgroundColor: health > 0.6 ? '#10b981' : health > 0.3 ? '#f59e0b' : '#ef4444'
                                }}
                            />
                        </div>
                    </div>
                </Html>
            )}
        </group>
    );
};

interface LSystemTreeProps {
    nodes: Array<{ id: string; topic: string; health: number }>;
}

export const LSystemTree: React.FC<LSystemTreeProps> = ({ nodes }) => {
    const branches = useMemo(() => {
        const result: React.ReactNode[] = [];
        const baseStart = new THREE.Vector3(0, 0, 0);

        // Trunk
        const trunkEnd = new THREE.Vector3(0, 2, 0);
        result.push(
            <Branch
                key="trunk"
                start={baseStart}
                end={trunkEnd}
                thickness={0.2}
                color="#2d1a12"
                health={1.0}
            />
        );

        // Map nodes to branches
        nodes.forEach((node, i) => {
            // Helper for deterministic random values
            const getNoise = (seed: number) => {
                const x = Math.sin(i * 100 + seed) * 10000;
                return x - Math.floor(x);
            };

            const angle = (i / nodes.length) * Math.PI * 2;
            const spread = 2 + getNoise(1);
            const height = 2 + (i % 3);

            const start = trunkEnd.clone();
            const end = new THREE.Vector3(
                Math.cos(angle) * spread,
                height,
                Math.sin(angle) * spread
            );

            // Interpolate color based on health (Vibrant Green -> Autumn Brown)
            const healthyColor = new THREE.Color('#22c55e');
            const unhealthyColor = new THREE.Color('#78350f');
            const displayColor = healthyColor.clone().lerp(unhealthyColor, 1 - node.health);

            result.push(
                <Branch
                    key={node.id}
                    start={start}
                    end={end}
                    thickness={0.1}
                    color={`#${displayColor.getHexString()}`}
                    label={node.topic}
                    health={node.health}
                />
            );

            // Add small sub-branches for a "fuller" tree look
            for (let j = 0; j < 2; j++) {
                const subStart = start.clone().lerp(end, 0.5 + getNoise(2 + j) * 0.3);
                const subEnd = subStart.clone().add(new THREE.Vector3(
                    (getNoise(3 + j) - 0.5) * 1.5,
                    getNoise(4 + j) * 1.5,
                    (getNoise(5 + j) - 0.5) * 1.5
                ));
                result.push(
                    <Branch
                        key={`${node.id}-sub-${j}`}
                        start={subStart}
                        end={subEnd}
                        thickness={0.05}
                        color={`#${displayColor.clone().multiplyScalar(0.8).getHexString()}`}
                        health={node.health}
                    />
                );
            }
        });

        return result;
    }, [nodes]);

    const groupRef = React.useRef<THREE.Group>(null);
    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.1;
        }
    });

    return (
        <group ref={groupRef}>
            {branches}
        </group>
    );
};
