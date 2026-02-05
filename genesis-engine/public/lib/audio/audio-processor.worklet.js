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
                this.buffer[this.ptr++] = channelData[i];

                if (this.ptr >= this.bufferSize) {
                    // Convert to 16-bit PCM
                    const pcmData = this.floatTo16BitPCM(this.buffer);
                    this.port.postMessage(pcmData.buffer, [pcmData.buffer]);
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
