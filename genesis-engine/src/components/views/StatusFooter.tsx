'use client';

import React from 'react';

interface StatusFooterProps {
    overridesCount: number;
    complexity: string;
}

export const StatusFooter: React.FC<StatusFooterProps> = ({ overridesCount, complexity }) => {
    return (
        <footer className="fixed bottom-0 left-0 right-0 px-12 py-4 flex justify-between items-center text-[8px] uppercase tracking-[0.5em] text-gray-700 font-bold border-t border-white/5 bg-[#020205]/95 backdrop-blur-xl z-[100]">
            <span>Genesis Engine // INTERVENTION MODE</span>
            <div className="flex gap-12">
                <span className={overridesCount > 0 ? "text-red-500 animate-pulse" : ""}>
                    Rules Overridden: {overridesCount}
                </span>
                <span>Holographic Feed: {complexity.toUpperCase()}</span>
                <span className="text-blue-900">Quantum Link: Stable</span>
            </div>
        </footer>
    );
};
