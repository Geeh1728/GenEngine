'use client';

import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface DataPoint {
  x: number;
  y: number;
}

interface LiveGraphProps {
  dataPoints: DataPoint[];
  targetPoints?: DataPoint[]; // Reference curve from PDF
  labels: { x: string, y: string };
  color?: string;
  minY?: number;
  maxY?: number;
  maxX?: number;
}

export default function LiveGraph({ 
  dataPoints, 
  targetPoints, 
  labels, 
  color = '#3b82f6',
  minY = 0,
  maxY = 100,
  maxX = 100
}: LiveGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;

    // Clear and set background
    ctx.clearRect(0, 0, width, height);
    
    // Draw Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
        const x = padding + (i / 5) * (width - padding * 2);
        const y = padding + (i / 5) * (height - padding * 2);
        
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, height - padding);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
    }

    // Draw Axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Mapping function
    const mapX = (x: number) => padding + (x / maxX) * (width - padding * 2);
    const mapY = (y: number) => height - padding - ((y - minY) / (maxY - minY)) * (height - padding * 2);

    // Draw Target Curve (Reference)
    if (targetPoints && targetPoints.length > 1) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(mapX(targetPoints[0].x), mapY(targetPoints[0].y));
        targetPoints.forEach(p => ctx.lineTo(mapX(p.x), mapY(p.y)));
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // Draw Live Curve
    if (dataPoints.length > 1) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        ctx.beginPath();
        ctx.moveTo(mapX(dataPoints[0].x), mapY(dataPoints[0].y));
        dataPoints.forEach(p => ctx.lineTo(mapX(p.x), mapY(p.y)));
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Draw Pulse at latest point
        const last = dataPoints[dataPoints.length - 1];
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(mapX(last.x), mapY(last.y), 4, 0, Math.PI * 2);
        ctx.fill();
    }

    // Labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(labels.x, width / 2, height - 10);
    
    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(labels.y, 0, 0);
    ctx.restore();

  }, [dataPoints, targetPoints, labels, color, minY, maxY, maxX]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-black/60 backdrop-blur-xl border border-white/10 p-4 rounded-3xl shadow-2xl"
    >
      <canvas 
        ref={canvasRef} 
        width={300} 
        height={200} 
        className="w-full h-auto"
      />
    </motion.div>
  );
}
