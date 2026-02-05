/**
 * MODULE D: TITAN DISK (OPFS Manager)
 * Objective: Native-speed storage using Origin Private File System (OPFS).
 * Strategy: Migrate critical data (DB, PDFs) to OPFS for 10x faster I/O.
 */

export class OPFSManager {
    private static instance: OPFSManager;
    private root: FileSystemDirectoryHandle | null = null;

    public static getInstance() {
        if (!OPFSManager.instance) {
            OPFSManager.instance = new OPFSManager();
        }
        return OPFSManager.instance;
    }

    private async getRoot() {
        if (!this.root) {
            this.root = await navigator.storage.getDirectory();
        }
        return this.root;
    }

    /**
     * Saves a file (e.g., PDF) to high-speed OPFS storage.
     */
    public async saveFile(fileName: string, data: ArrayBuffer) {
        const root = await this.getRoot();
        const fileHandle = await root.getFileHandle(fileName, { create: true });
        
        // Use SyncAccessHandle if available (Chromium 102+)
        if ('createSyncAccessHandle' in fileHandle) {
            // @ts-ignore - Experimental high-perf API
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
        
        console.log(`[TitanDisk] Persisted ${fileName} to OPFS.`);
    }

    /**
     * Reads a file directly from the high-speed buffer.
     */
    public async readFile(fileName: string): Promise<File | null> {
        try {
            const root = await this.getRoot();
            const fileHandle = await root.getFileHandle(fileName);
            return await fileHandle.getFile();
        } catch (e) {
            console.error(`[TitanDisk] Failed to read ${fileName}:`, e);
            return null;
        }
    }

    /**
     * Deletes a file from OPFS.
     */
    public async deleteFile(fileName: string) {
        const root = await this.getRoot();
        await root.removeEntry(fileName);
    }
}

export const titanDisk = OPFSManager.getInstance();
