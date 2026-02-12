import { useEffect } from 'react';
import { p2p } from '@/lib/multiplayer/P2PConnector';
import { blackboard } from '@/lib/genkit/context';

/**
 * MODULE Σ: ASTRA GLOBAL CONTEXT (v55.0)
 * Objective: Feed the P2P Swarm Intelligence into Astra's context.
 * Logic: Astra can now "feel" the rest of the world.
 */
export function useAstraGlobalContext() {
    useEffect(() => {
        // 1. Listen for Global Residue Absorption
        const handleResidue = (residue: any) => {
            blackboard.log('Swarm', `Collective Knowledge Absorbed: "${residue.scenario}" from the Ghost Mesh.`, 'SUCCESS');
            blackboard.update({
                researchFindings: (blackboard.getContext().researchFindings || '') + `
[SWARM PROOF]: ${residue.scenario} (${residue.outcome})`
            });
        };

        // 2. Listen for Peer Count Changes
        const handlePeers = (count: number) => {
            if (count > 0) {
                blackboard.update({
                    swarmTelemetry: {
                        ...blackboard.getContext().swarmTelemetry,
                        activePeers: count
                    } as any
                });
            }
        };

        const unsubResidue = p2p.onEvent('RESIDUE_ABSORBED', handleResidue);
        const unsubPeers = p2p.onPeerChange(handlePeers);

        return () => {
            unsubResidue();
            unsubPeers();
        };
    }, []);
}
