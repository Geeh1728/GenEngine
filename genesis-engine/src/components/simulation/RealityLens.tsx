'use client';

import React, { useState, useRef } from 'react';
import { Camera, Scan, Box, ArrowRight, X } from 'lucide-react';
import { analyzeReality } from '@/app/actions/vision';
import { parseBoundingBoxes2D } from '@/lib/gemini/spatialParser';
import { Entity } from '@/lib/simulation/schema';

interface RealityLensProps {
    onTeleport: (newEntities: Entity[], newJoints?: any[]) => void;
    onClose: () => void;
}

export function RealityLens({ onTeleport, onClose }: RealityLensProps) {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [visionData, setVisionData] = useState<any[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const base64 = event.target?.result as string;
            setImageSrc(base64);
            await scanImage(base64);
        };
        reader.readAsDataURL(file);
    };

    const scanImage = async (base64: string) => {
        setIsAnalyzing(true);
        setVisionData([]);
        
        // Use Server Action (Gemini 2.5 Flash)
        const result = await analyzeReality(base64, false); // Free Tier
        
        setIsAnalyzing(false);
        if (result.success && result.data) {
            // Normalize coordinates using the Google Logic
            const boxes = parseBoundingBoxes2D(result.data as any[]);
            setVisionData(boxes);
        } else {
            alert('Vision Analysis Failed: ' + result.error);
        }
    };

    const handleTeleportClick = () => {
        if (visionData.length === 0) return;

        // Convert Vision Data to Physics Entities
        const newEntities: Entity[] = visionData.map((box, index) => ({
            id: `reality-${index}-${Date.now()}`,
            shape: box.label.toLowerCase().includes('ball') ? 'sphere' : 'cube',
            position: { x: (box.x - 0.5) * 20, y: (0.5 - box.y) * 20, z: 0 },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
            dimensions: { x: box.width * 10, y: box.height * 10, z: 1 },
            visual: {
                color: '#22d3ee',
            },
            physics: {
                mass: 1,
                restitution: 0.5,
                friction: 0.5,
                isStatic: false
            },
            certainty: 0.8,
            name: box.label
        }));

        onTeleport(newEntities, []);
    };

    return (
        <div className="absolute top-4 right-4 z-50 w-80 bg-gray-900/90 backdrop-blur-xl border border-gray-800 rounded-xl overflow-hidden shadow-2xl flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                    <Scan size={16} /> REALITY LENS
                </h3>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
                    >
                        <Camera size={16} />
                    </button>
                    <button 
                        onClick={onClose}
                        className="p-2 bg-gray-800 hover:bg-red-900/40 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
                <input 
                    ref={fileInputRef} 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileChange} 
                />
            </div>

            {/* Viewport */}
            <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                {imageSrc ? (
                    <>
                        <img src={imageSrc} alt="Reality Scan" className="w-full h-full object-contain opacity-50" />
                        
                        {/* Scanning Overlay */}
                        {isAnalyzing && (
                            <div className="absolute inset-0 bg-cyan-500/10 animate-pulse flex items-center justify-center">
                                <Scan size={48} className="text-cyan-400 animate-spin-slow" />
                            </div>
                        )}

                        {/* Bounding Boxes */}
                        {visionData.map((box, i) => (
                            <div
                                key={i}
                                className="absolute border-2 border-cyan-400 bg-cyan-400/20 hover:bg-cyan-400/40 transition-colors cursor-pointer group"
                                style={{
                                    left: `${box.x * 100}%`,
                                    top: `${box.y * 100}%`,
                                    width: `${box.width * 100}%`,
                                    height: `${box.height * 100}%`
                                }}
                            >
                                <span className="absolute -top-6 left-0 bg-cyan-500 text-black text-[10px] font-bold px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    {box.label}
                                </span>
                            </div>
                        ))}
                    </>
                ) : (
                    <div className="text-gray-600 text-xs text-center p-8">
                        <Box className="mx-auto mb-2 opacity-20" size={32} />
                        UPLOAD IMAGE TO SCAN REALITY
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="p-4 bg-gray-950 border-t border-gray-800">
                <button
                    onClick={handleTeleportClick}
                    disabled={visionData.length === 0}
                    className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-800 disabled:text-gray-600 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(8,145,178,0.3)]"
                >
                    TELEPORT TO HOLODECK <ArrowRight size={16} />
                </button>
                <p className="text-[10px] text-gray-500 text-center mt-2">
                    {visionData.length} OBJECTS DETECTED
                </p>
            </div>
        </div>
    );
}

export default RealityLens;
