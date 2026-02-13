import { L1MemoryAdapter } from './adapters/l1-memory';
import { L2OPFSAdapter } from './opfs-manager'; // We renamed the class inside the file, but file name remains for now to avoid breaking imports elsewhere iteratively
import { L3IDBAdapter } from './adapters/l3-idb';
import { L4FirebaseAdapter } from './adapters/l4-firebase';

/**
 * MODULE D: TITAN DISK v2.0 (The Storehouse)
 * Objective: Hybrid Tiered Storage with Circuit Breakers.
 * Tiers:
 * 1. RAM (Ephemeral, Instant)
 * 2. OPFS (Persistent, Fast)
 * 3. IDB (Durable, Backup)
 * 4. FIREBASE (Cloud, Sovereign Vault) - v41.0
 */

export class TitanDisk {
    private static instance: TitanDisk;

    private l1: L1MemoryAdapter;
    private l2: L2OPFSAdapter;
    private l3: L3IDBAdapter;
    private l4: L4FirebaseAdapter | null = null;

    private opfsFailureCount = 0;
    private OPFS_THRESHOLD = 3;
    private isOPFSDisabled = false;

    private constructor() {
        this.l1 = new L1MemoryAdapter(50); // Keep last 50 items in RAM
        this.l2 = new L2OPFSAdapter();
        this.l3 = new L3IDBAdapter();
    }

    public static getInstance() {
        if (!TitanDisk.instance) {
            TitanDisk.instance = new TitanDisk();
        }
        return TitanDisk.instance;
    }

    /**
     * Initialize Cloud Tier (v41.0)
     */
    public initCloud(storage: any, user: any) {
        this.l4 = new L4FirebaseAdapter(storage, user);
    }

    /**
     * Save data (Tiered Write)
     * Always writes to RAM. Tries OPFS. If OPFS fails, writes to IDB.
     */
    public async save(key: string, data: ArrayBuffer | string | object): Promise<void> {
        // 1. Normalize Data
        let buffer: ArrayBuffer;
        if (data instanceof ArrayBuffer) {
            buffer = data;
        } else if (typeof data === 'object') {
            buffer = new TextEncoder().encode(JSON.stringify(data)).buffer;
        } else {
            buffer = new TextEncoder().encode(data).buffer;
        }

        // 2. Write to L1 (RAM) - Instant
        this.l1.set(key, data);

        // 3. Write to Persistence (L2 -> L3 Fallback)
        if (!this.isOPFSDisabled) {
            try {
                await this.l2.save(key, buffer);
                this.opfsFailureCount = 0; // Reset on success
            } catch (e) {
                console.warn(`[TitanDisk] OPFS Write Failed (${this.opfsFailureCount + 1}/${this.OPFS_THRESHOLD})`, e);
                this.handleOPFSFailure();

                // Fallback to L3
                await this.l3.set(key, buffer);
            }
        } else {
            // Direct to L3 if OPFS is broken
            await this.l3.set(key, buffer);
        }

        // 4. v41.0: Cloud Sync (Non-blocking)
        if (this.l4 && key.startsWith('world_')) {
            this.l4.sync(key, buffer);
        }
    }

    /**
     * Load data (Tiered Read)
     * Checks L1 -> L2 -> L3
     */
    public async load(key: string): Promise<any | null> {
        // 1. Check L1
        if (this.l1.has(key)) {
            return this.l1.get(key);
        }

        // 2. Check L2 (if healthy)
        if (!this.isOPFSDisabled) {
            try {
                const file = await this.l2.read(key);
                if (file) {
                    const text = await file.text();
                    // Try to parse JSON, else return Blob/Text
                    try { return JSON.parse(text); } catch { return text; }
                }
            } catch (e) {
                console.warn(`[TitanDisk] OPFS Read Failed for ${key}`, e);
                this.handleOPFSFailure();
            }
        }

        // 3. Fallback to L3
        const idbData = await this.l3.get(key);
        if (idbData) {
            // Hydrate inner tiers for next time
            // We got it from IDB, maybe we should write back to OPFS later? For now, just L1.
            try {
                const parsed = JSON.parse(new TextDecoder().decode(idbData));
                this.l1.set(key, parsed);
                return parsed;
            } catch {
                this.l1.set(key, idbData);
                return idbData;
            }
        }

        return null;
    }

    /**
     * Circuit Breaker Logic
     */
    private handleOPFSFailure() {
        this.opfsFailureCount++;
        if (this.opfsFailureCount >= this.OPFS_THRESHOLD) {
            this.isOPFSDisabled = true;
            console.error('[TitanDisk] 🔴 OPFS Circuit Breaker Tripped. Downgrading storage to IDB (L3).');
        }
    }

    public async delete(key: string) {
        this.l1.delete(key);
        if (!this.isOPFSDisabled) await this.l2.delete(key);
        await this.l3.delete(key);
    }
}

export const titanDisk = TitanDisk.getInstance();
