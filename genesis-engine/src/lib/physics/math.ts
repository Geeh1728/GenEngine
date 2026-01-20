/**
 * Runge-Kutta 4 Integration Method
 * Essential for "Scientific Accuracy" in Module K (Lab Bench).
 */

export type State = number[];
export type DerivativeFunction = (t: number, y: State) => State;

/**
 * Performs a single step of RK4 integration.
 * @param t Current time
 * @param y Current state vector
 * @param dt Time step
 * @param f Derivative function dy/dt = f(t, y)
 * @returns Next state vector
 */
export function rungeKutta4(t: number, y: State, dt: number, f: DerivativeFunction): State {
    const k1 = f(t, y);
    const k2 = f(t + dt / 2, addStates(y, scaleState(k1, dt / 2)));
    const k3 = f(t + dt / 2, addStates(y, scaleState(k2, dt / 2)));
    const k4 = f(t + dt, addStates(y, scaleState(k3, dt)));

    return y.map((yi, i) => yi + (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]) * dt / 6);
}

// Helper functions for vector arithmetic on State arrays
function addStates(a: State, b: State): State {
    return a.map((val, i) => val + b[i]);
}

function scaleState(a: State, s: number): State {
    return a.map(val => val * s);
}

// Double Pendulum Equations of Motion (Lagrangian Dynamics)
// State: [theta1, theta2, omega1, omega2]
export const doublePendulumDerivatives = (lengths: [number, number], masses: [number, number], g: number) => 
    (_t: number, state: State): State => {
    const [theta1, theta2, omega1, omega2] = state;
    const [l1, l2] = lengths;
    const [m1, m2] = masses;

    const dTheta1 = omega1;
    const dTheta2 = omega2;

    const delta = theta1 - theta2;
    const den1 = (m1 + m2) * l1 - m2 * l1 * Math.cos(delta) * Math.cos(delta);
    const den2 = (l2 / l1) * den1;

    const dOmega1 = (m2 * l1 * omega1 * omega1 * Math.sin(delta) * Math.cos(delta) +
                     m2 * g * Math.sin(theta2) * Math.cos(delta) +
                     m2 * l2 * omega2 * omega2 * Math.sin(delta) -
                     (m1 + m2) * g * Math.sin(theta1)) / den1;

    const dOmega2 = (-m2 * l2 * omega2 * omega2 * Math.sin(delta) * Math.cos(delta) +
                     (m1 + m2) * g * Math.sin(theta1) * Math.cos(delta) -
                     (m1 + m2) * l1 * omega1 * omega1 * Math.sin(delta) -
                     (m1 + m2) * g * Math.sin(theta2)) / den2;

    return [dTheta1, dTheta2, dOmega1, dOmega2];
};

/**
 * Verlet Integration (Soft-body/Xenobots)
 */
export function verletStep(
    pos: { x: number; y: number },
    prevPos: { x: number; y: number },
    acc: { x: number; y: number },
    dt: number,
    friction: number = 0.99
) {
    const vx = (pos.x - prevPos.x) * friction;
    const vy = (pos.y - prevPos.y) * friction;

    return {
        x: pos.x + vx + acc.x * dt * dt,
        y: pos.y + vy + acc.y * dt * dt,
        prevX: pos.x,
        prevY: pos.y
    };
}

/**
 * Simplified Navier-Stokes (Pressure-Volume / Fluid Flow)
 * Calculated as a 1D pressure delta loop for the Heart simulation.
 */
export function calculatePressureDelta(
    volume: number,
    prevVolume: number,
    compliance: number,
    resistance: number,
    dt: number
) {
    const flow = (volume - prevVolume) / dt;
    const pressure = volume / compliance; // P = V/C
    const pressureLoss = flow * resistance; // deltaP = Q * R
    return pressure - pressureLoss;
}

/**
 * Tribology (Friction Science)
 * Calculates static/kinetic friction breakpoints.
 */
export function calculateFrictionForce(
    normalForce: number,
    velocity: number,
    muStatic: number,
    muKinetic: number,
    stribeckVelocity: number = 0.1
) {
    // Stribeck Curve approximation
    const mu = muKinetic + (muStatic - muKinetic) * Math.exp(-Math.abs(velocity) / stribeckVelocity);
    return normalForce * mu;
}

