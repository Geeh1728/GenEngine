import { decodeWorld, encodeWorld, generateNeuralFossil } from '../utils/wormhole';
import { WorldState } from '../simulation/schema';

/**
 * MODULE N: THE PERSISTENT NEURALMAP (Global Reality Registry)
 * Objective: A shared index of "Stabilized Realities".
 * Strategy: Map semantic keys (e.g., "IKEA_CHAIR") to validated physics fossils.
 */

interface RealityEntry {
    fossil: string;
    description: string;
    verifiedBy: string; // userId or 'SENTINEL'
    consensusScore: number;
    timestamp: number;
}

class NeuralMapRegistry {
    private static instance: NeuralMapRegistry;
    private registry: Map<string, RealityEntry> = new Map();

    private constructor() {
        // Initialize with core physics constants/primitives
        this.loadLocalCache();
    }

    public static getInstance(): NeuralMapRegistry {
        if (!NeuralMapRegistry.instance) {
            NeuralMapRegistry.instance = new NeuralMapRegistry();
        }
        return NeuralMapRegistry.instance;
    }

    /**
     * Look up a reality by semantic key (e.g., "Suspension Bridge").
     */
    public async lookup(key: string): Promise<WorldState | null> {
        const normalizedKey = key.toUpperCase().replace(/\s+/g, '_');
        const entry = this.registry.get(normalizedKey);
        
        if (entry) {
            console.log(`[NeuralMap] Cache Hit for: ${normalizedKey}. Fossil: ${entry.fossil}`);
            return decodeWorld(entry.fossil);
        }

        // Fallback: Query Global API (Placeholder for production)
        try {
            const response = await fetch(`/api/registry/lookup?key=${normalizedKey}`);
            if (response.ok) {
                const data = await response.json();
                if (data.fossil) {
                    this.registry.set(normalizedKey, data);
                    return decodeWorld(data.fossil);
                }
            }
        } catch (e) {
            console.warn("[NeuralMap] Registry lookup failed.");
        }

        return null;
    }

    /**
     * Register a new validated reality to the global map.
     */
    public async register(key: string, state: WorldState, userId: string = 'ANONYMOUS'): Promise<string> {
        const normalizedKey = key.toUpperCase().replace(/\s+/g, '_');
        const fossil = await encodeWorld(state);
        
        const entry: RealityEntry = {
            fossil,
            description: state.description,
            verifiedBy: userId,
            consensusScore: (state as any).consensus_score || 100,
            timestamp: Date.now()
        };

        this.registry.set(normalizedKey, entry);
        console.log(`[NeuralMap] Reality Registered: ${normalizedKey}`);

        // Sync to Global Registry (Placeholder)
        try {
            await fetch('/api/registry/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: normalizedKey, ...entry })
            });
        } catch (e) {
            console.warn("[NeuralMap] Failed to sync registry.");
        }

        return fossil;
    }

    /**
     * MODULE Σ: NEURALMAP SYNC (v35.0)
     * Returns all local registry entries for P2P broadcasting.
     */
    public getAllEntries(): Record<string, RealityEntry> {
        const entries: Record<string, RealityEntry> = {};
        this.registry.forEach((entry, key) => {
            entries[key] = entry;
        });
        return entries;
    }

    /**
     * Absorbs an entry from a peer.
     */
    public absorbEntry(key: string, entry: RealityEntry) {
        const normalizedKey = key.toUpperCase().replace(/\s+/g, '_');
        const local = this.registry.get(normalizedKey);
        
        // Only absorb if it's new or has a higher consensus score
        if (!local || entry.consensusScore > local.consensusScore) {
            console.log(`[NeuralMap] Absorbing peer reality: ${normalizedKey} (Consensus: ${entry.consensusScore}%)`);
            this.registry.set(normalizedKey, entry);
        }
    }

    private loadLocalCache() {
        // Mocked initial registry for common objects
        this.registry.set('GRAVITY_TEST_CUBE', {
            fossil: 'H4sIAAAAAAAAA...fossil',
            description: 'Standard 1kg test cube',
            verifiedBy: 'SENTINEL',
            consensusScore: 100,
            timestamp: 1700000000000
        });
    }
}

export const neuralMap = NeuralMapRegistry.getInstance();
