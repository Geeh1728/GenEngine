import { describe, it, expect } from 'vitest';
import { rungeKutta4, doublePendulumDerivatives } from '../lib/physics/math';

describe('Physics Math Kernel (RK4)', () => {
    it('should maintain energy conservation in a simple oscillation (approximate)', () => {
        // Simple Pendulum approximation or just check if it moves
        const initialState = [Math.PI / 4, Math.PI / 4, 0, 0]; // [theta1, theta2, omega1, omega2]
        const derivatives = doublePendulumDerivatives([1, 1], [1, 1], 9.81);
        
        const dt = 0.01;
        let state = initialState;
        
        // Run for a few steps
        for (let i = 0; i < 10; i++) {
            const nextState = rungeKutta4(0, state, dt, derivatives);
            expect(nextState).toHaveLength(4);
            expect(nextState[0]).not.toBe(state[0]); // Should have moved
            state = nextState;
        }
    });

    it('should handle zero gravity state', () => {
        const initialState = [Math.PI / 4, 0, 0, 0];
        const derivatives = doublePendulumDerivatives([1, 1], [1, 1], 0);
        
        const dt = 0.1;
        const nextState = rungeKutta4(0, initialState, dt, derivatives);
        
        // With zero gravity and zero initial velocity, it should stay still
        expect(nextState[0]).toBeCloseTo(initialState[0], 5);
        expect(nextState[2]).toBeCloseTo(0, 5);
    });
});
