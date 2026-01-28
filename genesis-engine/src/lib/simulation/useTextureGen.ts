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
    // Titian v6.0 optimization: Initial check for cache to avoid effect delay
    const initialTexture = useMemo(() => (prompt ? textureCache[prompt] : null), [prompt]);
    const [textureMap, setTextureMap] = useState<THREE.Texture | null>(initialTexture);

    useEffect(() => {
        if (!prompt || textureCache[prompt]) return;

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
