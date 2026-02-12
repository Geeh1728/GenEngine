/**
 * TITAN DISK - LEVEL 1: CORTEX (RAM)
 * Objective: Zero-latency ephemeral storage for high-frequency data.
 * Strategy: LRU Cache implementation to prevent memory leaks.
 */

export class L1MemoryAdapter {
    private cache: Map<string, any>;
    private maxSize: number;

    constructor(maxSize: number = 100) {
        this.cache = new Map();
        this.maxSize = maxSize;
    }

    public set(key: string, value: any): void {
        if (this.cache.size >= this.maxSize) {
            // Simple eviction: remove the first item (oldest insertion)
            const firstKey = this.cache.keys().next().value;
            if (firstKey) this.cache.delete(firstKey);
        }
        this.cache.set(key, value);
    }

    public get(key: string): any | null {
        if (!this.cache.has(key)) return null;

        // Refresh LRU position
        const value = this.cache.get(key);
        this.cache.delete(key);
        this.cache.set(key, value);

        return value;
    }

    public has(key: string): boolean {
        return this.cache.has(key);
    }

    public delete(key: string): void {
        this.cache.delete(key);
    }

    public clear(): void {
        this.cache.clear();
    }
}
