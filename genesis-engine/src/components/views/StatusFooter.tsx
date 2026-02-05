'use client';

import React, { useEffect, useState } from 'react';
import { p2p } from '@/lib/multiplayer/P2PConnector';
import { getApiUsage } from '@/lib/db/pglite';
import { MODELS, LEGACY_MODELS } from '@/lib/genkit/models';

interface StatusFooterProps {
    overridesCount: number;
    complexity: string;
}

export const StatusFooter: React.FC<StatusFooterProps> = ({ overridesCount, complexity }) => {
    const [peerCount, setPeerCount] = useState(0);
    const [tier1Usage, setTier1Usage] = useState(0);
    const [embeddingUsage, setEmbeddingUsage] = useState(0);

    useEffect(() => {
        // Subscribe to P2P peer changes and store unsubscribe function
        const unsubscribe = p2p.onPeerChange((count: number) => {
            setPeerCount(count);
        });

        // Periodic Quota Sync
        const updateQuotas = async () => {
            const t1 = await getApiUsage(LEGACY_MODELS.BRAIN_PRIMARY);
            const emb = await getApiUsage(MODELS.EMBEDDING_MODEL);
            setTier1Usage(t1);
            setEmbeddingUsage(emb);
        };

        updateQuotas();
        const interval = setInterval(updateQuotas, 30000); // Every 30s
        
        return () => { 
            unsubscribe();
            clearInterval(interval);
        };
    }, []);

    const t1Percent = Math.min((tier1Usage / 20) * 100, 100);
    const embPercent = Math.min((embeddingUsage / 1000) * 100, 100);

    return (
        <footer className="fixed bottom-0 left-0 right-0 px-4 md:px-12 py-3 md:py-4 flex justify-between items-center text-[7px] md:text-[8px] uppercase tracking-[0.3em] md:tracking-[0.5em] text-gray-700 font-bold border-t border-white/5 bg-[#020205]/95 backdrop-blur-xl z-[100]">
            <div className="flex gap-4 md:gap-8 items-center">
                <span>Genesis <span className="hidden md:inline">Engine</span> {'//'} v7.5</span>
                
                {/* NEURAL CONNECTION GAUGE */}
                <div className="hidden lg:flex items-center gap-6 border-l border-white/10 pl-6">
                    <div className="flex items-center gap-2">
                        <span className="text-blue-500">Brain</span>
                        <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                            <div 
                                className={`h-full transition-all duration-1000 ${t1Percent > 80 ? 'bg-red-500' : 'bg-blue-500'}`}
                                style={{ width: `${100 - t1Percent}%` }}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className={embPercent > 90 ? "text-amber-500" : "text-cyan-500"}>Memory</span>
                        <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                            <div 
                                className={`h-full transition-all duration-1000 ${embPercent > 90 ? 'bg-amber-500' : 'bg-cyan-500'}`}
                                style={{ width: `${100 - embPercent}%` }}
                            />
                        </div>
                        <span className="opacity-50">{embeddingUsage}/1K</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-emerald-500">Local</span>
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                    </div>
                </div>
            </div>

            <div className="flex gap-4 md:gap-12 items-center">
                {peerCount > 0 && (
                    <span className="text-green-400 animate-pulse">
                        Mesh: {peerCount} <span className="hidden md:inline">Peers</span>
                    </span>
                )}
                <span className={overridesCount > 0 ? "text-red-500 animate-pulse" : ""}>
                    Rules: {overridesCount}
                </span>
                <span className="hidden md:inline text-blue-900">Quantum Link: Stable</span>
            </div>
        </footer>
    );
};
