import { useState } from 'react';
import { generatePodcastScript } from '@/app/actions/podcast';
import { runPython } from '@/lib/python/pyodide';
import { useGenesisEngine } from '@/hooks/useGenesisEngine';
import { Entity } from '@/lib/simulation/schema';

export interface LocalInterfaceState {
    isListening: boolean;
    setIsListening: (v: boolean) => void;
    isRealityLensOpen: boolean;
    setIsRealityLensOpen: (v: boolean) => void;
    isGardenOpen: boolean;
    setIsGardenOpen: (v: boolean) => void;
    podcastScript: { host: 'A' | 'B', text: string }[] | null;
    isGeneratingPodcast: boolean;
    handleStartPodcast: () => Promise<void>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pythonOutput: { stdout: string | null; result: number | string | Record<string, any> | null; error: string | null } | null;
    isExecutingPython: boolean;
    handleRunVerification: () => Promise<void>;
    handleTeleport: (newEntities: Entity[]) => void;
    handleExport: () => void;
    handleSaboteurReply: (reply: string) => void;
}

export function useLocalInterface(engine: ReturnType<typeof useGenesisEngine>): LocalInterfaceState {
    const [isListening, setIsListening] = useState(false);
    const [isRealityLensOpen, setIsRealityLensOpen] = useState(false);
    const [isGardenOpen, setIsGardenOpen] = useState(false);

    // Podcast State
    const [podcastScript, setPodcastScript] = useState<{ host: 'A' | 'B', text: string }[] | null>(null);
    const [isGeneratingPodcast, setIsGeneratingPodcast] = useState(false);

    // Python State
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [pythonOutput, setPythonOutput] = useState<{ stdout: string | null; result: number | string | Record<string, any> | null; error: string | null } | null>(null);
    const [isExecutingPython, setIsExecutingPython] = useState(false);

    const handleStartPodcast = async () => {
        if (!engine.worldRules.length) return;
        setIsGeneratingPodcast(true);

        // CONTEXT-AWARE PODCAST: Include details about the current simulation
        const world = engine.worldState;
        const simulationContext = world ? `
            CURRENT SIMULATION: ${world.scenario}
            DESCRIPTION: ${world.description}
            EXPLANATION: ${world.explanation}
            ENTITIES: ${world.entities?.map(e => `${e.color} ${e.type}`).join(', ')}
            GRAVITY: ${world.environment?.gravity.y}
        ` : '';

        const rulesContent = engine.worldRules.map(r => `${r.rule}: ${r.description}`).join('\n');
        const fullContent = `RULES:\n${rulesContent}\n\n${simulationContext}`;

        const script = await generatePodcastScript(fullContent);
        setPodcastScript(script);
        setIsGeneratingPodcast(false);
    };

    const handleRunVerification = async () => {
        if (!engine.worldState?.python_code) return;
        setIsExecutingPython(true);
        const result = await runPython(engine.worldState.python_code);
        setPythonOutput(result);
        setIsExecutingPython(false);
    };

    const handleTeleport = (newEntities: Entity[]) => {
        const current = engine.worldState;
        if (!current) return;

        // Explicit merge since setWorldState (syncWorldState) does not support functional updates
        engine.setWorldState({
            ...current,
            entities: [...(current.entities || []), ...newEntities]
        });
    };

    const handleExport = () => {
        alert("Knowledge Crystal Manifested! Study bundle exported to your workspace.");
    };

    const handleSaboteurReply = (reply: string) => {
        engine.resolveChallenge?.(reply);
    };

    return {
        isListening, setIsListening,
        isRealityLensOpen, setIsRealityLensOpen,
        isGardenOpen, setIsGardenOpen,
        podcastScript,
        isGeneratingPodcast,
        handleStartPodcast,
        pythonOutput,
        isExecutingPython,
        handleRunVerification,
        handleTeleport,
        handleExport,
        handleSaboteurReply
    };
}
