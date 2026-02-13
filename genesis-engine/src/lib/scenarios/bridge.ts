import { WorldState } from '../simulation/schema';

export const bridgeScenario: WorldState = {
    scenario: "The Prometheus Singularity",
    mode: "PHYSICS",
    domain: "SCIENCE",
    description: "A high-fidelity gravitational playground featuring a central Singularity and orbiting monoliths.",
    explanation: "This simulation demonstrates the Genesis Engine's ability to handle complex orbital mechanics, custom shaders, and interactive structural anomalies.",
    _renderingStage: 'SOLID',
    _resonanceBalance: 0.5,
    entities: [
        // The Singularity (Event Horizon)
        {
            id: 'singularity',
            shape: 'sphere',
            name: 'Singularity Core',
            position: { x: 0, y: 5, z: 0 },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
            dimensions: { x: 2, y: 2, z: 2 },
            physics: { mass: 1000, friction: 0.1, restitution: 0.9, isStatic: true },
            visual: {
                color: '#000000',
                texture: 'black hole event horizon with glowing cyan edges'
            },
            certainty: 1.0
        },
        // The Orbiting Ring (Monoliths)
        ...Array.from({ length: 8 }).map((_, i) => {
            const angle = (i / 8) * Math.PI * 2;
            const radius = 8;
            return {
                id: `monolith-${i}`,
                shape: 'cube' as const,
                name: 'Neural Monolith',
                position: { 
                    x: Math.cos(angle) * radius, 
                    y: 5 + Math.sin(angle * 2) * 2, 
                    z: Math.sin(angle) * radius 
                },
                rotation: { x: angle, y: angle, z: 0, w: 1 },
                dimensions: { x: 0.5, y: 3, z: 1 },
                physics: { mass: 5, friction: 0.5, restitution: 0.5, isStatic: false },
                visual: {
                    color: i % 2 === 0 ? '#3b82f6' : '#8b5cf6',
                    texture: 'brushed obsidian with bioluminescent blue circuitry'
                },
                certainty: 0.9
            };
        }),
        // Floating Satellites
        ...Array.from({ length: 12 }).map((_, i) => ({
            id: `satellite-${i}`,
            shape: 'sphere' as const,
            name: 'Data Spore',
            position: { 
                x: (Math.random() - 0.5) * 20, 
                y: 10 + Math.random() * 5, 
                z: (Math.random() - 0.5) * 20 
            },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
            dimensions: { x: 0.3, y: 0.3, z: 0.3 },
            physics: { mass: 0.5, friction: 0.1, restitution: 0.8, isStatic: false },
            visual: {
                color: '#06b6d4',
            },
            certainty: 0.7,
            analogyLabel: 'Data Packet'
        })),
        // The Foundation
        {
            id: 'ground',
            shape: 'plane',
            name: 'Genesis Platform',
            position: { x: 0, y: -0.5, z: 0 },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
            dimensions: { x: 50, y: 1, z: 50 },
            physics: { mass: 0, friction: 0.9, restitution: 0.3, isStatic: true },
            visual: {
                color: '#020205',
                texture: 'cyberpunk dark metal floor with hexagonal grid'
            },
            certainty: 1.0
        }
    ],
    constraints: [
        "Monoliths will eventually be drawn into the Singularity if momentum fails.",
        "Gravity is non-uniform near the core."
    ],
    successCondition: "Achieve stable orbit or synthesize new reality.",
    environment: {
        gravity: { x: 0, y: -9.81, z: 0 },
        timeScale: 1.2
    },
    // Safe MacGyver Move: Fixed syntax for Vercel build
    custom_canvas_code: `(ctx, time) => {
        const centerX = ctx.canvas.width / 2;
        const centerY = ctx.canvas.height / 2;
        const radius = 100 + Math.sin(time * 2) * 10;
        
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#3b82f6';
        
        for(let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius + (i * 20), 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(59, 130, 246, ' + (0.3 - (i * 0.1)) + ')';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        return Array.from({length: 5}).map((_, i) => ({
            id: 'particle-' + i,
            position: {
                x: centerX + Math.cos(time + i) * 150,
                y: centerY + Math.sin(time + i) * 150
            },
            color: '#8b5cf6'
        }));
    }`,
    sabotage_reveal: "ALERT: Gravitational shear detected in Sector 7. The singularity is consuming data packets. Reality coherence dropping.",
    societalImpact: "When knowledge becomes so dense it collapses into a singularity, we must ensure the event horizon is navigable by all, not just the elite."
};
