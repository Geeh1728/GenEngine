'use client';

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Float, Stars, Environment } from '@react-three/drei';
import { motion } from 'framer-motion';
import { TreePine, X, RefreshCcw, Info } from 'lucide-react';
import { LSystemTree } from './LSystemTree';

interface MindGardenProps {
    nodes: Array<{ id: string; topic: string; health: number }>;
    onClose: () => void;
    onReview?: (topic: string) => void;
}

export const MindGarden: React.FC<MindGardenProps> = ({ nodes, onClose }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-xl"
        >
            <div className="relative w-full max-w-5xl h-[80vh] bg-[#05050a] rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl flex flex-col">
                {/* Header */}
                <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-center z-20 pointer-events-none">
                    <div className="pointer-events-auto">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                                <TreePine className="w-8 h-8 text-emerald-400" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-white tracking-tight">Mind Garden</h2>
                                <p className="text-emerald-500/60 uppercase text-[10px] font-black tracking-[0.3em]">Knowledge Retention Forest</p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="pointer-events-auto p-4 hover:bg-white/5 rounded-full transition-colors group"
                    >
                        <X className="w-8 h-8 text-white/40 group-hover:text-white transition-colors" />
                    </button>
                </div>

                {/* 3D Canvas */}
                <div className="flex-1 w-full bg-gradient-to-b from-[#0a0a15] to-[#05050a]">
                    <Canvas shadows>
                        <PerspectiveCamera makeDefault position={[0, 5, 12]} fov={50} />
                        <OrbitControls
                            enablePan={false}
                            minDistance={5}
                            maxDistance={20}
                            maxPolarAngle={Math.PI / 2}
                        />

                        <ambientLight intensity={0.5} />
                        <pointLight position={[10, 10, 10]} intensity={1.5} color="#4f46e5" />
                        <pointLight position={[-10, 5, -5]} intensity={1} color="#10b981" />

                        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                        <Environment preset="night" />

                        <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
                            <LSystemTree nodes={nodes} />
                        </Float>

                        <mesh rotation-x={-Math.PI / 2} position={[0, -0.1, 0]} receiveShadow>
                            <circleGeometry args={[10, 64]} />
                            <meshStandardMaterial color="#020205" opacity={0.5} transparent />
                        </mesh>
                    </Canvas>
                </div>

                {/* Info Panel / Stats */}
                <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end pointer-events-none">
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-3xl pointer-events-auto max-w-xs">
                        <div className="flex items-center gap-2 mb-4 text-emerald-400">
                            <Info className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Growth Log</span>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-white/40">Total Nodes</span>
                                <span className="text-lg font-bold text-white">{nodes.length}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-white/40">Garden Health</span>
                                <span className="text-lg font-bold text-emerald-400">
                                    {nodes.length > 0
                                        ? `${Math.round((nodes.reduce((acc, n) => acc + n.health, 0) / nodes.length) * 100)}%`
                                        : '0%'
                                    }
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pointer-events-auto">
                        <button className="px-8 py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-xl shadow-emerald-600/20 hover:bg-emerald-500 transition-all flex items-center gap-3">
                            <RefreshCcw className="w-5 h-5" />
                            Review Weak Branches
                        </button>
                    </div>
                </div>

                {/* Empty State */}
                {nodes.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                        <div className="text-center px-8">
                            <p className="text-white/20 text-sm font-medium uppercase tracking-[0.5em] mb-4">The soil is empty...</p>
                            <p className="text-white/40 max-w-xs">Ingest source material like PDFs to plant your first branch of knowledge.</p>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};
