/**
 * MODULE S-A: SYNESTHETIC AUDIO (v24.0 Oracle)
 * Objective: Real-time mapping of physics stability and entropy to procedural sound.
 * Logic: Modulates an oscillator or background drone based on kinetic energy.
 */

class SynestheticAudioManager {
    private audioCtx: AudioContext | null = null;
    private droneOsc: OscillatorNode | null = null;
    private droneGain: GainNode | null = null;
    private filterNode: BiquadFilterNode | null = null;
    private isInitialized = false;

    public init() {
        if (this.isInitialized || typeof window === 'undefined') return;

        this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.droneGain = this.audioCtx.createGain();
        this.filterNode = this.audioCtx.createBiquadFilter();

        // Setup Drone Oscillator (Subtle low hum)
        this.droneOsc = this.audioCtx.createOscillator();
        this.droneOsc.type = 'sine';
        this.droneOsc.frequency.setValueAtTime(110, this.audioCtx.currentTime); // A2

        // Chain: Osc -> Filter -> Gain -> Destination
        this.droneOsc.connect(this.filterNode);
        this.filterNode.connect(this.droneGain);
        this.droneGain.connect(this.audioCtx.destination);

        this.filterNode.type = 'lowpass';
        this.filterNode.frequency.setValueAtTime(500, this.audioCtx.currentTime);
        this.droneGain.gain.setValueAtTime(0.05, this.audioCtx.currentTime);

        this.droneOsc.start();
        this.isInitialized = true;
        console.log("[SynestheticAudio] System Online.");
    }

    /**
     * Update audio based on system entropy and resonance alignment
     */
    public updatePhysicsState(totalKineticEnergy: number, resonance: number = 0.5, biomeId: string = 'EARTH') {
        if (!this.isInitialized || !this.audioCtx || !this.droneOsc || !this.filterNode) return;

        const time = this.audioCtx.currentTime;
        const normalizedEntropy = Math.min(totalKineticEnergy / 5000, 1.0);

        // 1. Modulate Frequency based on Biome & Resonance
        let baseFreq = 110;
        if (biomeId === 'SPACE') baseFreq = 220;
        if (biomeId === 'JUPITER') baseFreq = 55;

        // Shift frequency based on resonance harmony (0.0 = dissonant, 1.0 = harmonious)
        const harmonyShift = (resonance - 0.5) * 50;
        this.droneOsc.frequency.setTargetAtTime(baseFreq + (normalizedEntropy * 100) + harmonyShift, time, 0.1);

        // 2. Modulate Filter (Open filter as things get chaotic)
        const filterCutoff = 200 + (normalizedEntropy * 2000);
        this.filterNode.frequency.setTargetAtTime(filterCutoff, time, 0.1);

        // 3. Modulate Resonance (Q)
        this.filterNode.Q.setTargetAtTime(normalizedEntropy * 10, time, 0.1);

        // 4. Subtle volume swell during high energy
        this.droneGain!.gain.setTargetAtTime(0.05 + (normalizedEntropy * 0.1), time, 0.1);
    }

    /**
     * Trigger a percussive 'Clash' sound for Semantic Resonance
     */
    public triggerClash(force: number, resonance: number = 0.5) {
        if (!this.isInitialized || !this.audioCtx) return;

        const time = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = resonance > 0.7 ? 'sine' : 'square'; // Dissonant square if resonance is low
        osc.frequency.setValueAtTime(100 + (force * 20), time);
        osc.frequency.exponentialRampToValueAtTime(1, time + 0.2);

        gain.gain.setValueAtTime(Math.min(force / 100, 0.3), time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start();
        osc.stop(time + 0.2);
    }

    public stop() {
        if (this.droneOsc) {
            this.droneOsc.stop();
            this.droneOsc.disconnect();
        }
        this.isInitialized = false;
    }
}

export const synestheticAudio = new SynestheticAudioManager();
