import * as THREE from 'three';
import { BaseSimulation } from './types';

export class ChemistryLabSimulation implements BaseSimulation {
    private scene: THREE.Scene;
    private beaker: THREE.Mesh;
    private liquid: THREE.Mesh;
    private bubbles: THREE.Points;
    private godMode: { heat: number; kineticEnergy?: number } = { heat: 25, kineticEnergy: 1 };

    constructor(scene: THREE.Scene) {
        this.scene = scene;

        // Beaker Geometry
        const beakerGeom = new THREE.CylinderGeometry(2, 2, 5, 32, 1, true);
        const beakerMat = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transmission: 0.9,
            opacity: 0.3,
            transparent: true,
            roughness: 0,
        });
        this.beaker = new THREE.Mesh(beakerGeom, beakerMat);
        this.beaker.position.y = 2.5;
        this.scene.add(this.beaker);

        // Liquid Geometry
        const liquidGeom = new THREE.CylinderGeometry(1.9, 1.9, 3, 32);
        const liquidMat = new THREE.MeshStandardMaterial({
            color: 0x3b82f6,
            transparent: true,
            opacity: 0.6,
        });
        this.liquid = new THREE.Mesh(liquidGeom, liquidMat);
        this.liquid.position.y = 1.5;
        this.scene.add(this.liquid);

        // Boiling Bubbles
        const bubbleGeom = new THREE.BufferGeometry();
        const bubblePos = new Float32Array(300);
        for (let i = 0; i < 300; i += 3) {
            bubblePos[i] = (Math.random() - 0.5) * 3;
            bubblePos[i + 1] = Math.random() * 3;
            bubblePos[i + 2] = (Math.random() - 0.5) * 3;
        }
        bubbleGeom.setAttribute('position', new THREE.BufferAttribute(bubblePos, 3));
        const bubbleMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.05, transparent: true, opacity: 0 });
        this.bubbles = new THREE.Points(bubbleGeom, bubbleMat);
        this.scene.add(this.bubbles);
    }

    public update(time: number) {
        const temp = this.godMode.heat;
        const ke = this.godMode.kineticEnergy || 1;
        const boilingPoint = 78.37;

        // Animate Liquid based on heat
        const scale = 1 + Math.sin(time * (temp / 10)) * 0.02;
        this.liquid.scale.set(1, scale, 1);

        // Show bubbles if boiling - speed driven by KineticEnergy
        if (temp >= boilingPoint) {
            (this.bubbles.material as THREE.PointsMaterial).opacity = Math.min(1, (temp - boilingPoint) / 10);
            const positions = this.bubbles.geometry.attributes.position.array as Float32Array;
            for (let i = 1; i < positions.length; i += 3) {
                positions[i] += 0.05 * ke; // Driven by JSON KineticEnergy
                if (positions[i] > 3) positions[i] = 0;
            }
            this.bubbles.geometry.attributes.position.needsUpdate = true;
        } else {
            (this.bubbles.material as THREE.PointsMaterial).opacity = 0;
        }
    }

    public updateGodMode(config: Record<string, unknown>) {
        this.godMode = config as unknown as { heat: number; kineticEnergy?: number };
    }

    public dispose() {
        this.scene.remove(this.beaker);
        this.scene.remove(this.liquid);
        this.scene.remove(this.bubbles);
    }
}
