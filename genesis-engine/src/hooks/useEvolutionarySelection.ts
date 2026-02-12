import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { runEvolutionarySelection } from '@/lib/ecs/systems';
import { useGenesisStore } from '@/lib/store/GenesisContext';

/**
 * useEvolutionarySelection (v29.0: The Mirror Stage)
 * Objective: Close the loop between user focus and entity evolution.
 */
export function useEvolutionarySelection() {
    const { camera, scene, mouse } = useThree();
    const { state } = useGenesisStore();
    const raycaster = useRef(new THREE.Raycaster());

    useEffect(() => {
        const interval = setInterval(() => {
            // 1. Find Focused Entity via Raycasting
            raycaster.current.setFromCamera(mouse, camera);
            const intersects = raycaster.current.intersectObjects(scene.children, true);

            let focusedId: string | null = null;
            if (intersects.length > 0) {
                // Find the first object with an ID in userData (assigned by EntityRenderer/ECSRenderer)
                for (const intersect of intersects) {
                    let obj: THREE.Object3D | null = intersect.object;
                    while (obj && !obj.userData.entityId) {
                        obj = obj.parent;
                    }
                    if (obj?.userData.entityId) {
                        focusedId = obj.userData.entityId;
                        break;
                    }
                }
            }

            // 2. Apply Evolutionary Pressure System
            runEvolutionarySelection(focusedId);
        }, 100); // 10Hz evaluation

        return () => clearInterval(interval);
    }, [camera, scene, mouse]);
}
