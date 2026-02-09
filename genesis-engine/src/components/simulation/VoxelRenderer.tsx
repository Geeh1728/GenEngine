'use client';

import React, { useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';

interface VoxelRendererProps {
    seed?: number;
}

export function VoxelRenderer({ seed = 123 }: VoxelRendererProps) {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const { scene } = useThree();

    useLayoutEffect(() => {
        if (!meshRef.current) return;

        // Voxel Config
        const VOXEL_SIZE = 1;
        const ISLAND_RADIUS = 18;
        const TREE_HEIGHT = 16;
        const PALETTE = {
            GRASS_TOP: new THREE.Color(0x6a8d46),
            DIRT: new THREE.Color(0x5c4033),
            STONE: new THREE.Color(0x7a7a7a),
            TRUNK: new THREE.Color(0x3e2723),
            LEAVES: new THREE.Color(0xffb7c5),
            WATER: new THREE.Color(0xaaddff)
        };

        const voxels: { x: number; y: number; z: number; color: THREE.Color }[] = [];
        const simplex = new SimplexNoise();

        // Procedural Island Generation
        for (let x = -ISLAND_RADIUS; x <= ISLAND_RADIUS; x++) {
            for (let z = -ISLAND_RADIUS; z <= ISLAND_RADIUS; z++) {
                const d = Math.sqrt(x * x + z * z);
                if (d < ISLAND_RADIUS - 1) {
                    const noise = simplex.noise(x * 0.1, z * 0.1);
                    const surfaceHeight = Math.floor(noise * 2);
                    let depth = Math.floor((ISLAND_RADIUS - d) * 1.2);

                    for (let y = surfaceHeight; y >= surfaceHeight - depth; y--) {
                        let color = PALETTE.STONE;
                        if (y === surfaceHeight) color = PALETTE.GRASS_TOP;
                        else if (y > surfaceHeight - 3) color = PALETTE.DIRT;

                        voxels.push({ x, y, z, color });
                    }
                }
            }
        }

        // Procedural Tree
        const trunkX = -4;
        const trunkZ = -2;
        for (let y = 0; y < TREE_HEIGHT; y++) {
            voxels.push({ x: trunkX, y: y + 1, z: trunkZ, color: PALETTE.TRUNK });
            // Leaves
            if (y > 10) {
                for (let lx = -2; lx <= 2; lx++) {
                    for (let lz = -2; lz <= 2; lz++) {
                        if (Math.random() > 0.3) {
                             voxels.push({ x: trunkX + lx, y: y + 1, z: trunkZ + lz, color: PALETTE.LEAVES });
                        }
                    }
                }
            }
        }

        // Apply to InstancedMesh
        meshRef.current.count = voxels.length;
        const dummy = new THREE.Object3D();
        
        voxels.forEach((v, i) => {
            dummy.position.set(v.x, v.y, v.z);
            dummy.updateMatrix();
            meshRef.current!.setMatrixAt(i, dummy.matrix);
            meshRef.current!.setColorAt(i, v.color);
        });

        meshRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;

    }, [seed]);

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, 10000]} castShadow receiveShadow>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial />
        </instancedMesh>
    );
}