'use client';

import React, { useRef, useLayoutEffect } from 'react';
import { Html } from '@react-three/drei';
import { verletStep } from '@/lib/physics/math';

/**
 * UniversalCanvas: A high-performance 2D bridge for custom visualizations.
 * Supports both pre-defined types (XENOBOT) and dynamic JS tool synthesis.
 */
export function UniversalCanvas({ type, customCode }: { type?: string, customCode?: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const points = useRef<any[]>([]);
    const springs = useRef<any[]>([]);

    useLayoutEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;

        // --- OPTION A: Pre-defined Logic ---
        if (type === 'XENOBOT') {
            points.current = Array.from({ length: 8 }, (_, i) => ({
                x: 200 + Math.cos((i / 8) * Math.PI * 2) * 50,
                y: 200 + Math.sin((i / 8) * Math.PI * 2) * 50,
                prevX: 200 + Math.cos((i / 8) * Math.PI * 2) * 50,
                prevY: 200 + Math.sin((i / 8) * Math.PI * 2) * 50,
            }));
            springs.current = points.current.map((_, i) => ({
                a: i,
                b: (i + 1) % 8,
                length: 40,
                stiffness: 0.5
            }));

            const render = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                points.current.forEach(p => {
                    const next = verletStep({ x: p.x, y: p.y }, { x: p.prevX, y: p.prevY }, { x: 0, y: 0.1 }, 0.2, 0.99);
                    p.prevX = next.prevX; p.prevY = next.prevY; p.x = next.x; p.y = next.y;
                    if (p.y > canvas.height - 20) {
                        p.y = canvas.height - 20;
                        p.prevY = p.y + (p.y - p.prevY) * 0.5;
                    }
                });
                for (let j = 0; j < 5; j++) {
                    springs.current.forEach(s => {
                        const pA = points.current[s.a]; const pB = points.current[s.b];
                        const dx = pB.x - pA.x; const dy = pB.y - pA.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        const diff = s.length - dist;
                        const percent = (diff / dist) / 2 * s.stiffness;
                        pA.x -= dx * percent; pA.y -= dy * percent; pB.x += dx * percent; pB.y += dy * percent;
                    });
                }
                ctx.strokeStyle = '#00ff88'; ctx.lineWidth = 3; ctx.beginPath();
                springs.current.forEach(s => {
                    ctx.moveTo(points.current[s.a].x, points.current[s.a].y);
                    ctx.lineTo(points.current[s.b].x, points.current[s.b].y);
                });
                ctx.stroke();
                points.current.forEach(p => {
                    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill();
                });
                animationFrameId = requestAnimationFrame(render);
            };
            render();
        } 
        
        // --- SECURITY: Dynamic Tool Synthesis Disabled (Sandboxing required) ---
        // The previous implementation using new Function() has been removed due to XSS risk.
        // Future implementation should use WebWorkers.

        return () => cancelAnimationFrame(animationFrameId);
    }, [type, customCode]);

    return (
        <div className="relative bg-black/40 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
            <canvas 
                ref={canvasRef} 
                width={400} 
                height={400} 
                className="w-[300px] h-[300px]"
            />
            <div className="absolute top-4 left-4 flex flex-col">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                    {customCode ? 'Autonomous Tool' : 'Bio-Digital Feed'}
                </span>
                <span className="text-white text-sm font-bold uppercase">
                    {customCode ? 'DYNAMIC SYNTHESIS' : `${type} ENGINE`}
                </span>
            </div>
        </div>
    );
}
