import { getDB } from './pglite';
import { getEmbedding } from '@/app/actions';
import { p2p } from '../multiplayer/P2PConnector';

/**
 * MODULE Σ: COLLECTIVE RESIDUE (v45.0 Neural Hegemony)
 * Objective: Persist successful and failed physical patterns to improve future construction.
 * Collective: Shared across the Ghost Mesh via Residue Hashes.
 */

export interface ArchitecturalResidue {
    id: string;
    scenario: string;
    structuralData: string; // JSON string of entities/joints
    outcome: 'STABLE' | 'EXPLODED' | 'UNSTABLE';
    failureReason?: string;
    embedding?: number[];
    hash: string; // SHA-256 hash for P2P verification
    consensusScore: number; // v45.0: Scientific Consensus
    timestamp: number;
}

/**
 * Calculates a unique hash for structural data to enable 'Residue Exchange'.
 */
export async function calculateResidueHash(structuralData: string): Promise<string> {
    if (typeof window === 'undefined') return 'server-hash';
    const msgUint8 = new TextEncoder().encode(structuralData);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function storeResidue(residue: Omit<ArchitecturalResidue, 'id' | 'timestamp' | 'embedding' | 'hash'>) {
    const db = await getDB();
    if (!db) return;

    const id = crypto.randomUUID();
    const timestamp = Date.now();
    const hash = await calculateResidueHash(residue.structuralData);
    
    console.log(`[Hegemony] Storing physical residue: ${residue.scenario} (${residue.outcome}). Score: ${residue.consensusScore}%. Hash: ${hash.substring(0, 8)}`);
    
    // Generate embedding for semantic search (v31.0 Akashic Search)
    let embeddingStr: string | null = null;
    try {
        const embRes = await getEmbedding(residue.scenario);
        if (embRes.success) {
            embeddingStr = `[${embRes.embedding.join(',')}]`;
        }
    } catch (e) {
        console.warn("[Exobrain] Failed to generate embedding for residue.", e);
    }
    
    await db.query(`
        INSERT INTO architectural_residue (id, scenario, structural_data, outcome, failure_reason, embedding, hash, consensus_score, timestamp)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (hash) DO UPDATE SET timestamp = EXCLUDED.timestamp, consensus_score = EXCLUDED.consensus_score
    `, [id, residue.scenario, residue.structuralData, residue.outcome, residue.failureReason, embeddingStr, hash, residue.consensusScore, timestamp]);

    // v45.0: BROADCAST HEGEMONY (100% Consensus achieved)
    if (residue.consensusScore === 100 && residue.outcome === 'STABLE') {
        console.log(`[Hegemony] 🏆 100% Consensus achieved! Broadcasting Neural Hash to the Mesh.`);
        p2p.announceResidue(hash, residue.scenario);
    }

    return hash;
}

export async function getResidueByHash(hash: string): Promise<ArchitecturalResidue | null> {
    const db = await getDB();
    if (!db) return null;

    const result = await db.query(`
        SELECT * FROM architectural_residue WHERE hash = $1
    `, [hash]);

    return (result.rows[0] as unknown as ArchitecturalResidue) || null;
}

export async function queryResidue(scenarioKeywords: string): Promise<ArchitecturalResidue[]> {
    const db = await getDB();
    if (!db) return [];

    const result = await db.query(`
        SELECT * FROM architectural_residue 
        WHERE scenario LIKE $1 
        ORDER BY timestamp DESC 
        LIMIT 5
    `, [`%${scenarioKeywords}%`]);
    
    return result.rows as unknown as ArchitecturalResidue[];
}

export async function queryResidueSemantic(query: string, limit = 3): Promise<ArchitecturalResidue[]> {
    const db = await getDB();
    if (!db) return [];

    try {
        const embRes = await getEmbedding(query);
        if (!embRes.success) throw new Error("Embedding failed");

        const vectorStr = `[${embRes.embedding.join(',')}]`;
        const result = await db.query(`
            SELECT *, 1 - (embedding <=> $1) as similarity
            FROM architectural_residue
            WHERE embedding IS NOT NULL
            ORDER BY similarity DESC
            LIMIT $2
        `, [vectorStr, limit]);

        return result.rows as unknown as ArchitecturalResidue[];
    } catch (e) {
        console.warn("[Exobrain] Semantic query failed, falling back to keyword search.", e);
        return queryResidue(query);
    }
}

// Initialize table if not exists
export async function initResidueTable() {
    const db = await getDB();
    if (!db) return;
    
    await db.query(`
        CREATE TABLE IF NOT EXISTS architectural_residue (
            id TEXT PRIMARY KEY,
            scenario TEXT,
            structural_data JSONB,
            outcome TEXT,
            failure_reason TEXT,
            embedding vector(768),
            hash TEXT UNIQUE,
            consensus_score INTEGER DEFAULT 0,
            timestamp INTEGER
        )
    `);
}
