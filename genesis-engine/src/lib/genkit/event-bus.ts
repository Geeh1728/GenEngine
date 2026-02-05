import { EventEmitter } from 'events';

/**
 * MODULE X-ARC: THE HIVE SCALER (Local Eventarc)
 * Objective: Event-driven intelligence scaling based on system stress.
 */
class HiveEventBus extends EventEmitter {
    private static instance: HiveEventBus;
    private activeWorkers: number = 0;
    private MAX_WORKERS = 8;

    public static getInstance() {
        if (!HiveEventBus.instance) {
            HiveEventBus.instance = new HiveEventBus();
        }
        return HiveEventBus.instance;
    }

    public registerWorker() {
        if (this.activeWorkers < this.MAX_WORKERS) {
            this.activeWorkers++;
            return true;
        }
        return false;
    }

    public releaseWorker() {
        this.activeWorkers = Math.max(0, this.activeWorkers - 1);
    }

    public getWorkerCount() {
        return this.activeWorkers;
    }

    /**
     * Trigger a high-load event to scale the swarm.
     */
    public triggerHighLoad(type: 'PHYSICS_STRESS' | 'TEXTURE_SPIKE' | 'OCR_HEAVY') {
        console.log(`[Eventarc] High load detected: ${type}. Scaling Hive Swarm...`);
        this.emit('SCALE_UP', { type, currentWorkers: this.activeWorkers });
    }
}

export const hiveBus = HiveEventBus.getInstance();
