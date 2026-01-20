import * as THREE from 'three';

export interface BaseSimulation {
    update(time: number): void;
    updateGodMode(config: Record<string, unknown>): void;
    dispose?(): void;
}

export interface SimulationModule {
    new(scene: THREE.Scene): BaseSimulation;
}
