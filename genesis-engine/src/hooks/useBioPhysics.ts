'use client';

import { useState, useRef, useLayoutEffect } from 'react';
import { verletStep } from '@/lib/physics/math';

interface Point {
    x: number;
    y: number;
    prevX: number;
    prevY: number;
    isFixed?: boolean;
}

interface Spring {
    a: number;
    b: number;
    length: number;
    stiffness: number;
}

export function useBioPhysics(initialPoints: Point[], initialSprings: Spring[]) {
    const [points, setPoints] = useState<Point[]>(initialPoints);
    const pointsRef = useRef<Point[]>(initialPoints);
    const springsRef = useRef<Spring[]>(initialSprings);
    const requestRef = useRef<number>(null);

    const update = () => {
        const dt = 0.016; // Fixed timestep for stability
        const gravity = { x: 0, y: 0.1 };
        const friction = 0.99;

        // 1. Verlet Step
        pointsRef.current = pointsRef.current.map(p => {
            if (p.isFixed) return p;
            const next = verletStep({ x: p.x, y: p.y }, { x: p.prevX, y: p.prevY }, gravity, dt, friction);
            return {
                ...p,
                x: next.x,
                y: next.y,
                prevX: next.prevX,
                prevY: next.prevY
            };
        });

        // 2. Satisfy Constraints (Springs)
        for (let i = 0; i < 5; i++) { // Iterative solver
            springsRef.current.forEach(s => {
                const pA = pointsRef.current[s.a];
                const pB = pointsRef.current[s.b];

                const dx = pB.x - pA.x;
                const dy = pB.y - pA.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const difference = s.length - distance;
                const percent = (difference / distance) / 2 * s.stiffness;
                const offsetX = dx * percent;
                const offsetY = dy * percent;

                if (!pA.isFixed) {
                    pA.x -= offsetX;
                    pA.y -= offsetY;
                }
                if (!pB.isFixed) {
                    pB.x += offsetX;
                    pB.y += offsetY;
                }
            });
        }

        setPoints([...pointsRef.current]);
        requestRef.current = requestAnimationFrame(update);
    };

    useLayoutEffect(() => {
        requestRef.current = requestAnimationFrame(update);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return { points, setPoints };
}
