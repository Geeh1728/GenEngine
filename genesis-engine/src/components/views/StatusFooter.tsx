'use client';

import React, { useEffect, useState } from 'react';
import { p2p } from '@/lib/multiplayer/P2PConnector';

interface StatusFooterProps {
    overridesCount: number;
    complexity: string;
}

export const StatusFooter: React.FC<StatusFooterProps> = ({ overridesCount, complexity }) => {
    const [peerCount, setPeerCount] = useState(0);

    useEffect(() => {
        // Subscribe to P2P peer changes and store unsubscribe function
        const unsubscribe = p2p.onPeerChange((count) => {
            setPeerCount(count);
        });
        
        return () => { unsubscribe(); };
    }, []);

    return (
        <footer className="fixed bottom-0 left-0 right-0 px-4 md:px-12 py-3 md:py-4 flex justify-between items-center text-[7px] md:text-[8px] uppercase tracking-[0.3em] md:tracking-[0.5em] text-gray-700 font-bold border-t border-white/5 bg-[#020205]/95 backdrop-blur-xl z-[100]">
            <div className="flex gap-4 md:gap-12">
                <span>Genesis <span className="hidden md:inline">Engine</span> {'//'} INTERVENTION <span className="hidden md:inline">MODE</span></span>
                {peerCount > 0 ? (
                    <span className="text-green-400 animate-pulse">
                        Mesh Active: {peerCount} <span className="hidden md:inline">Peer{peerCount > 1 ? 's' : ''}</span>
                    </span>
                ) : (
                    <span className="text-gray-600 hidden md:inline">Solo <span className="hidden md:inline">Mode</span></span>
                )}
            </div>
            <div className="flex gap-4 md:gap-12">
                <span className={overridesCount > 0 ? "text-red-500 animate-pulse" : ""}>
                    Rules <span className="hidden md:inline">Overridden</span>: {overridesCount}
                </span>
                <span className="hidden md:inline">Holographic Feed: {complexity.toUpperCase()}</span>
                <span className="hidden md:inline text-blue-900">Quantum Link: Stable</span>
            </div>
        </footer>
    );
};
