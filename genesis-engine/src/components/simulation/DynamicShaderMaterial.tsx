'use client';

import React, { useMemo, useEffect } from 'react';
import * as THREE from 'three';

/**
 * DynamicShaderMaterial: Compiles AI-generated GLSL into Three.js ShaderMaterial.
 * 
 * The Omni-Shader Engine allows the AI to inject custom visual effects
 * like heat distortion, force fields, or procedural patterns.
 */

interface DynamicShaderMaterialProps {
    shaderCode: string;
    color?: string;
    time?: number;
    density?: number;
    stress?: number;
    isManifesting?: boolean;
    isTransparent?: boolean;
    domain?: 'SCIENCE' | 'HISTORY' | 'MUSIC' | 'TRADE' | 'ABSTRACT';
    drift?: number;
}

// Default vertex shader - standard position transformation + Neural Bowing
const DEFAULT_VERTEX_SHADER = `
    uniform float uTime;
    uniform float uStress;
    uniform float uDrift;
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec3 vEyeVector;
    
    void main() {
        vUv = uv;
        vPosition = position;
        
        // MODULE S: Neural Deformation (Bowing under stress)
        vec3 displacedPosition = position;
        if (uStress > 0.1) {
            float bow = sin(uv.y * 3.14159) * uStress * 0.2;
            displacedPosition.x += bow * normal.x;
            displacedPosition.z += bow * normal.z;
        }

        // MODULE D: Drift Glitch (Vertex jitter)
        if (uDrift > 0.5) {
            float jitter = sin(uTime * 50.0 + position.y * 100.0) * (uDrift - 0.5) * 0.1;
            displacedPosition.x += jitter;
        }
        
        vNormal = normalize(normalMatrix * normal);
        vec4 worldPosition = modelMatrix * vec4(displacedPosition, 1.0);
        vEyeVector = normalize(worldPosition.xyz - cameraPosition);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPosition, 1.0);
    }
`;

// Fallback fragment shader - simple color with 3D GUT refraction, Stress Fractures, and Neural Glow
const FALLBACK_FRAGMENT_SHADER = `
    uniform float uTime;
    uniform vec3 uColor;
    uniform float uDensity;
    uniform float uStress;
    uniform float uDrift;
    uniform float uIsManifesting;
    uniform int uDomain; // 0: SCIENCE, 1: HISTORY, 2: MUSIC, 3: TRADE, 4: ABSTRACT
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vEyeVector;
    
    void main() {
        // MODULE D: Drift Effect (Neon Red Glitch)
        vec3 driftColor = vec3(1.0, 0.1, 0.4); // Scientific Dissent Pink/Red
        
        // MODULE V: Google Magic Manifestation Glow
        vec3 manifestColor = vec3(0.0);
        if (uIsManifesting > 0.5) {
            // Pulsing multi-colored gradient (Google palette approximation)
            vec3 c1 = vec3(0.25, 0.52, 0.95); // Blue
            vec3 c2 = vec3(0.91, 0.26, 0.2); // Red
            vec3 c3 = vec3(0.98, 0.73, 0.01); // Yellow
            vec3 c4 = vec3(0.2, 0.65, 0.32); // Green
            
            float t = uTime * 2.0;
            manifestColor = mix(
                mix(c1, c2, sin(t + vUv.x * 5.0) * 0.5 + 0.5),
                mix(c3, c4, cos(t + vUv.y * 5.0) * 0.5 + 0.5),
                sin(t * 0.5) * 0.5 + 0.5
            );
        }

        // DOMAIN EFFECTS
        vec3 finalBaseColor = uColor;
        if (uDrift > 0.3) {
            float flicker = step(0.5, sin(uTime * 30.0));
            finalBaseColor = mix(finalBaseColor, driftColor, uDrift * flicker);
        }

        if (uDomain == 1) { // HISTORY: Parchment/Sepia
            finalBaseColor = mix(uColor, vec2(0.8, 0.7).xyx, 0.5);
        } else if (uDomain == 2) { // MUSIC: Frequency Ripple
            float ripple = sin(vUv.x * 20.0 + uTime * 5.0) * 0.1;
            finalBaseColor += ripple;
        } else if (uDomain == 4) { // ABSTRACT: Neon Pulse
            finalBaseColor *= (0.8 + 0.2 * sin(uTime * 3.0));
        }

        // 3D GUT Approximation: Refraction based on neural density
        float ior = 1.0 + uDensity * 0.5; 
        float chromaticAberration = uDensity * 0.05;
        
        float r = refract(vEyeVector, vNormal, 1.0/(ior + chromaticAberration)).r;
        float g = refract(vEyeVector, vNormal, 1.0/ior).g;
        float b = refract(vEyeVector, vNormal, 1.0/(ior - chromaticAberration)).b;
        
        vec3 refractionColor = vec3(r, g, b) * 0.5;
        
        // MODULE S: Visual Stress Mapping (Heat/Fracture)
        vec3 stressColor = mix(finalBaseColor, vec3(1.0, 0.2, 0.0), uStress);
        if (uStress > 0.8) {
            // Micro-fracture "static" effect
            float fracture = step(0.98, fract(sin(dot(vUv * 100.0, vec2(12.9898, 78.233))) * 43758.5453));
            stressColor = mix(stressColor, vec3(1.0), fracture);
        }

        float fresnel = pow(1.0 - dot(vNormal, -vEyeVector), 3.0);
        vec3 baseFinal = mix(stressColor, refractionColor, 0.3);
        
        // Final blend with manifestation glow
        vec3 finalColor = mix(baseFinal, manifestColor, uIsManifesting * 0.6) + fresnel * 0.5;
        
        gl_FragColor = vec4(finalColor, 0.9);
    }
`;

