'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Activity, Cpu } from 'lucide-react';

/**
 * PerformanceMonitor: A technical HUD for monitoring system health.
 * Tracks FPS and Frame Latency to ensure optimized resource utilization.
 */
export const PerformanceMonitor: React.FC = () => {
    const [fps, setFps] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const frameCount = useRef(0);
    const lastTime = useRef(0);

    useEffect(() => {
        lastTime.current = performance.now();
        let animationFrameId: number;

        const loop = () => {
            frameCount.current++;
            const now = performance.now();
            
            if (now >= lastTime.current + 1000) {
                setFps(Math.round((frameCount.current * 1000) / (now - lastTime.current)));
                frameCount.current = 0;
                lastTime.current = now;
            }
            
            animationFrameId = requestAnimationFrame(loop);
        };

        animationFrameId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animationFrameId);
    }, []);

    // Toggle with Ctrl+Shift+P
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'P') {
                setIsVisible(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    if (!isVisible) return null;

    return (
        <div className="fixed top-24 right-10 z-[1000] bg-black/80 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-2xl pointer-events-none select-none">
            <div className="flex items-center gap-3 mb-3">
                <Activity className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">System Metrics</span>
            </div>
            
            <div className="space-y-2">
                <div className="flex justify-between gap-8">
                    <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Frame Rate</span>
                    <span className={`text-[10px] font-mono font-black ${fps > 55 ? 'text-emerald-400' : fps > 30 ? 'text-orange-400' : 'text-red-500'}`}>
                        {fps} FPS
                    </span>
                </div>
                <div className="flex justify-between gap-8">
                    <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Engine Mode</span>
                    <span className="text-[10px] font-mono font-black text-blue-400 uppercase">Titan v3.6</span>
                </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2">
                <Cpu className="w-2 h-2 text-blue-500" />
                <span className="text-[7px] text-gray-600 font-bold uppercase tracking-tighter italic">Optimization Protocol Active</span>
            </div>
        </div>
    );
};
