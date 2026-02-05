'use client';

class SoundManager {
    private static instance: SoundManager;
    private ctx: AudioContext | null = null;

    private constructor() {}

    public static getInstance(): SoundManager {
        if (!SoundManager.instance) {
            SoundManager.instance = new SoundManager();
        }
        return SoundManager.instance;
    }

    private getContext() {
        if (!this.ctx) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        return this.ctx;
    }

    // Procedural "Thud" for collisions (No external assets needed)
    public playCollision(magnitude: number) {
        const ctx = this.getContext();
        if (ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Physics-driven sound synthesis
        osc.frequency.setValueAtTime(100 - Math.min(magnitude * 2, 80), ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.2);
        
        const volume = Math.min(magnitude / 20, 1.0);
        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    }

    // "Ui Click" / Success Chime
    public playSuccess() {
        const ctx = this.getContext();
        if (ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    }

    // High-frequency UI "Tick"
    public playClick() {
        const ctx = this.getContext();
        if (ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.05);

        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.05);
    }

    // Low-frequency Procedural Alarm for Warnings
    public playWarning() {
        const ctx = this.getContext();
        if (ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.5);

        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.5);
    }

    // Subtle "Ping" for peer discovery
    public playPing() {
        const ctx = this.getContext();
        if (ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.2);
    }

    public playFrequency(frequency: number, type: 'TRIGGER' | 'IMPACT' | 'TENSION', amplitude: number) {
        const ctx = this.getContext();
        if (ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Map primitive types to waveforms
        if (type === 'IMPACT') {
            osc.type = 'square'; // Punchy
        } else if (type === 'TENSION') {
            osc.type = 'sawtooth'; // Rich harmonics (string-like)
        } else {
            osc.type = 'sine'; // Pure tone (Trigger)
        }

        osc.frequency.setValueAtTime(frequency, ctx.currentTime);

        // Envelope shaping based on physics type
        const volume = Math.min(Math.max(amplitude, 0.1), 1.0);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);

        if (type === 'IMPACT') {
            osc.frequency.exponentialRampToValueAtTime(frequency * 0.5, ctx.currentTime + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
            osc.stop(ctx.currentTime + 0.2);
        } else if (type === 'TENSION') {
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
            osc.stop(ctx.currentTime + 1.5);
        } else {
            // TRIGGER
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
            osc.stop(ctx.currentTime + 0.5);
        }

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
    }
}

export const sfx = SoundManager.getInstance();