/**
 * Wraps user-provided GLSL fragment code in a complete shader.
 * Provides standard uniforms and varyings.
 */
function wrapFragmentShader(userCode: string): string {
    // If user code already contains 'void main', use it directly
    if (userCode.includes('void main')) {
        // Ensure it has the required uniforms
        const hasUniforms = userCode.includes('uniform');
        if (!hasUniforms) {
            return `
                uniform float uTime;
                uniform vec3 uColor;
                uniform float uDensity;
                uniform float uStress;
                uniform float uIsManifesting;
                uniform int uDomain;
                varying vec2 vUv;
                varying vec3 vPosition;
                varying vec3 vNormal;
                varying vec3 vEyeVector;
                
                ${userCode}
            `;
        }
        return userCode;
    }

    // Otherwise, wrap the code as the body of main()
    return `
        uniform float uTime;
        uniform vec3 uColor;
        uniform float uDensity;
        uniform float uStress;
        uniform float uIsManifesting;
        uniform int uDomain;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vEyeVector;
        
        void main() {
            ${userCode}
        }
    `;
}

/**
 * Validates GLSL code for basic safety and syntax.
 */
function validateShaderCode(code: string): boolean {
    // Block potentially dangerous patterns
    const dangerousPatterns = [
        /while\s*\(\s*true\s*\)/i,  // Infinite loops
        /for\s*\([^;]*;\s*;\s*\)/i,  // Unbounded for loops
    ];

    for (const pattern of dangerousPatterns) {
        if (pattern.test(code)) {
            console.warn('[OmniShader] Blocked potentially dangerous shader pattern.');
            return false;
        }
    }

    return true;
}

export function DynamicShaderMaterial({ shaderCode, color = '#3b82f6', time = 0, density = 0.5, stress = 0.0, isManifesting = false, isTransparent = false, domain = 'SCIENCE', drift = 0.0 }: DynamicShaderMaterialProps) {
    const domainMap = { SCIENCE: 0, HISTORY: 1, MUSIC: 2, TRADE: 3, ABSTRACT: 4 };
    const material = useMemo(() => {
        // Convert hex color to THREE.Color
        const threeColor = new THREE.Color(color);

        // Validate shader code
        if (!validateShaderCode(shaderCode)) {
            console.warn('[OmniShader] Using fallback shader due to validation failure.');
            return new THREE.ShaderMaterial({
                vertexShader: DEFAULT_VERTEX_SHADER,
                fragmentShader: FALLBACK_FRAGMENT_SHADER,
                transparent: isTransparent,
                uniforms: {
                    uTime: { value: time },
                    uColor: { value: threeColor },
                    uDensity: { value: density },
                    uStress: { value: stress },
                    uDrift: { value: drift },
                    uIsManifesting: { value: isManifesting ? 1.0 : 0.0 },
                    uDomain: { value: domainMap[domain] }
                }
            });
        }

        try {
            const fragmentShader = wrapFragmentShader(shaderCode);

            return new THREE.ShaderMaterial({
                vertexShader: DEFAULT_VERTEX_SHADER,
                fragmentShader: fragmentShader,
                transparent: isTransparent,
                uniforms: {
                    uTime: { value: time },
                    uColor: { value: threeColor },
                    uDensity: { value: density },
                    uStress: { value: stress },
                    uDrift: { value: drift },
                    uIsManifesting: { value: isManifesting ? 1.0 : 0.0 },
                    uDomain: { value: domainMap[domain] }
                }
            });
        } catch (error) {
            console.error('[OmniShader] Shader compilation failed:', error);
            // Return fallback material
            return new THREE.ShaderMaterial({
                vertexShader: DEFAULT_VERTEX_SHADER,
                fragmentShader: FALLBACK_FRAGMENT_SHADER,
                transparent: isTransparent,
                uniforms: {
                    uTime: { value: time },
                    uColor: { value: threeColor },
                    uDensity: { value: density },
                    uStress: { value: stress },
                    uDrift: { value: drift },
                    uIsManifesting: { value: isManifesting ? 1.0 : 0.0 },
                    uDomain: { value: domainMap[domain] }
                }
            });
        }
    }, [shaderCode, color, isTransparent, isManifesting, domain]);

    // Update uniforms on each frame
    useEffect(() => {
        if (material.uniforms.uTime) material.uniforms.uTime.value = time;
        if (material.uniforms.uDensity) material.uniforms.uDensity.value = density;
        if (material.uniforms.uStress) material.uniforms.uStress.value = stress;
        if (material.uniforms.uDrift) material.uniforms.uDrift.value = drift || 0.0;
        if (material.uniforms.uIsManifesting) material.uniforms.uIsManifesting.value = isManifesting ? 1.0 : 0.0;
        if (material.uniforms.uDomain) material.uniforms.uDomain.value = domainMap[domain];
    }, [material, time, density, stress, drift, isManifesting, domain]);

    return <primitive object={material} attach="material" />;
}

/**
 * Hook to use dynamic shader material with animation time.
 */
export function useDynamicShader(shaderCode: string, color?: string) {
    const [time, setTime] = React.useState(0);

    React.useEffect(() => {
        let animationId: number;
        const startTime = performance.now();

        const animate = () => {
            setTime((performance.now() - startTime) / 1000);
            animationId = requestAnimationFrame(animate);
        };

        animationId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationId);
    }, []);

    return { time, DynamicShaderMaterial: () => <DynamicShaderMaterial shaderCode={shaderCode} color={color} time={time} /> };
}