import { useState, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { textureService } from '@/lib/textures/textureService';

// --- TITAN OPTIMIZATION: GLOBAL TEXTURE CACHE ---
const textureCache: Record<string, THREE.Texture> = {};

interface UseTextureGenProps {
    prompt?: string;
    color?: string;
    fallbackColor?: string;
}

export const useTextureGen = ({ prompt, color, fallbackColor = '#888' }: UseTextureGenProps) => {
    const [textureMap, setTextureMap] = useState<THREE.Texture | null>(null);

    useEffect(() => {
        if (!prompt) return;

        // Check Cache First
        if (textureCache[prompt]) {
            setTextureMap(textureCache[prompt]);
            return;
        }

        let active = true;
        const loadTexture = async () => {
            try {
                const dataUrl = await textureService.generateTexture(prompt);
                if (active && dataUrl) {
                    const loader = new THREE.TextureLoader();
                    loader.load(dataUrl, (tex: THREE.Texture) => {
                        tex.wrapS = THREE.RepeatWrapping;
                        tex.wrapT = THREE.RepeatWrapping;
                        
                        // Store in Cache
                        textureCache[prompt] = tex;
                        
                        if (active) setTextureMap(tex);
                    });
                }
            } catch (e) {
                console.error("[useTextureGen] Failed to load texture:", e);
            }
        };
        loadTexture();
        return () => { active = false; };
    }, [prompt]);

    // Create material with useMemo to prevent unnecessary re-creation
    const material = useMemo(() => new THREE.MeshStandardMaterial({
        color: textureMap ? '#ffffff' : (color || fallbackColor), // If texture exists, white base. Else fallback.
        map: textureMap,
        roughness: 0.8,
        metalness: 0.2,
    }), [textureMap, color, fallbackColor]);

    return material;
};
