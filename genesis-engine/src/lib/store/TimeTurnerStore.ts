/**
 * MODULE T: TIME-TURNER STORE
 * Objective: Manage temporal state for the History Scrubber.
 * Pattern: Simple Observable Store (No extra deps like Zustand)
 */

type Listener = () => void;

class TimeTurnerStore {
    private listeners: Set<Listener> = new Set();
    
    public state = {
        historyLength: 0,
        currentIndex: 0,
        isPlaying: true
    };

    public subscribe(listener: Listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notify() {
        this.listeners.forEach(l => l());
    }

    public setHistoryLength(len: number) {
        if (this.state.historyLength !== len) {
            this.state.historyLength = len;
            // Auto-follow if playing
            if (this.state.isPlaying) {
                this.state.currentIndex = len - 1;
            }
            this.notify();
        }
    }

    public setCurrentIndex(index: number) {
        this.state.currentIndex = index;
        // If user scrubs manually, we usually pause, but let's leave that to the caller
        this.notify();
    }

    public togglePlayback() {
        this.state.isPlaying = !this.state.isPlaying;
        // If we resume, jump to end? Or resume from current?
        // "Resume from current" implies forking reality (Multiverse).
        // For v18.0, let's keep it simple: Resume = Resume physics, effectively forking if we were in the past.
        // But since history is a buffer, "resuming" from the past requires truncating the future.
        if (this.state.isPlaying && this.state.currentIndex < this.state.historyLength - 1) {
            // We are time traveling!
            // Logic handled in ECSRenderer
        }
        this.notify();
    }
}

export const timeTurner = new TimeTurnerStore();

// React Hook
import { useSyncExternalStore } from 'react';

export function useTimeTurner() {
    return useSyncExternalStore(
        (cb) => timeTurner.subscribe(cb),
        () => timeTurner.state,
        () => timeTurner.state // Server snapshot
    );
}
