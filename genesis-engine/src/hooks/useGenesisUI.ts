import { useState, useCallback, useEffect } from 'react';
import { WorldState } from '@/lib/simulation/schema';

// Local types to avoid server-side schema imports
interface WorldRule {
    id: string;
    rule: string;
    description: string;
    grounding_source?: string;
    isActive: boolean;
}

type ComplexityLevel = 'standard' | 'advanced' | 'quantum';

interface GodModeState {
    complexity: ComplexityLevel;
    constants: Record<string, number>;
    overrides: string[];
}

interface CommentaryState {
    text: string;
    citation: string;
    suggestedYoutubeId?: string;
}

interface DiagnosticsState {
    hypothesis: string;
    outcome: string;
    sabotageReveal?: string;
}

export function useGenesisUI() {
    // --- Ingestion & Global State ---
    const [isIngested, setIsIngested] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [neuralEngineProgress, setNeuralEngineProgress] = useState(0);
    const [worldRules, setWorldRules] = useState<WorldRule[]>([]);
    const [sourceTitle, setSourceTitle] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isObserved, setIsObserved] = useState(false);

    // --- God Mode Configuration ---
    const [godModeState, setGodModeState] = useState<GodModeState>({
        complexity: 'standard',
        constants: {
            gravity: 9.8,
            planck: 1,
            timeScale: 1,
        },
        overrides: [],
    });

    // --- Dialogue ---
    const [commentary, setCommentary] = useState<CommentaryState | null>(null);

    // --- Simulation Controls ---
    const [isPaused, setIsPaused] = useState(false);
    const [diagnostics, setDiagnostics] = useState<DiagnosticsState | null>(null);
    const [lastHypothesis, setLastHypothesis] = useState('');
    const [isSabotaged, setIsSabotaged] = useState(false);
    const [omniPrompt, setOmniPrompt] = useState('');
    const [activeChallenge, setActiveChallenge] = useState<string | null>(null);

    const updateCommentary = useCallback(async (intent?: string) => {
        try {
            const response = await fetch('/api/commentary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    complexity: godModeState.complexity,
                    activeRules: worldRules.filter(r => r.isActive),
                    overriddenRules: godModeState.overrides,
                    constants: godModeState.constants,
                    userIntent: intent
                }),
            });
            if (response.ok) {
                const data = await response.json();
                setCommentary(data);
            }
        } catch (err) {
            console.error('Failed to update commentary', err);
        }
    }, [godModeState, worldRules]);

    const handleConstantChange = useCallback((name: string, value: number) => {
        setGodModeState(prev => ({
            ...prev,
            constants: { ...prev.constants, [name]: value }
        }));
    }, []);

    const setComplexity = useCallback((complexity: ComplexityLevel) => {
        setGodModeState(prev => ({ ...prev, complexity }));
    }, []);

    const toggleRule = useCallback((id: string) => {
        setWorldRules(prev => prev.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
        setGodModeState(prev => {
            const isOverridden = prev.overrides.includes(id);
            return {
                ...prev,
                overrides: isOverridden
                    ? prev.overrides.filter(o => o !== id)
                    : [...prev.overrides, id]
            };
        });
    }, []);

    // Effect: Update commentary when key states change
    useEffect(() => {
        if (isIngested) {
            // Defer update to avoid synchronous state updates during render phase
            const timer = setTimeout(() => {
                updateCommentary();
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [isIngested, isObserved, godModeState.complexity, godModeState.overrides, updateCommentary]);

    return {
        isIngested, setIsIngested,
        isProcessing, setIsProcessing,
        neuralEngineProgress, setNeuralEngineProgress,
        worldRules, setWorldRules,
        sourceTitle, setSourceTitle,
        error, setError,
        isObserved, setIsObserved,
        godModeState, setGodModeState,
        commentary, setCommentary,
        isPaused, setIsPaused,
        diagnostics, setDiagnostics,
        lastHypothesis, setLastHypothesis,
        isSabotaged, setIsSabotaged,
        omniPrompt, setOmniPrompt,
        activeChallenge, setActiveChallenge,

        // Actions
        updateCommentary,
        handleConstantChange,
        setComplexity,
        toggleRule
    };
}
