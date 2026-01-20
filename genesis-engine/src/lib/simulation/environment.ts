import * as THREE from 'three';

export class DigitalVoid {
    private scene: THREE.Scene;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.setupEnvironment();
    }

    private setupEnvironment() {
        // Dark Void background
        this.scene.background = new THREE.Color(0x020205);

        // Ambient Light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);

        // Subtle Grid
        const gridHelper = new THREE.GridHelper(100, 100, 0x111122, 0x050510);
        gridHelper.position.y = -5;
        this.scene.add(gridHelper);

        // Floating "Data Particles" (Visual ambience)
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        for (let i = 0; i < 2000; i++) {
            vertices.push(
                THREE.MathUtils.randFloatSpread(100),
                THREE.MathUtils.randFloatSpread(100),
                THREE.MathUtils.randFloatSpread(100)
            );
        }
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        const material = new THREE.PointsMaterial({ color: 0x3b82f6, size: 0.1, transparent: true, opacity: 0.4 });
        const particles = new THREE.Points(geometry, material);
        this.scene.add(particles);
    }
}
