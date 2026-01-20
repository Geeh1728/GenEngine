import { PGlite } from '@electric-sql/pglite';
// import { vector } from '@electric-sql/pglite/vector'; // Waiting for official submodule export

// Global variable to hold the DB instance in the browser
let dbInstance: PGlite | null = null;

/**
 * Get or create the PGLite database instance.
 * Returns null on server-side (SSR) to prevent crashes.
 */
export const getDB = async (): Promise<PGlite | null> => {
  // SSR Guard: Prevent server-side crashes in Next.js
  if (typeof window === 'undefined') {
    return null;
  }

  if (!dbInstance) {
    // Initialize PGlite with IndexedDB persistence
    dbInstance = new PGlite('idb://genesis-db', {
      // extensions: { vector }, // Uncomment when vector extension is standard
    });

    // Initialize schema (run once)
    // 768 dimensions matches text-embedding-004 output
    await dbInstance.exec(`
            CREATE EXTENSION IF NOT EXISTS vector;
            CREATE TABLE IF NOT EXISTS knowledge_vectors (
                id SERIAL PRIMARY KEY,
                content TEXT,
                embedding vector(768),
                metadata JSONB
            );
            CREATE TABLE IF NOT EXISTS simulations (
                id TEXT PRIMARY KEY,
                type TEXT,
                dna JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
    console.log('🔋 Genesis Local DB: Online');
  }
  return dbInstance;
};

/**
 * Save a simulation state (DNA) to PGLite.
 */
export async function saveSimulationToDB(id: string, type: string, dna: unknown) {
  const db = await getDB();
  if (!db) return;

  await db.query(`
    INSERT INTO simulations (id, type, dna)
    VALUES ($1, $2, $3)
    ON CONFLICT (id) DO UPDATE SET dna = EXCLUDED.dna
  `, [id, type, JSON.stringify(dna)]);
  
  console.log(`💾 Simulation ${id} (${type}) saved to Local DB.`);
}

/**
 * Load a simulation state from PGLite.
 */
export async function loadSimulationFromDB(id: string) {
  const db = await getDB();
  if (!db) return null;

  const result = await db.query('SELECT * FROM simulations WHERE id = $1', [id]);
  return result.rows[0] || null;
}

/**
 * Bulk store knowledge chunks with their embeddings.
 * Used after PDF ingestion to persist vectors locally.
 */
export async function storeKnowledge(vectors: Array<{ text: string; vector: number[] }>) {
  const db = await getDB();
  if (!db) return;

  // Transaction for speed
  await db.transaction(async (tx) => {
    for (const item of vectors) {
      const vectorStr = `[${item.vector.join(',')}]`;
      await tx.query(
        'INSERT INTO knowledge_vectors (content, embedding) VALUES ($1, $2)',
        [item.text, vectorStr]
      );
    }
  });

  // Verify storage
  const count = await db.query('SELECT count(*) FROM knowledge_vectors');
  console.log(`📚 Stored ${(count.rows[0] as { count: string }).count} knowledge chunks locally.`);
}

/**
 * Query knowledge using semantic similarity (cosine distance).
 * Returns top 3 most relevant chunks.
 */
export async function queryKnowledge(queryVector: number[], limit = 3) {
  const db = await getDB();
  if (!db) return [];

  const vectorStr = `[${queryVector.join(',')}]`;
  // Semantic Search via Cosine Similarity (<=> operator)
  const result = await db.query(`
        SELECT content, 1 - (embedding <=> $1) as similarity
        FROM knowledge_vectors
        ORDER BY similarity DESC
        LIMIT $2;
    `, [vectorStr, limit]);

  return result.rows;
}

/**
 * Store a single vector (legacy API, kept for compatibility).
 */
export async function storeVector(content: string, embedding: number[], metadata: Record<string, unknown> = {}) {
  const db = await getDB();
  if (!db) return;

  const vectorStr = `[${embedding.join(',')}]`;
  await db.query(`
        INSERT INTO knowledge_vectors (content, embedding, metadata)
        VALUES ($1, $2, $3)
    `, [content, vectorStr, JSON.stringify(metadata)]);
}

/**
 * Search vectors by cosine distance (legacy API, kept for compatibility).
 */
export async function searchVectors(queryEmbedding: number[], limit = 5) {
  const db = await getDB();
  if (!db) return [];

  const vectorStr = `[${queryEmbedding.join(',')}]`;
  const result = await db.query(`
        SELECT id, content, metadata, embedding <=> $1 as distance
        FROM knowledge_vectors
        ORDER BY distance ASC
        LIMIT $2
    `, [vectorStr, limit]);

  return result.rows;
}
