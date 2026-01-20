'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Zap, Box, Trash2, X, ChevronRight, Ruler, Height, Info, Compass, AlertCircle, Wrench, Brain } from 'lucide-react';
import Image from 'next/image';
import { analyzeReality, analyzeStructuralIntegrity } from '@/app/actions/vision';
import { parseBoundingBoxes2D } from '@/lib/gemini/spatialParser';
import { Entity } from '@/lib/simulation/schema';

interface DetectedObject {
    box_2d: number[];
    label: string;
    estimatedMass?: number;
    material?: string;
    pixelWidth?: number;
}

interface StructuralElement {
    box_2d: number[];
    type: string;
    properties?: {
        material?: string;
        magnitude?: number;
    };
}

interface StructuralData {
    elements: StructuralElement[];
}

interface RealityLensProps {
    onTeleport: (newEntities: Entity[]) => void;
    onClose: () => void;
}

export default function RealityLens({ onTeleport, onClose }: RealityLensProps) {
    const [image, setImage] = useState<string | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
    const [selectedObjects, setSelectedObjects] = useState<Set<number>>(new Set());
    
    // --- STRUCTURAL ANALYSIS STATE ---
    const [structuralAnalysis, setStructuralAnalysis] = useState<{
        weakPoints: { x: number, y: number, reason: string }[],
        suggestions: string[],
        analysis: string
    } | null>(null);
    const [analyzingStructure, setAnalyzingStructure] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleStructuralAnalysis = async () => {
        if (!image) return;
        setAnalyzingStructure(true);
        try {
            const result = await analyzeStructuralIntegrity(image);
            if (result.success && result.data) {
                setStructuralAnalysis(result.data);
            }
        } catch (err) {
            console.error('Structural analysis failed:', err);
        } finally {
            setAnalyzingStructure(false);
        }
    };

    // --- MEASUREMENT STATE ---
    const [mode, setMode] = useState<'SCAN' | 'SURVEY' | 'RULER'>('SCAN');
    const [tilt, setTilt] = useState(0);
    const [distance, setDistance] = useState(5); // meters
    const [baseAngle, setBaseAngle] = useState<number | null>(null);
    const [topAngle, setTopAngle] = useState<number | null>(null);
    const [calculatedHeight, setCalculatedHeight] = useState<number | null>(null);
    const [referenceType, setReferenceType] = useState<'A4' | 'R10' | 'CARD'>('A4');
    
    const referenceWidths = { 'A4': 210, 'R10': 140, 'CARD': 85.6 }; // mm

    // Track Device Tilt
    useEffect(() => {
        const handleOrientation = (e: DeviceOrientationEvent) => {
            if (e.beta !== null) setTilt(e.beta);
        };
        if (typeof window !== 'undefined') {
            window.addEventListener('deviceorientation', handleOrientation);
        }
        return () => window.removeEventListener('deviceorientation', handleOrientation);
    }, []);

    const captureAngle = (type: 'BASE' | 'TOP') => {
        if (type === 'BASE') {
            setBaseAngle(tilt);
            setCalculatedHeight(null);
        } else {
            setTopAngle(tilt);
            if (baseAngle !== null) {
                const rad = (deg: number) => (deg * Math.PI) / 180;
                const h = distance * (Math.tan(rad(tilt)) - Math.tan(rad(baseAngle)));
                setCalculatedHeight(Math.abs(h));
            }
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setImage(event.target?.result as string);
                setDetectedObjects([]);
                setSelectedObjects(new Set());
            };
            reader.readAsDataURL(file);
        }
    };

    const handleScan = async () => {
        if (!image) return;
        setAnalyzing(true);
        try {
            const result = await analyzeReality(image);
            if (result.success && result.data) {
                const data = result.data as unknown as StructuralData | DetectedObject[];
                
                if ('elements' in data && Array.isArray(data.elements)) {
                     const objects = data.elements.map((el) => {
                        const width = Math.abs(el.box_2d[3] - el.box_2d[1]);
                        return {
                            box_2d: el.box_2d,
                            label: el.type,
                            material: el.properties?.material,
                            estimatedMass: el.properties?.magnitude,
                            pixelWidth: width
                        };
                     });
                    setDetectedObjects(objects);
                } else if (Array.isArray(data)) {
                    setDetectedObjects(data);
                }
            }
        } catch (err) {
            console.error('Error during scan:', err);
        } finally {
            setAnalyzing(false);
        }
    };

    const toggleObjectSelection = (index: number) => {
        const newSelection = new Set(selectedObjects);
        if (newSelection.has(index)) newSelection.delete(index);
        else newSelection.add(index);
        setSelectedObjects(newSelection);
    };

    const handleTeleportClick = () => {
        const boxes = parseBoundingBoxes2D(detectedObjects);
        const selectedBoxes = boxes.filter((_, i) => selectedObjects.has(i));

        let scaleFactor = 1;
        if (mode === 'RULER') {
            const refObj = detectedObjects.find(obj => 
                obj.label.toLowerCase().includes('paper') || 
                obj.label.toLowerCase().includes('note') || 
                obj.label.toLowerCase().includes('card')
            );
            if (refObj && refObj.pixelWidth) {
                scaleFactor = (referenceWidths[referenceType] / 1000) / (refObj.pixelWidth / 1000);
            }
        }

        const newEntities: Entity[] = selectedBoxes.map((box, index) => {
            const rawObj = detectedObjects.find((_, i) => boxes[i] === box);
            const realWidth = rawObj?.pixelWidth ? (rawObj.pixelWidth / 1000) * scaleFactor * 10 : box.width * 10;

            return {
                id: `reality-${Date.now()}-${index}`,
                type: box.label.toLowerCase().includes("ball") || box.label.toLowerCase().includes("sphere") ? "sphere" : "box",
                name: box.label,
                position: {
                    x: (box.x + box.width / 2 - 0.5) * 20,
                    y: (1 - (box.y + box.height / 2)) * 10,
                    z: 0
                },
                dimensions: {
                    x: realWidth,
                    y: box.height * 10,
                    z: 1
                },
                physics: {
                    mass: rawObj?.estimatedMass || 1,
                    friction: 0.5,
                    restitution: 0.2,
                },
                color: `hsl(${Math.random() * 360}, 70%, 50%)`,
                isStatic: false,
                rotation: { x: 0, y: 0, z: 0 },
            };
        });

        onTeleport(newEntities);
        onClose();
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-lg p-4"
        >
            <div className="relative w-full max-w-4xl bg-gray-900/50 rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 flex items-center justify-between border-b border-white/10 bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/20 rounded-lg">
                            <Zap className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight">Reality Lens</h2>
                            <div className="flex gap-2 mt-1">
                                <button onClick={() => setMode('SCAN')} className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest transition-all ${mode === 'SCAN' ? 'bg-indigo-500 text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}>Scan</button>
                                <button onClick={() => setMode('SURVEY')} className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest transition-all ${mode === 'SURVEY' ? 'bg-indigo-500 text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}>Surveyor</button>
                                <button onClick={() => setMode('RULER')} className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest transition-all ${mode === 'RULER' ? 'bg-indigo-500 text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}>Ruler</button>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-6 h-6 text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 relative overflow-auto p-4 flex items-center justify-center min-h-[400px]">
                    {mode === 'SURVEY' ? (
                        <div className="text-center space-y-8 w-full max-w-md p-6">
                            <div className="relative w-48 h-48 mx-auto border-4 border-white/10 rounded-full flex items-center justify-center bg-black/20 shadow-inner">
                                <motion.div 
                                    animate={{ rotate: -tilt }}
                                    className="w-full h-0.5 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)]"
                                />
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-4xl font-black text-white font-mono">{Math.round(tilt)}°</span>
                                    <span className="text-[10px] text-indigo-400 font-bold uppercase">Tilt Angle</span>
                                </div>
                                <Compass className="absolute top-2 w-4 h-4 text-indigo-500/50" />
                            </div>

                            <div className="space-y-6">
                                <div className="flex flex-col gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <div className="flex justify-between text-[10px] text-gray-400 uppercase font-bold">
                                        <span>Distance to Object</span>
                                        <span className="text-white">{distance}m</span>
                                    </div>
                                    <input 
                                        type="range" min="1" max="20" step="0.5" value={distance} 
                                        onChange={(e) => setDistance(parseFloat(e.target.value))}
                                        className="w-full accent-indigo-500 h-1.5 bg-indigo-950 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <button 
                                        onClick={() => captureAngle('BASE')}
                                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${baseAngle !== null ? 'border-green-500 bg-green-500/10 text-green-400' : 'border-white/10 text-white hover:bg-white/5'}`}
                                    >
                                        <span className="text-xs font-bold uppercase">Capture Base</span>
                                        {baseAngle !== null && <span className="text-lg font-mono font-black">{Math.round(baseAngle)}°</span>}
                                    </button>
                                    <button 
                                        onClick={() => captureAngle('TOP')}
                                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${topAngle !== null ? 'border-green-500 bg-green-500/10 text-green-400' : 'border-white/10 text-white hover:bg-white/5'}`}
                                    >
                                        <span className="text-xs font-bold uppercase">Capture Top</span>
                                        {topAngle !== null && <span className="text-lg font-mono font-black">{Math.round(topAngle)}°</span>}
                                    </button>
                                </div>

                                <AnimatePresence>
                                    {calculatedHeight && (
                                        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="p-6 bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-500/20">
                                            <div className="text-[10px] uppercase font-black text-indigo-200 tracking-widest">Calculated Height</div>
                                            <div className="text-5xl font-black text-white">{calculatedHeight.toFixed(2)}<span className="text-xl ml-1">m</span></div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    ) : !image ? (
                        <div className="text-center p-12">
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => fileInputRef.current?.click()}
                                className="w-64 h-64 border-2 border-dashed border-white/20 rounded-3xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all group"
                            >
                                <div className="p-5 bg-white/5 rounded-2xl group-hover:bg-indigo-500/10 transition-colors">
                                    <Camera className="w-12 h-12 text-gray-400 group-hover:text-indigo-400" />
                                </div>
                                <div className="text-center">
                                    <p className="text-white font-medium">Upload Reality Photo</p>
                                    <p className="text-xs text-gray-400 mt-1">{mode === 'RULER' ? 'Place an A4 paper/R10 note next to object' : 'Scan objects for the Holodeck'}</p>
                                </div>
                            </motion.div>
                            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                        </div>
                    ) : (
                        <div className="relative w-full max-w-full inline-block group">
                            <Image src={image} alt="Reality" width={1000} height={1000} className="w-full h-auto rounded-xl shadow-lg border border-white/10" unoptimized />
                            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                                {analyzing || analyzingStructure ? (
                                    <motion.rect initial={{ y: 0 }} animate={{ y: [0, 100, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-full h-[2px] fill-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)]" style={{ y: '0%' }} />
                                ) : (
                                    <>
                                        {/* Detected Objects (normalized 0-1) */}
                                        {parseBoundingBoxes2D(detectedObjects).map((box, i) => (
                                            <g key={i} className="pointer-events-auto cursor-pointer" onClick={() => toggleObjectSelection(i)}>
                                                <rect x={box.x * 100} y={box.y * 100} width={box.width * 100} height={box.height * 100} className={`transition-colors duration-200 fill-transparent stroke-2 ${selectedObjects.has(i) ? 'stroke-green-400 fill-green-400/20' : 'stroke-indigo-400 hover:stroke-indigo-300'}`} vectorEffect="non-scaling-stroke" />
                                            </g>
                                        ))}

                                        {/* Structural Weak Points (normalized 0-100) */}
                                        {structuralAnalysis?.weakPoints.map((pt, i) => (
                                            <g key={`weak-${i}`}>
                                                <motion.circle 
                                                    initial={{ r: 0, opacity: 0 }}
                                                    animate={{ r: [2, 4, 2], opacity: [0.6, 1, 0.6] }}
                                                    transition={{ repeat: Infinity, duration: 2 }}
                                                    cx={pt.x} 
                                                    cy={pt.y} 
                                                    className="fill-red-500/30 stroke-red-500 stroke-[0.5]"
                                                />
                                                <foreignObject x={pt.x} y={pt.y} width="20" height="10">
                                                    <div className="bg-red-500 text-[4px] text-white px-1 rounded-sm whitespace-nowrap overflow-hidden text-ellipsis shadow-lg border border-red-400">
                                                        {pt.reason}
                                                    </div>
                                                </foreignObject>
                                            </g>
                                        ))}
                                    </>
                                )}
                            </svg>

                            {/* Suggestions Overlay */}
                            <AnimatePresence>
                                {structuralAnalysis && (
                                    <motion.div 
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="absolute top-4 right-4 w-64 bg-black/80 backdrop-blur-md border border-red-500/20 rounded-2xl p-4 pointer-events-auto"
                                    >
                                        <div className="flex items-center gap-2 mb-3">
                                            <AlertCircle className="w-4 h-4 text-red-400" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-red-400">Structural Vulnerabilities</span>
                                        </div>
                                        <div className="space-y-2">
                                            {structuralAnalysis.suggestions.map((s, i) => (
                                                <div key={i} className="flex gap-2 items-start">
                                                    <Wrench className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
                                                    <p className="text-[10px] text-slate-300 leading-relaxed">{s}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-white/5">
                                            <p className="text-[8px] text-slate-500 italic leading-tight">
                                                "{structuralAnalysis.analysis.substring(0, 100)}..."
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-white/5 border-t border-white/10 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        {image && mode !== 'SURVEY' && (
                            <button onClick={() => { setImage(null); setStructuralAnalysis(null); }} className="px-4 py-2 flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-colors">
                                <Trash2 className="w-4 h-4" /> Clear
                            </button>
                        )}
                        {image && (
                            <button 
                                onClick={handleStructuralAnalysis} 
                                disabled={analyzingStructure}
                                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${structuralAnalysis ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20'}`}
                            >
                                <Brain className={`w-4 h-4 ${analyzingStructure ? 'animate-pulse' : ''}`} />
                                {analyzingStructure ? 'Thinking...' : structuralAnalysis ? 'Re-Analyze' : 'Visual Cortex Reasoning'}
                            </button>
                        )}
                        {mode === 'RULER' && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-black/30 rounded-xl border border-white/10">
                                <span className="text-[10px] text-gray-500 font-bold uppercase">Reference:</span>
                                <select 
                                    value={referenceType} 
                                    onChange={(e) => setReferenceType(e.target.value as any)}
                                    className="bg-transparent text-white text-[10px] font-bold outline-none cursor-pointer"
                                >
                                    <option value="A4">A4 Paper (210mm)</option>
                                    <option value="R10">R10 Note (140mm)</option>
                                    <option value="CARD">ID Card (85mm)</option>
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        {mode !== 'SURVEY' && image && !detectedObjects.length && (
                            <button onClick={handleScan} disabled={analyzing} className="px-6 py-3 bg-white text-black font-black rounded-xl flex items-center gap-2 hover:bg-gray-200 transition-all disabled:opacity-50">
                                {analyzing ? <><Zap className="w-4 h-4 animate-spin" /> Analyzing...</> : <><Zap className="w-4 h-4" /> Scan Reality</>}
                            </button>
                        )}

                        {detectedObjects.length > 0 && (
                            <button onClick={handleTeleportClick} disabled={selectedObjects.size === 0} className="px-8 py-3 bg-indigo-500 text-white font-black rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-500/25 hover:bg-indigo-600 transition-all disabled:opacity-50 disabled:grayscale">
                                <Box className="w-5 h-5" /> Teleport {selectedObjects.size > 0 ? `(${selectedObjects.size})` : ''} to Holodeck <ChevronRight className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}