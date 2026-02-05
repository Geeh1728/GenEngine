'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface OmniCircleProps {
    onSelection: (coords: { x: number, y: number, width: number, height: number }) => void;
}

/**
 * THE OMNI-CIRCLE SELECTOR (Zero-UI Heist)
 * Objective: Lasso-based spatial selection for isolated reality compilation.
 */
export const OmniCircle: React.FC<OmniCircleProps> = ({ onSelection }) => {
    const [points, setPoints] = useState<{ x: number, y: number }[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handlePointerDown = (e: React.PointerEvent) => {
        setIsDrawing(true);
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
            setPoints([{ x: e.clientX - rect.left, y: e.clientY - rect.top }]);
        }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDrawing) return;
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
            setPoints(prev => [...prev, { x: e.clientX - rect.left, y: e.clientY - rect.top }]);
        }
    };

    const handlePointerUp = () => {
        setIsDrawing(false);
        if (points.length < 3) {
            setPoints([]);
            return;
        }

        // Calculate bounding box of the lasso
        const xs = points.map(p => p.x);
        const ys = points.map(p => p.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);

        onSelection({
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        });

        setPoints([]);
    };

    return (
        <div 
            ref={containerRef}
            className="absolute inset-0 z-50 cursor-crosshair touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
        >
            <svg className="w-full h-full pointer-events-none">
                {points.length > 1 && (
                    <motion.polyline
                        points={points.map(p => `${p.x},${p.y}`).join(' ')}
                        fill="rgba(99, 102, 241, 0.1)"
                        stroke="#6366f1"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    />
                )}
            </svg>

            {isDrawing && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-indigo-500 rounded-full flex items-center gap-2 shadow-2xl">
                    <Sparkles className="w-3 h-3 text-white animate-pulse" />
                    <span className="text-[8px] font-black uppercase text-white tracking-widest">Circle to Manifest</span>
                </div>
            )}
        </div>
    );
};
