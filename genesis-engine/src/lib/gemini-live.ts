import { WorldState } from './simulation/schema';

export interface GeminiLiveConfig {
    proxyUrl?: string; // CHANGED: Replaced apiKey with proxyUrl
    model?: string;
    systemInstruction?: string;
    initialWorldState?: WorldState;
    sampleRate?: number;
}

type GeminiLiveStatus = 'connected' | 'disconnected' | 'connecting' | 'error' | 'idle';

export class GeminiLiveManager {
    private ws: WebSocket | null = null;
    private config: GeminiLiveConfig;
    private onAudioData: (data: ArrayBuffer) => void;
    private onPhysicsUpdate: (delta: Partial<WorldState>) => void;
    private onStatusChange: (status: GeminiLiveStatus) => void;

    constructor(
        config: GeminiLiveConfig,
        onAudioData: (data: ArrayBuffer) => void,
        onPhysicsUpdate: (delta: Partial<WorldState>) => void,
        onStatusChange: (status: GeminiLiveStatus) => void
    ) {
        this.config = {
            model: 'models/gemini-2.5-flash-native-audio-preview-12-2025',
            systemInstruction: 'You are Astra. A 1% Engineer and Physics Tutor. Speak concisely and wittily. You are now a Vibe Coder partner. If the user makes a change, suggest a crazy "What If". Example: "You made it heavy... want to see what happens if we remove the air resistance?"',
            sampleRate: 16000,
            ...config
        };
        this.onAudioData = onAudioData;
        this.onPhysicsUpdate = onPhysicsUpdate;
        this.onStatusChange = onStatusChange;
    }

    public connect() {
        if (this.ws) return;

        this.onStatusChange('connecting');
        
        // SECURITY UPDATE: Use Proxy URL to hide API Key
        // If no proxyUrl is provided, fallback to relative path (assuming same-origin proxy)
        const baseUrl = this.config.proxyUrl || `ws://${typeof window !== 'undefined' ? window.location.host : 'localhost:3000'}/api/live-proxy`;
        
        console.log(`[IronShield] Connecting to Secure Proxy: ${baseUrl}`);
        this.ws = new WebSocket(baseUrl);

        this.ws.onopen = () => {
            console.log("Astra: Connected to Gemini Live API (Proxied)");
            this.onStatusChange('connected');
            this.sendSetup();
        };

        this.ws.onmessage = async (event) => {
            const response = JSON.parse(await event.data.text());
            this.handleResponse(response);
        };

        this.ws.onclose = () => {
            console.log("Astra: Connection closed");
            this.onStatusChange('disconnected');
            this.ws = null;
        };

        this.ws.onerror = (error) => {
            console.error("Astra WebSocket Error:", error);
            this.onStatusChange('error');
        };
    }

    private sendSetup() {
        const setupMessage = {
            setup: {
                model: this.config.model,
                generation_config: {
                    response_modalities: ["audio"]
                },
                system_instruction: {
                    parts: [{
                        text: `${this.config.systemInstruction}\nINITIAL CONTEXT: ${this.config.initialWorldState ? JSON.stringify(this.config.initialWorldState) : 'No simulation active.'}`
                    }]
                }
            }
        };
        this.ws?.send(JSON.stringify(setupMessage));
    }


    public sendAudioChunk(pcmData: ArrayBuffer) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        const base64 = btoa(
            String.fromCharCode(...new Uint8Array(pcmData))
        );

        const message = {
            realtime_input: {
                media_chunks: [
                    {
                        mime_type: "audio/pcm;rate=16000",
                        data: base64
                    }
                ]
            }
        };
        this.ws.send(JSON.stringify(message));
    }

    public interrupt() {
        const interruptMessage = {
            client_content: {
                turns: [],
                turn_complete: true
            }
        };
        this.ws?.send(JSON.stringify(interruptMessage));
    }

    private handleResponse(response: {
        server_content?: {
            model_turn?: {
                parts?: Array<{
                    inline_data?: { mime_type: string; data: string };
                    text?: string
                }>;
                tool_calls?: any[];
            }
        }
    }) {
        if (response.server_content?.model_turn?.parts) {
            for (const part of response.server_content.model_turn.parts) {
                if (part.inline_data && part.inline_data.mime_type.startsWith('audio/')) {
                    const binaryString = atob(part.inline_data.data);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    this.onAudioData(bytes.buffer);
                }

                if (part.text) {
                    try {
                        const json = JSON.parse(part.text);
                        if (json.entities || json.gravity || json.environment) {
                            this.onPhysicsUpdate(json);
                        }
                    } catch (e) {
                        // Regular text, ignore
                    }
                }
            }
        }
    }

    public disconnect() {
        this.ws?.close();
        this.ws = null;
    }
}