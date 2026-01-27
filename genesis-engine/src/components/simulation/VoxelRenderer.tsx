import React, { useRef, useLayoutEffect, useMemo } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { WorldState } from '@/lib/simulation/schema';

interface VoxelRendererProps {
    voxels: NonNullable<WorldState['voxels']>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const VoxelRenderer: React.FC<any> = ({ voxels: initialVoxels, data }) => {
    // 1. DATA INGEST: Handle both direct prop and data object prop
    const voxels = useMemo(() => {
        const raw = initialVoxels || data?.voxels || data;
        if (Array.isArray(raw)) return raw;
        return [];
    }, [initialVoxels, data]);

    console.log("[VoxelRenderer] Parsing Data:", { initialVoxels, data, resultCount: voxels.length });

    const meshRef = useRef<THREE.InstancedMesh>(null);
    const groupRef = useRef<THREE.Group>(null);

    const { count, tempObject, tempColor } = useMemo(() => ({
        count: voxels.length,
        tempObject: new THREE.Object3D(),
        tempColor: new THREE.Color()
    }), [voxels.length]);

    useLayoutEffect(() => {
        if (!meshRef.current || count === 0) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        voxels.forEach((voxel: any, i: number) => {
            tempObject.position.set(voxel.x, voxel.y, voxel.z);
            tempObject.updateMatrix();
            meshRef.current!.setMatrixAt(i, tempObject.matrix);

            // Allow for string colors or rgb objects if needed, but defaulting to string from schema
            tempColor.set(voxel.color || '#888');
            meshRef.current!.setColorAt(i, tempColor);
        });

        meshRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;

    }, [voxels, tempObject, tempColor, count]);

    // Module H: Visual Polish - Gentle floating animation
    useFrame((state) => {
        if (!groupRef.current) return;
        const t = state.clock.getElapsedTime();
        groupRef.current.position.y = Math.sin(t * 0.5) * 0.2;
        groupRef.current.rotation.y = Math.sin(t * 0.2) * 0.1;
    });

    // 2. SAFEGUARD: Fallback Grid if no data
    if (count === 0) {
        return (
            <group>
                <gridHelper args={[20, 20, 0x444444, 0x222222]} />
                <mesh position={[0, 1, 0]}>
                    <boxGeometry args={[1, 2, 1]} />
                    <meshStandardMaterial color="brown" wireframe />
                </mesh>
                <Html position={[0, 2.5, 0]}>
                    <div className="bg-black/80 px-2 py-1 rounded text-xs text-yellow-500 font-mono">
                        WAITING FOR VOXEL DATA...
                    </div>
                </Html>
            </group>
        );
    }

    return (
        <group ref={groupRef}>
            <instancedMesh
                ref={meshRef}
                args={[undefined, undefined, count]}
                castShadow
                receiveShadow
            >
                <boxGeometry args={[0.95, 0.95, 0.95]} /> {/* Slightly smaller for wireframe gaps */}
                <meshStandardMaterial />
            </instancedMesh>

            {/* Ambient lighting for voxels */}
            <ambientLight intensity={0.6} />
            <directionalLight position={[10, 20, 10]} intensity={1.2} castShadow />
        </group>
    );
};
