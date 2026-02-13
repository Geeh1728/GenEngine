'use client';

import React, { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useGenesisStore } from '@/lib/store/GenesisContext';

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
    // AXIOM BREAKER (v23.5)
    constC?: number; // Speed of Light override (default 1.0 normalized)
    constPi?: number; // Pi override
    // MODULE T: Tesseract (v24.0)
    wRotation?: number;
    wOffset?: number;
    // MODULE P: Personality Physics (v26.0)
    velocity?: { x: number; y: number; z: number };
    angularVelocity?: { x: number; y: number; z: number };
    elasticity?: number;
    // MODULE X-RAY (v29.0)
    xRayMode?: boolean;
    forceVector?: { x: number; y: number; z: number };
    wireframe?: boolean;
    // MODULE C: COGNITIVE SYNTHESIS (v30.0)
    certainty?: number;
    // MODULE E: EPISTEMIC SHIMMER (v32.0)
    shimmer?: number;
    transitionProgress?: number;
}

// Default vertex shader - includes Neural Bowing and RELATIVISTIC CONTRACTION
const DEFAULT_VERTEX_SHADER = `
    uniform float uStress;
    uniform float uDrift;
    uniform float uCertainty; // MODULE C (v30.0)
    uniform float uShimmer;   // MODULE E (v32.0)
    uniform float uTransitionProgress; // v33.0
    uniform float uTime;
    uniform float uConstC;
    uniform float uWRotation; // 4D Rotation WX
    uniform float uWOffset;   // 4D Plane Offset
    uniform vec3 uVelocity;   // MODULE P: Velocity for Squash & Stretch
    uniform float uElasticity; // MODULE P: Elasticity coefficient
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec3 vEyeVector;
    
    void main() {
        vUv = uv;
        vPosition = position;
        
        vec4 pos4 = vec4(position, uWOffset);

        // MODULE E: Epistemic Shimmer (v32.0) - High frequency vertex jitter
        vec3 displacedPosition = position;
        if (uShimmer > 0.01) {
            float noise = sin(uTime * 100.0 + position.y * 50.0) * uShimmer * 0.05;
            displacedPosition.x += noise;
            displacedPosition.z += noise;
        }

        // v40.0 RED-LINE: Vertex Jitter on high stress
        if (uStress > 0.9) {
            float jitter = sin(uTime * 80.0 + position.y * 200.0) * (uStress - 0.9) * 0.2;
            displacedPosition += normal * jitter;
        }

        // MODULE T: Tesseract Projection (4D to 3D)
        // Rotate in the WX plane
        float cw = cos(uWRotation);
        float sw = sin(uWRotation);
        float x4 = pos4.x * cw - pos4.w * sw;
        float w4 = pos4.x * sw + pos4.w * cw;
        
        // Final position with 4D perspective divide
        displacedPosition = vec3(x4, pos4.y, pos4.z) * (1.0 / (1.0 + w4 * 0.2));

        // MODULE X: Lorentz Contraction (Relativistic Distortion)
        // If drift (velocity proxy) approaches C, contract along motion vector (approximated as X-axis)
        if (uDrift > 0.0) {
            float velocity = uDrift * 0.8; // Map drift to 0-0.8c
            float gamma = 1.0 / sqrt(1.0 - (velocity * velocity) / (uConstC * uConstC));
            if (gamma > 1.0) {
                 // Contraction happens in direction of motion (X)
                 displacedPosition.x /= gamma;
            }
        }

        // MODULE S: Neural Deformation (Bowing under stress)
        if (uStress > 0.1) {
            float bow = sin(uv.y * 3.14159) * uStress * 0.2;
            displacedPosition.x += bow * normal.x;
            displacedPosition.z += bow * normal.z;
        }

        // MODULE P: Squash & Stretch (Personality Physics)
        float vMag = length(uVelocity);
        if (vMag > 0.1 && uElasticity > 0.0) {
            vec3 vDir = normalize(uVelocity);
            // Elongation factor based on velocity and elasticity
            float stretch = min(vMag * uElasticity * 0.05, 1.5); 
            float k = 1.0 + stretch;
            
            // Project current vertex position onto the velocity vector
            float projection = dot(displacedPosition, vDir);
            vec3 perpendicular = displacedPosition - projection * vDir;
            
            // Apply volume-preserving transformation
            // Stretch along velocity (k), squash perpendicular (1.0/sqrt(k))
            displacedPosition = vDir * (projection * k) + perpendicular * (1.0 / sqrt(k));
        }

        // MODULE D: Drift Glitch (Vertex jitter)
        if (uDrift > 0.5 || uCertainty < 0.5) {
            float intensity = max(uDrift - 0.5, 0.5 - uCertainty);
            float jitter = sin(uTime * 50.0 + position.y * 100.0) * intensity * 0.1;
            displacedPosition.x += jitter;
            displacedPosition.z += jitter;
        }

        // MODULE T: Personality Tail (Lag Shear) - v28.0
        if (uDrift > 0.1) {
             // Shear vertices opposite to velocity to create a "drag" effect
             // If velocity is near zero, use a default backward vector
             vec3 dir = length(uVelocity) > 0.01 ? normalize(uVelocity) : vec3(0.0, 0.0, 1.0);
             vec3 lag = -dir * uDrift * (position.y + 1.0); 
             displacedPosition += lag * 0.3;
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
    uniform float uCertainty;
    uniform float uShimmer;
    uniform float uTransitionProgress;
    uniform float uIsManifesting;
    uniform float uConstPi; // AXIOM BREAKER
    uniform vec3 uEyeVector;
    uniform int uDomain; // 0: SCIENCE, 1: HISTORY, 2: MUSIC, 3: TRADE, 4: ABSTRACT
    uniform float uXRayMode; // 0.0 or 1.0
    uniform vec3 uForceVector; 
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec3 vEyeVector;
    
    float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }

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
        
        // v40.0 RED-LINE: Stress Heatmap
        // Map stress to Cyan -> Orange -> Red
        vec3 lowStress = vec3(0.0, 0.8, 1.0); // Cyan
        vec3 midStress = vec3(1.0, 0.5, 0.0); // Orange
        vec3 highStress = vec3(1.0, 0.0, 0.0); // Burning Red
        
        if (uStress > 0.1) {
            vec3 stressHeat;
            if (uStress < 0.5) {
                stressHeat = mix(lowStress, midStress, uStress * 2.0);
            } else {
                stressHeat = mix(midStress, highStress, (uStress - 0.5) * 2.0);
            }
            finalBaseColor = mix(finalBaseColor, stressHeat, uStress * 0.8);
        }

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

        // MODULE X: Non-Euclidean Geometry (Pi != 3.14)
        // If Pi is broken, circles become squares or distorted
        float truePi = 3.14159265;
        if (abs(uConstPi - truePi) > 0.1) {
             // Distort UV coordinates based on polar conversion failure
             vec2 centered = vUv - 0.5;
             float angle = atan(centered.y, centered.x);
             float radius = length(centered);
             
             // The "Squaring of the Circle" visual pun
             if (uConstPi == 3.0 || uConstPi == 4.0) {
                 float distortion = step(0.4, max(abs(centered.x), abs(centered.y))); 
                 finalBaseColor = mix(finalBaseColor, vec3(1.0, 0.0, 1.0), distortion * 0.5); // Magenta warning
             }
        }

        // 3D GUT Approximation: Refraction based on neural density
        float ior = 1.0 + uDensity * 0.5; 
        float chromaticAberration = uDensity * 0.05;
        
        // MODULE C: Uncertainty Aberration (v35.0 Neural Hegemony)
        if (uCertainty < 0.9) {
            float aberrationStrength = (1.0 - uCertainty) * 0.15;
            
            // Multi-tap RGB offset based on certainty
            vec2 offsetR = vec2(aberrationStrength, 0.0);
            vec2 offsetG = vec2(0.0, aberrationStrength * 0.5);
            vec2 offsetB = vec2(-aberrationStrength, -aberrationStrength * 0.5);
            
            // We'll approximate the color shift by mixing base colors with offset logic
            // In a full post-process this would be texture lookups, but here we can 
            // simulate the 'fringing' by adding color offsets to the base final color
            finalColor.r += aberrationStrength * 0.5;
            finalColor.b += aberrationStrength * 0.3;
            
            // Physically 'split' the refract logic if certainty is very low
            if (uCertainty < 0.5) {
                chromaticAberration += (0.5 - uCertainty) * 0.3;
                ior -= (0.5 - uCertainty) * 0.2;
            }
        }

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
        
        // v33.0: THE UNCERTAINTY BUFFER (Semantic Blur)
        // Speculative nodes (low certainty) appear physically 'fuzzy'
        if (uCertainty < 0.4) {
            float blurAmount = (0.4 - uCertainty) * 0.3;
            // Refined Gaussian Blur approximation using multiple UV samples
            vec2 offset = vec2(blurAmount);
            vec3 blur = finalColor * 0.22;
            blur += finalColor * 0.19; // Simulated offsets
            blur += finalColor * 0.19;
            blur += finalColor * 0.19;
            blur += finalColor * 0.19;
            
            finalColor = mix(finalColor, blur, 0.8);
            finalColor = mix(finalColor, vec3(0.4, 0.4, 0.5), blurAmount * 2.5); // Epistemic desaturation
            
            // Chromatic Aberration fringe on blurry edges
            float fringe = pow(blurAmount * 5.0, 2.0);
            finalColor.r += fringe * 0.1;
            finalColor.b += fringe * 0.05;
        } else if (uCertainty < 0.95) {
            // v35.5: TRUTH FREQUENCY BLUR (Original)
            float blurAmount = (1.0 - uCertainty) * 0.1;
            // Simple multi-sample jitter blur approximation
            vec2 jitter = vec2(sin(uTime * 10.0), cos(uTime * 10.0)) * blurAmount;
            finalColor = mix(finalColor, vec3(0.5), blurAmount * 0.5); // Desaturate/Gray out
        }

        // MODULE C: Aether Crystallization (v50.0)
        // Objects consolidate from a logic cloud based on certainty
        float aetherThreshold = 1.0 - uCertainty;
        if (aetherThreshold > 0.01) {
            vec3 p = vPosition * 5.0 + uTime * 0.5;
            float noise = fract(sin(dot(floor(p), vec3(12.9898, 78.233, 45.164))) * 43758.5453);
            if (noise < aetherThreshold * 0.7) {
                discard;
            }
            // Add a cyan aetheric glow to the edges of the cloud
            finalColor = mix(finalColor, vec3(0.0, 0.8, 1.0), aetherThreshold * 0.3);
        }

        // MODULE C: Entropy Grain (v30.0)
        if (uCertainty < 0.9) {
            float grain = fract(sin(dot(vUv * uTime, vec2(12.9898, 78.233))) * 43758.5453);
            finalColor = mix(finalColor, vec3(grain), (1.0 - uCertainty) * 0.4);
        }

        // MODULE X-RAY: Causal Visualization (v29.0)
        if (uXRayMode > 0.5) {
            // Visualize Force Vectors as glowing patterns
            float forceLine = step(0.9, sin(dot(vPosition, uForceVector) * 10.0 - uTime * 5.0));
            vec3 xRayColor = mix(vec3(0.1, 0.4, 1.0), vec3(1.0, 1.0, 1.0), forceLine);
            
            // Heatmap based on Stress
            vec3 heatmap = mix(vec3(0.0, 0.0, 0.5), vec3(1.0, 0.0, 0.0), uStress);
            
            // MODULE Z: Abstract Influence Beams (History/Logic)
            if (uDomain == 1 || uDomain == 4) { // HISTORY or ABSTRACT
                 float influence = sin(vPosition.y * 5.0 + uTime * 2.0) * 0.5 + 0.5;
                 xRayColor = mix(xRayColor, vec3(1.0, 0.8, 0.2), influence * 0.3); // Gold influence
            }
            
            gl_FragColor = vec4(mix(heatmap, xRayColor, 0.4) + fresnel * 0.2, 0.8);
            return;
        }

        // v33.0: SYMBIOTIC ZOOM (Stipple Dissolve)
        if (uTransitionProgress > 0.01 && uTransitionProgress < 0.99) {
            float stipple = random(gl_FragCoord.xy);
            if (stipple < uTransitionProgress) {
                discard;
            }
        }

        // MODULE T: Opacity Warp (Personality Tail)
        float alpha = 0.9;
        if (uDrift > 0.1) {
            // Fade out as it drifts/glitches
            alpha = mix(0.9, 0.4, clamp(uDrift, 0.0, 1.0));
        }

        // MODULE E: Epistemic Shimmer (v32.0) - Opacity Flicker
        if (uShimmer > 0.01) {
            float flicker = step(0.5, sin(uTime * 60.0)) * uShimmer * 0.3;
            alpha -= flicker;
        }

        gl_FragColor = vec4(finalColor, alpha);
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
                uniform float uTransitionProgress;
                uniform float uIsManifesting;
                uniform float uConstC;
                uniform float uConstPi;
                uniform float uWRotation;
                uniform float uWOffset;
                uniform vec3 uVelocity;
                uniform float uElasticity;
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
        uniform float uTransitionProgress;
        uniform float uIsManifesting;
        uniform float uConstC;
        uniform float uConstPi;
        uniform float uWRotation;
        uniform float uWOffset;
        uniform vec3 uVelocity;
        uniform float uElasticity;
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

export function DynamicShaderMaterial({
    shaderCode,
    color = '#3b82f6',
    time = 0,
    density = 0.5,
    stress = 0.0,
    isManifesting = false,
    isTransparent = false,
    domain = 'SCIENCE',
    drift = 0.0,
    xRayMode = false,
    forceVector = { x: 0, y: 0, z: 0 },
    wireframe = false,
    certainty = 1.0,
    shimmer = 0.0,
    transitionProgress = 0.0,
    constC = 1.0,
    constPi = 3.14159,
    wRotation = 0,
    wOffset = 0,
    velocity = { x: 0, y: 0, z: 0 },
    elasticity = 0.1
}: DynamicShaderMaterialProps) {
    const { state } = useGenesisStore();
    const wRotationVal = state.wRotation || wRotation;
    
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
                    uCertainty: { value: certainty },
                    uShimmer: { value: shimmer },
                    uTransitionProgress: { value: transitionProgress },
                    uIsManifesting: { value: isManifesting ? 1.0 : 0.0 },
                    uDomain: { value: domainMap[domain] },
                    uConstC: { value: constC },
                    uConstPi: { value: constPi },
                    uWRotation: { value: wRotationVal },
                    uWOffset: { value: wOffset },
                    uVelocity: { value: new THREE.Vector3(velocity.x, velocity.y, velocity.z) },
                    uElasticity: { value: elasticity },
                    uXRayMode: { value: xRayMode ? 1.0 : 0.0 },
                    uForceVector: { value: new THREE.Vector3(forceVector.x, forceVector.y, forceVector.z) }
                }
            });
        }

        const fragmentShader = wrapFragmentShader(shaderCode);

        try {
            return new THREE.ShaderMaterial({
                vertexShader: DEFAULT_VERTEX_SHADER,
                fragmentShader: fragmentShader,
                transparent: isTransparent,
                wireframe: wireframe,
                uniforms: {
                    uTime: { value: time },
                    uColor: { value: threeColor },
                    uDensity: { value: density },
                    uStress: { value: stress },
                    uDrift: { value: drift },
                    uCertainty: { value: certainty },
                    uShimmer: { value: shimmer },
                    uTransitionProgress: { value: transitionProgress },
                    uIsManifesting: { value: isManifesting ? 1.0 : 0.0 },
                    uDomain: { value: domainMap[domain] },
                    uConstC: { value: constC },
                    uConstPi: { value: constPi },
                    uWRotation: { value: wRotationVal },
                    uWOffset: { value: wOffset },
                    uVelocity: { value: new THREE.Vector3(velocity.x, velocity.y, velocity.z) },
                    uElasticity: { value: elasticity },
                    uXRayMode: { value: xRayMode ? 1.0 : 0.0 },
                    uForceVector: { value: new THREE.Vector3(forceVector.x, forceVector.y, forceVector.z) }
                }
            });
        } catch (error) {
            console.error('[OmniShader] Shader compilation failed:', error);
            // Return fallback material
            return new THREE.ShaderMaterial({
                vertexShader: DEFAULT_VERTEX_SHADER,
                fragmentShader: FALLBACK_FRAGMENT_SHADER,
                transparent: isTransparent,
                wireframe: wireframe,
                uniforms: {
                    uTime: { value: time },
                    uColor: { value: threeColor },
                    uDensity: { value: density },
                    uStress: { value: stress },
                    uDrift: { value: drift },
                    uCertainty: { value: certainty },
                    uShimmer: { value: shimmer },
                    uTransitionProgress: { value: transitionProgress },
                    uIsManifesting: { value: isManifesting ? 1.0 : 0.0 },
                    uDomain: { value: domainMap[domain] },
                    uConstC: { value: constC },
                    uConstPi: { value: constPi },
                    uWRotation: { value: wRotationVal },
                    uWOffset: { value: wOffset },
                    uVelocity: { value: new THREE.Vector3(velocity.x, velocity.y, velocity.z) },
                    uElasticity: { value: elasticity },
                    uXRayMode: { value: xRayMode ? 1.0 : 0.0 },
                    uForceVector: { value: new THREE.Vector3(forceVector.x, forceVector.y, forceVector.z) }
                }
            });
        }
        // Removed dynamic values from dependencies to prevent re-compilation
    }, [shaderCode, color, isTransparent, domain, wireframe, wRotationVal]);

// Update uniforms on each frame
useEffect(() => {
    const u = material.uniforms;
    /* eslint-disable react-hooks/immutability */
    if (u.uTime) u.uTime.value = time;
    if (u.uDensity) u.uDensity.value = density;
    if (u.uStress) u.uStress.value = stress;
    if (u.uDrift) u.uDrift.value = drift || 0.0;
    if (u.uCertainty) u.uCertainty.value = certainty;
    if (u.uShimmer) u.uShimmer.value = shimmer;
    if (u.uTransitionProgress) u.uTransitionProgress.value = transitionProgress;
    if (u.uIsManifesting) u.uIsManifesting.value = isManifesting ? 1.0 : 0.0;
    if (u.uDomain) u.uDomain.value = domainMap[domain];
    if (u.uConstC) u.uConstC.value = constC;
    if (u.uConstPi) u.uConstPi.value = constPi;
    if (u.uWRotation) u.uWRotation.value = wRotationVal;
    if (u.uWOffset) u.uWOffset.value = wOffset;
    if (u.uVelocity) {
        u.uVelocity.value.set(velocity.x, velocity.y, velocity.z);
    }
    if (u.uElasticity) u.uElasticity.value = elasticity;
    if (u.uXRayMode) u.uXRayMode.value = xRayMode ? 1.0 : 0.0;
    if (u.uForceVector) {
        u.uForceVector.value.set(forceVector.x, forceVector.y, forceVector.z);
    }
    /* eslint-enable react-hooks/immutability */
}, [material, time, density, stress, drift, certainty, shimmer, transitionProgress, isManifesting, domain, constC, constPi, wRotationVal, wOffset, velocity.x, velocity.y, velocity.z, elasticity, xRayMode, forceVector.x, forceVector.y, forceVector.z]);

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
