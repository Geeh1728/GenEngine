import * as THREE from 'three';
import { BaseSimulation } from './types';

export class DoubleSlitSimulation implements BaseSimulation {
    private scene: THREE.Scene;
    private particles: THREE.Points;
    private wave: THREE.Mesh;
    private isObserved: boolean = false;
    private godMode: {
        gravity: number;
        planck: number;
        timeScale: number;
        overrides: string[];
    } = {
            gravity: 9.8,
            planck: 1,
            timeScale: 1,
            overrides: []
        };

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.particles = this.createParticleSystem();
        this.wave = this.createWaveRepresentation();

        // Initially in "Wave" state (Superposition)
        this.scene.add(this.wave);
    }

    private createParticleSystem(): THREE.Points {
        const geometry = new THREE.BufferGeometry();
        const count = 5000;
        const positions = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 2; // X
            positions[i * 3 + 1] = (Math.random() - 0.5) * 5; // Y
            positions[i * 3 + 2] = -10; // Z (at the screen)
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const material = new THREE.PointsMaterial({ color: 0x00ffff, size: 0.05 });
        return new THREE.Points(geometry, material);
    }

    private createWaveRepresentation(): THREE.Mesh {
        const geometry = new THREE.PlaneGeometry(10, 5, 64, 32);
        const material = new THREE.MeshPhongMaterial({
            color: 0x3b82f6,
            transparent: true,
            opacity: 0.3,
            wireframe: true,
            side: THREE.DoubleSide
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.z = -5; // Between slits and screen
        return mesh;
    }

    public updateGodMode(config: typeof this.godMode) {
        this.godMode = config;
    }

    public setObserved(observed: boolean) {
        if (this.isObserved === observed) return;
        this.isObserved = observed;

        this.syncState();
    }

    private syncState() {
        const superpositionBroken = this.godMode.overrides.includes('superposition') || this.godMode.overrides.some(o => o.toLowerCase().includes('superposition'));
        const effectivelyObserved = this.isObserved || superpositionBroken;

        if (effectivelyObserved) {
            this.scene.remove(this.wave);
            this.scene.add(this.particles);
        } else {
            this.scene.remove(this.particles);
            this.scene.add(this.wave);
        }
    }

    public update(time: number) {
        const delta = time * this.godMode.timeScale;
        const superpositionBroken = this.godMode.overrides.includes('superposition') || this.godMode.overrides.some(o => o.toLowerCase().includes('superposition'));
        const effectivelyObserved = this.isObserved || superpositionBroken;

        // Ensure state is synced if an override changed
        this.syncState();

        if (!effectivelyObserved) {
            // Animate wave pattern
            const positions = this.wave.geometry.attributes.position;
            for (let i = 0; i < positions.count; i++) {
                const x = positions.getX(i);
                const y = positions.getY(i);
                // Simple interference pattern approximation influenced by "Planck's"
                const z = Math.sin(x * (2 / this.godMode.planck) + delta * 5) * Math.cos(y * 2) * 0.5;
                positions.setZ(i, z);
            }
            positions.needsUpdate = true;
        } else {
            // Animate particles hitting the screen influenced by "Gravity"
            const positions = this.particles.geometry.attributes.position;
            const gravityEffect = this.godMode.gravity / 9.8;

            for (let i = 0; i < positions.count; i++) {
                const z = positions.getZ(i);
                const y = positions.getY(i);

                if (z < -10) {
                    positions.setZ(i, 5); // Reset
                    positions.setY(i, (Math.random() - 0.5) * 5); // Randomize Y on reset
                } else {
                    positions.setZ(i, z - 0.2 * this.godMode.timeScale);
                    // Apply small downward pull based on gravity
                    positions.setY(i, y - 0.01 * gravityEffect * this.godMode.timeScale);
                }
            }
            positions.needsUpdate = true;
        }
    }
}
