/**
 * TITAN DISK - LEVEL 3: VAULT (IndexedDB)
 * Objective: Durable, high-capacity fallback storage.
 * Strategy: Native IndexedDB wrapper for "slow but safe" persistence.
 */

const DB_NAME = 'TitanVault_v1';
const STORE_NAME = 'key_value_store';

export class L3IDBAdapter {
    private dbPromise: Promise<IDBDatabase> | null = null;

    constructor() {
        if (typeof window !== 'undefined') {
            this.dbPromise = this.initDB();
        }
    }

    private initDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, 1);

            request.onerror = () => {
                console.error('[TitanDisk] L3 (IDB) Initialization Failed');
                reject(request.error);
            };

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };
        });
    }

    public async set(key: string, value: any): Promise<void> {
        if (!this.dbPromise) return;
        try {
            const db = await this.dbPromise;
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([STORE_NAME], 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.put(value, key);

                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (e) {
            console.warn(`[TitanDisk] L3 Write Failed: ${key}`, e);
        }
    }

    public async get(key: string): Promise<any | null> {
        if (!this.dbPromise) return null;
        try {
            const db = await this.dbPromise;
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([STORE_NAME], 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.get(key);

                request.onsuccess = () => resolve(request.result ?? null);
                request.onerror = () => reject(request.error);
            });
        } catch (e) {
            console.warn(`[TitanDisk] L3 Read Failed: ${key}`, e);
            return null;
        }
    }

    public async delete(key: string): Promise<void> {
        if (!this.dbPromise) return;
        const db = await this.dbPromise;
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        store.delete(key);
    }
}
