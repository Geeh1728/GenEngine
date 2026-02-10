import { Vector3 } from 'three';

export type BiomeType = 'SPACE' | 'EARTH' | 'OCEAN' | 'FACTORY' | 'JUPITER';

export interface BiomeConfig {
    id: BiomeType;
    name: string;
    description: string;
    visuals: {
        skybox: 'stars' | 'city' | 'ocean' | 'gradient' | 'warehouse';
        fogColor?: string;
        fogDensity?: number;
        ambientLightIntensity: number;
        starCount?: number;
    };
    physics: {
        gravity: { x: number; y: number; z: number }; // Rapier expects vector
        wrapperDamping: number; // Linear damping (air/water resistance)
        timeScale: number; // For matrix-style disconnects
    };
}

export const BIOME_PRESETS: Record<BiomeType, BiomeConfig> = {
    EARTH: {
        id: 'EARTH',
        name: 'Standard Earth',
        description: '9.81 m/s², Standard Atmosphere',
        visuals: {
            skybox: 'city', // Fallback to gradient/city
            ambientLightIntensity: 0.8,
            fogColor: '#abcdef',
            fogDensity: 0.002
        },
        physics: {
            gravity: { x: 0, y: -9.81, z: 0 },
            wrapperDamping: 0.0, // Standard air has negligible drag for this scale usually
            timeScale: 1.0
        }
    },
    SPACE: {
        id: 'SPACE',
        name: 'Deep Space',
        description: 'Zero Gravity, Vacuum',
        visuals: {
            skybox: 'stars',
            ambientLightIntensity: 0.2, // Darker
            starCount: 10000
        },
        physics: {
            gravity: { x: 0, y: 0, z: 0 },
            wrapperDamping: 0.0, // No friction
            timeScale: 1.0
        }
    },
    OCEAN: {
        id: 'OCEAN',
        name: 'Abyssal Zone',
        description: 'High Drag, Buoyancy Offset',
        visuals: {
            skybox: 'ocean',
            fogColor: '#001e36',
            fogDensity: 0.1, // Thick fog
            ambientLightIntensity: 0.4
        },
        physics: {
            gravity: { x: 0, y: -2.0, z: 0 }, // Lower effective gravity due to buoyancy
            wrapperDamping: 2.0, // High fluid drag
            timeScale: 0.8 // Slightly slower feel
        }
    },
    JUPITER: {
        id: 'JUPITER',
        name: 'Gas Giant Core',
        description: 'Extreme Gravity (24.79 m/s²)',
        visuals: {
            skybox: 'gradient',
            fogColor: '#d65a31', // Orange/Red
            fogDensity: 0.05,
            ambientLightIntensity: 0.6
        },
        physics: {
            gravity: { x: 0, y: -24.79, z: 0 },
            wrapperDamping: 0.1, // Dense atmosphere
            timeScale: 1.0
        }
    },
    FACTORY: {
        id: 'FACTORY',
        name: 'Industrial Zone',
        description: 'Standard Physics, Metallic Audio',
        visuals: {
            skybox: 'warehouse',
            ambientLightIntensity: 1.0,
            fogColor: '#555555',
            fogDensity: 0.02
        },
        physics: {
            gravity: { x: 0, y: -9.81, z: 0 },
            wrapperDamping: 0.0,
            timeScale: 1.0
        }
    }
};

// Helper to infer biome from prompt if not explicitly set
export function inferBiomeFromText(text: string): BiomeType | null {
    const t = text.toLowerCase();
    if (t.includes('space') || t.includes('orbit') || t.includes('zero g')) return 'SPACE';
    if (t.includes('ocean') || t.includes('water') || t.includes('underwater') || t.includes('subsea')) return 'OCEAN';
    if (t.includes('jupiter') || t.includes('giant') || t.includes('heavy gravity')) return 'JUPITER';
    if (t.includes('factory') || t.includes('industrial') || t.includes('warehouse')) return 'FACTORY';
    if (t.includes('earth') || t.includes('normal')) return 'EARTH';
    return null;
}
