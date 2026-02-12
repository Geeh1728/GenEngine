/**
 * AudioWorklet for Genesis Engine (Astra Mode)
 * Converts input to 16kHz Mono PCM (16-bit Little Endian)
 * Processes output chunks for low-latency playback
 */
class AstraAudioProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.bufferSize = 2048;
        this.buffer = new Float32Array(this.bufferSize);
        this.ptr = 0;
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        if (input.length > 0) {
            const channelData = input[0]; // Take first channel (Mono)

            for (let i = 0; i < channelData.length; i++) {
                const sample = channelData[i];
                this.buffer[this.ptr++] = sample;

                if (this.ptr >= this.bufferSize) {
                    // NEURAL-VIBE: Calculate Volume (RMS) and Pitch (ZCR)
                    let sumSq = 0;
                    let zeroCrossings = 0;
                    for (let j = 0; j < this.buffer.length; j++) {
                        sumSq += this.buffer[j] * this.buffer[j];
                        if (j > 0 && ((this.buffer[j] >= 0 && this.buffer[j - 1] < 0) || (this.buffer[j] < 0 && this.buffer[j - 1] >= 0))) {
                            zeroCrossings++;
                        }
                    }
                    const volume = Math.sqrt(sumSq / this.buffer.length);
                    const pitchIndex = zeroCrossings / (this.buffer.length / 2); // Relative pitch 0-1

                    // Convert to 16-bit PCM
                    const pcmData = this.floatTo16BitPCM(this.buffer);
                    this.port.postMessage({
                        audio: pcmData.buffer,
                        metadata: { volume, pitchIndex }
                    }, [pcmData.buffer]);
                    this.ptr = 0;
                }
            }
        }
        return true;
    }

    floatTo16BitPCM(float32Array) {
        const buffer = new Int16Array(float32Array.length);
        for (let i = 0; i < float32Array.length; i++) {
            const s = Math.max(-1, Math.min(1, float32Array[i]));
            buffer[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        return buffer;
    }
}

registerProcessor('astra-audio-processor', AstraAudioProcessor);
