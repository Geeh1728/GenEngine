import React, { useRef, useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { WorldState } from '@/lib/simulation/schema';

interface VoxelRendererProps {
    voxels: NonNullable<WorldState['voxels']>;
}

export const VoxelRenderer: React.FC<VoxelRendererProps> = ({ voxels }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const groupRef = useRef<THREE.Group>(null);

    const { count, tempObject, tempColor } = useMemo(() => ({
        count: voxels.length,
        tempObject: new THREE.Object3D(),
        tempColor: new THREE.Color()
    }), [voxels.length]);

    useLayoutEffect(() => {
        if (!meshRef.current) return;

        voxels.forEach((voxel, i) => {
            tempObject.position.set(voxel.x, voxel.y, voxel.z);
            tempObject.updateMatrix();
            meshRef.current!.setMatrixAt(i, tempObject.matrix);
            
            tempColor.set(voxel.color);
            meshRef.current!.setColorAt(i, tempColor);
        });

        meshRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;

    }, [voxels, tempObject, tempColor]);

    // Module H: Visual Polish - Gentle floating animation
    useFrame((state) => {
        if (!groupRef.current) return;
        const t = state.clock.getElapsedTime();
        groupRef.current.position.y = Math.sin(t * 0.5) * 0.2;
        groupRef.current.rotation.y = Math.sin(t * 0.2) * 0.1;
    });

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
