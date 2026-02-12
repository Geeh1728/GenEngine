/**
 * SECOND ORDER DYNAMICS SOLVER (v26.0)
 * 
 * Objective: Procedural animation based on physical spring-damper systems.
 * Provides "overshoot", "settling time", and "anticipation" for motion.
 * 
 * Based on the algorithm popularized by t3ssel8r.
 */

export class SecondOrderDynamics {
    private xp: { x: number; y: number; z: number }; // Previous input position
    private y: { x: number; y: number; z: number };  // Current state position
    private yd: { x: number; y: number; z: number }; // Current state velocity

    private k1: number;
    private k2: number;
    private k3: number;

    /**
     * @param f Natural frequency (Hertz). Higher = faster response.
     * @param z Damping ratio. 0 = never settles, 0.5 = some overshoot, 1 = no overshoot.
     * @param r Initial response. <0 = anticipation, 0 = standard, >1 = high initial kick.
     * @param x0 Initial position.
     */
    constructor(f: number, z: number, r: number, x0: { x: number; y: number; z: number }) {
        // Initial coefficients
        this.k1 = z / (Math.PI * f);
        this.k2 = 1 / Math.pow(2 * Math.PI * f, 2);
        this.k3 = r * z / (2 * Math.PI * f);

        this.xp = { ...x0 };
        this.y = { ...x0 };
        this.yd = { x: 0, y: 0, z: 0 };
    }

    /**
     * Updates the simulation.
     * @param T Timestep (seconds).
     * @param x Target position.
     * @param xd Target velocity (optional, inferred from previous x if not provided).
     */
    public update(T: number, x: { x: number; y: number; z: number }, xd?: { x: number; y: number; z: number }): { x: number; y: number; z: number } {
        if (!xd) {
            xd = {
                x: (x.x - this.xp.x) / T,
                y: (x.y - this.xp.y) / T,
                z: (x.z - this.xp.z) / T
            };
            this.xp = { ...x };
        }

        // Stability check: prevent jitter at low frame rates
        const iterations = Math.ceil(T / 0.016); // Sub-stepping if T > 16ms
        const subT = T / iterations;

        for (let i = 0; i < iterations; i++) {
            this.y.x = this.y.x + subT * this.yd.x;
            this.y.y = this.y.y + subT * this.yd.y;
            this.y.z = this.y.z + subT * this.yd.z;

            this.yd.x = this.yd.x + subT * (x.x + this.k3 * xd.x - this.y.x - this.k1 * this.yd.x) / this.k2;
            this.yd.y = this.yd.y + subT * (x.y + this.k3 * xd.y - this.y.y - this.k1 * this.yd.y) / this.k2;
            this.yd.z = this.yd.z + subT * (x.z + this.k3 * xd.z - this.y.z - this.k1 * this.yd.z) / this.k2;
        }

        return { ...this.y };
    }

    /**
     * Phase-locking (v27.0): Influence this state towards another.
     * @param other The target dynamics to sync with.
     * @param alpha Influence strength (0-1).
     */
    public syncWith(other: SecondOrderDynamics, alpha: number) {
        this.y.x = this.y.x * (1 - alpha) + other.y.x * alpha;
        this.y.y = this.y.y * (1 - alpha) + other.y.y * alpha;
        this.y.z = this.y.z * (1 - alpha) + other.y.z * alpha;

        this.yd.x = this.yd.x * (1 - alpha) + other.yd.x * alpha;
        this.yd.y = this.yd.y * (1 - alpha) + other.yd.y * alpha;
        this.yd.z = this.yd.z * (1 - alpha) + other.yd.z * alpha;
    }

    /**
     * Get the current velocity of the dynamics.
     */
    public getVelocity() {
        return { ...this.yd };
    }

    /**
     * Manually reset the state to a specific position.
     */
    public reset(x0: { x: number; y: number; z: number }) {
        this.xp = { ...x0 };
        this.y = { ...x0 };
        this.yd = { x: 0, y: 0, z: 0 };
    }
}
