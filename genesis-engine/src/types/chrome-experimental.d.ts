/**
 * Type definitions for experimental Chrome APIs
 * These cover Chrome AI APIs, WebSpeech, AudioContext prefixes, and Pyodide.
 */

declare global {
    interface Window {
        /** Chrome AI APIs (experimental) */
        ai?: {
            createTextToImage?: () => Promise<unknown>;
            languageModel?: {
                create: (options?: LanguageModelOptions) => Promise<LanguageModel>;
            };
        };

        /** WebSpeech API (standard + webkit prefix) */
        SpeechRecognition?: typeof SpeechRecognition;
        webkitSpeechRecognition?: typeof SpeechRecognition;

        /** AudioContext webkit prefix */
        webkitAudioContext?: typeof AudioContext;

        /** requestIdleCallback */
        requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
        cancelIdleCallback?: (handle: number) => void;

        /** Pyodide Python runtime */
        loadPyodide?: () => Promise<PyodideInterface>;
    }

    /** WebSocketPair for Cloudflare Workers compatibility */
    interface WebSocketPair {
        0: WebSocket;
        1: WebSocket;
    }
}

/** Chrome AI Language Model */
interface LanguageModelOptions {
    systemPrompt?: string;
    temperature?: number;
}

interface LanguageModel {
    prompt: (input: string) => Promise<string>;
    promptStreaming: (input: string) => ReadableStream<string>;
    destroy: () => void;
}

/** Pyodide Python Runtime Interface */
interface PyodideInterface {
    runPythonAsync: (code: string) => Promise<unknown>;
    loadPackage: (packages: string | string[]) => Promise<void>;
    globals: Map<string, unknown>;
}

/** IdleRequestCallback types */
interface IdleDeadline {
    readonly didTimeout: boolean;
    timeRemaining: () => number;
}

type IdleRequestCallback = (deadline: IdleDeadline) => void;

interface IdleRequestOptions {
    timeout?: number;
}

export { };
