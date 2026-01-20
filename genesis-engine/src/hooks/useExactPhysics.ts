import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { rungeKutta4, doublePendulumDerivatives, State } from '@/lib/physics/math';

interface ExactPhysicsParams {
    l1: number;
    l2: number;
    m1: number;
    m2: number;
    g: number;
}

export const useExactPhysics = (
    initialState: State,
    params: ExactPhysicsParams,
    timeScale: number = 1.0
) => {
    // We use a ref for state to keep it out of the React render loop for performance
    const stateRef = useRef<State>(initialState);
    const timeRef = useRef<number>(0);

    const derivatives = useMemo(() => 
        doublePendulumDerivatives([params.l1, params.l2], [params.m1, params.m2], params.g),
        [params.l1, params.l2, params.m1, params.m2, params.g]
    );

    useFrame((_, delta) => {
        if (timeScale === 0) return;

        // Adaptive time-stepping to maintain stability
        // Sub-stepping: divide the frame delta into smaller chunks for RK4
        const subSteps = 5;
        const dt = (delta * timeScale) / subSteps;

        for (let i = 0; i < subSteps; i++) {
            stateRef.current = rungeKutta4(
                timeRef.current,
                stateRef.current,
                dt,
                derivatives
            );
            timeRef.current += dt;
        }
    });

    return stateRef;
};