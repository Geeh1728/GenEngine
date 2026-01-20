import * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';

export class SimulationRenderer {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public renderer: any; // Using any due to union of WebGL and experimental WebGPU renderers
    public scene: THREE.Scene;
    public camera: THREE.PerspectiveCamera;

    constructor(container: HTMLElement) {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            75,
            container.clientWidth / container.clientHeight,
            0.1,
            1000
        );
        this.camera.position.z = 5;

        try {
            this.renderer = new WebGPURenderer({ antialias: true });
        } catch {
            console.warn('WebGPU not supported, falling back to WebGL');
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
        }

        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(this.renderer.domElement);

        this.onResize = this.onResize.bind(this);
        window.addEventListener('resize', this.onResize);
    }

    private onResize() {
        const container = this.renderer.domElement.parentElement;
        if (!container) return;
        this.camera.aspect = container.clientWidth / container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(container.clientWidth, container.clientHeight);
    }

    public render() {
        this.renderer.render(this.scene, this.camera);
    }

    public dispose() {
        window.removeEventListener('resize', this.onResize);
        this.renderer.dispose();
    }
}
