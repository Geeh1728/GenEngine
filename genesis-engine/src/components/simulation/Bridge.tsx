'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { compileHypothesis, getEmbedding } from '@/app/actions';
import { queryKnowledge } from '@/lib/db/pglite';
import { useGenesisEngine } from '@/hooks/useGenesisEngine';

export const Bridge: React.FC = () => {
    const [hypothesis, setHypothesis] = useState('');
    const [isCompiling, setIsCompiling] = useState(false);
    const { setWorldState, setError, fileUri } = useGenesisEngine();

    const handleCompile = async () => {
        if (!hypothesis.trim()) return;

        setIsCompiling(true);
        setError(null);

        try {
            // 1. Get Embedding for search
            const embResult = await getEmbedding(hypothesis);
            if (!embResult.success) {
                throw new Error(embResult.error || 'Failed to generate embedding');
            }

            const embedding = embResult.embedding;

            // 2. Query Local PGLite for context
            const contextResults = await queryKnowledge(embedding);
            const context = contextResults.map((r) => (r as { content: string }).content).join('\n---\n');

            // 3. Compile Hypothesis via Gemini
            const result = await compileHypothesis(hypothesis, context, fileUri || undefined);

            if (result.success) {
                if ('worldState' in result && result.worldState) {
                    setWorldState(result.worldState as any);
                } else if ('mutation' in result && result.mutation) {
                    // For now, components like Bridge that expect a full world state 
                    // will just ignore mutations or we could handle them via dispatch
                    // since setWorldState is an alias for syncing the full world.
                }
                setHypothesis(''); // Clear input on success
            } else {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                throw new Error((result as any).error || 'Failed to compile reality');
            }
        } catch (err) {
            console.error('Bridge Error:', err);
            setError(err instanceof Error ? err.message : 'Calibration failed');
        } finally {
            setIsCompiling(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto mt-12 p-6 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            <div className="relative z-10 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-blue-400/70">
                        Kinetic Core // Hypothesis Input
                    </h3>
                    <div className="flex gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${isCompiling ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                        <span className="text-[10px] uppercase tracking-widest text-gray-500">
                            {isCompiling ? 'Compiling Reality...' : 'Ready for Input'}
                        </span>
                    </div>
                </div>

                <div className="relative">
                    <textarea
                        value={hypothesis}
                        onChange={(e) => setHypothesis(e.target.value)}
                        placeholder="e.g., 'A 50kg sphere falls from 10m onto a bouncy trampoline'..."
                        disabled={isCompiling}
                        className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 transition-all resize-none"
                    />
                    <div className="absolute bottom-3 right-3 text-[10px] text-gray-600 uppercase tracking-widest">
                        R0 Local-First Link
                    </div>
                </div>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCompile}
                    disabled={isCompiling || !hypothesis.trim()}
                    className={`h-12 rounded-xl text-xs font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3
                        ${isCompiling
                            ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)]'
                        }`}
                >
                    {isCompiling ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Synchronizing...
                        </>
                    ) : (
                        <>
                            Compile Reality
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </>
                    )}
                </motion.button>
            </div>
        </div>
    );
};
