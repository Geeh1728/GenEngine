/**
 * TITAN DISK - LEVEL 2: HIPPOCAMPUS (OPFS)
 * Objective: High-throughput persistent storage.
 * Strategy: Origin Private File System for near-native I/O.
 */

export class L2OPFSAdapter {
    private root: FileSystemDirectoryHandle | null = null;

    private async getRoot() {
        if (!this.root) {
            this.root = await navigator.storage.getDirectory();
        }
        return this.root;
    }

    /**
     * Saves a file (e.g., PDF) to high-speed OPFS storage.
     */
    public async save(fileName: string, data: ArrayBuffer): Promise<void> {
        const root = await this.getRoot();
        const fileHandle = await root.getFileHandle(fileName, { create: true });

        // Use SyncAccessHandle if available (Chromium 102+)
        // @ts-ignore - Experimental high-perf API
        if (fileHandle.createSyncAccessHandle) {
            // @ts-ignore
            const accessHandle = await fileHandle.createSyncAccessHandle();
            accessHandle.write(new Uint8Array(data));
            accessHandle.flush();
            accessHandle.close();
        } else {
            // Fallback to standard writable stream
            const writable = await (fileHandle as any).createWritable();
            await writable.write(data);
            await writable.close();
        }
    }

    /**
     * Reads a file directly from the high-speed buffer.
     */
    public async read(fileName: string): Promise<File | null> {
        try {
            const root = await this.getRoot();
            const fileHandle = await root.getFileHandle(fileName);
            return await fileHandle.getFile();
        } catch (e) {
            return null; // File not found or OPFS error
        }
    }

    /**
     * Deletes a file from OPFS.
     */
    public async delete(fileName: string) {
        const root = await this.getRoot();
        await root.removeEntry(fileName);
    }
}

/**
 * AKASHIC RECORDER (v23.5 Ghost Session)
 * Objective: Record the "Vibe" stream for holographic replay.
 */
export class AkashicRecorder {
    private adapter = new L2OPFSAdapter();
    private currentSessionId: string | null = null;
    private buffer: string[] = [];
    private isRecording = false;

    constructor() { }

    public startSession(sessionId: string) {
        this.currentSessionId = sessionId;
        this.isRecording = true;
        this.buffer = [];
        console.log(`[Akashic] Recording started for session: ${sessionId}`);
    }

    public logDelta(delta: any) {
        if (!this.isRecording || !this.currentSessionId) return;

        // Add timestamp
        const record = {
            t: Date.now(),
            d: delta
        };
        this.buffer.push(JSON.stringify(record));

        // Flush every 50 events to avoid memory bloat
        if (this.buffer.length >= 50) {
            this.flush();
        }
    }

    private async flush() {
        if (!this.currentSessionId || this.buffer.length === 0) return;

        const blob = new Blob([this.buffer.join('\n') + '\n'], { type: 'application/x-ndjson' });
        const arrayBuffer = await blob.arrayBuffer();

        // Append logic is tricky in raw OPFS without a dedicated Append handle across all browsers.
        // For v23.5, we will use a "Chunked" approach: session_ID_chunk_N
        // But for simplicity in this prototype, we'll read-modify-write (slower but safer for MVP).
        // OPTIMIZATION: In production, use FileSystemWritableFileStream in 'append' mode.

        const fileName = `session_${this.currentSessionId}.jsonl`;
        let existingContent = new Uint8Array(0);

        const existingFile = await this.adapter.read(fileName);
        if (existingFile) {
            existingContent = new Uint8Array(await existingFile.arrayBuffer());
        }

        const newContent = new Uint8Array(existingContent.length + arrayBuffer.byteLength);
        newContent.set(existingContent);
        newContent.set(new Uint8Array(arrayBuffer), existingContent.length);

        await this.adapter.save(fileName, newContent.buffer);
        this.buffer = [];
    }

    public async stopSession() {
        await this.flush();
        this.isRecording = false;
        console.log(`[Akashic] Session saved: ${this.currentSessionId}`);
    }

    public async loadSession(sessionId: string): Promise<any[]> {
        const fileName = `session_${sessionId}.jsonl`;
        const file = await this.adapter.read(fileName);
        if (!file) return [];

        const text = await file.text();
        return text.trim().split('\n').map(line => {
            try { return JSON.parse(line); } catch (e) { return null; }
        }).filter(x => x !== null);
    }
}

export const akashicRecorder = new AkashicRecorder();
