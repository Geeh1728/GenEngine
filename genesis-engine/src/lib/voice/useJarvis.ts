import { useState, useEffect, useCallback, useRef } from 'react';

interface JarvisState {
    isListening: boolean;
    isSpeaking: boolean;
    transcript: string;
    error: string | null;
}

interface JarvisOptions {
    voiceStress?: number; // 0.0 to 1.0 (0 = calm, 1 = panic/excited)
}

export const useJarvis = (options: JarvisOptions = {}) => {
    const [state, setState] = useState<JarvisState>({
        isListening: false,
        isSpeaking: false,
        transcript: '',
        error: null,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognitionRef = useRef<any>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            synthRef.current = window.speechSynthesis;

            // Initialize SpeechRecognition (Chrome/Edge)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const Win = window as any;
            const GlobalSpeechRecognition = Win.SpeechRecognition || Win.webkitSpeechRecognition;
            if (GlobalSpeechRecognition) {
                const recognition = new GlobalSpeechRecognition();
                recognition.continuous = false;
                recognition.interimResults = false;
                recognition.lang = 'en-US';

                recognition.onstart = () => setState(s => ({ ...s, isListening: true, error: null }));
                recognition.onend = () => setState(s => ({ ...s, isListening: false }));
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                recognition.onresult = (event: any) => {
                    const text = event.results[0][0].transcript;
                    setState(s => ({ ...s, transcript: text }));
                };
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                recognition.onerror = (event: any) => {
                    setState(s => ({ ...s, error: event.error }));
                };

                recognitionRef.current = recognition;
            } else {
                // Use a slight delay or just handle it in the render if possible, 
                // but for now setTimeout fixes the lint warning by making it async.
                setTimeout(() => {
                    setState(s => ({ ...s, error: 'Speech Recognition not supported in this browser.' }));
                }, 0);
            }
        }
    }, []);

    const speak = useCallback((text: string) => {
        if (!synthRef.current) return;

        // Cancel previous
        synthRef.current.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        // The "Vibe Hack"
        const stress = options.voiceStress || 0;
        utterance.pitch = 1.0 + (stress * 0.5); // Higher pitch with stress
        utterance.rate = 1.0 + (stress * 0.5);  // Faster rate with stress

        // Try to find a good robotic voice
        const voices = synthRef.current.getVoices();
        const googleVoice = voices.find(v => v.name.includes('Google US English'));
        if (googleVoice) utterance.voice = googleVoice;

        utterance.onstart = () => setState(s => ({ ...s, isSpeaking: true }));
        utterance.onend = () => setState(s => ({ ...s, isSpeaking: false }));

        synthRef.current.speak(utterance);
    }, [options.voiceStress]);

    const listen = useCallback(() => {
        if (recognitionRef.current && !state.isListening) {
            try {
                recognitionRef.current.start();
            } catch (e) {
                console.error("Speech recognition start failed", e);
            }
        }
    }, [state.isListening]);

    return {
        ...state,
        speak,
        listen
    };
};
