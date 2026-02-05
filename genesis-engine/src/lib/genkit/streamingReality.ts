// @ts-expect-error - partial-json-parser has no type declarations
import Parse from 'partial-json-parser';
import { WorldState, Entity } from '@/lib/simulation/schema';

/**
 * Streaming Reality Module (The Manifestation Engine)
 * 
 * Objective: Parse incomplete JSON as it streams from the AI,
 * allowing the simulation to render incrementally while the AI is still "thinking."
 */

export interface StreamingWorldState {
    isComplete: boolean;
    partialState: Partial<WorldState>;
    entitiesReady: Entity[];
    environmentReady: boolean;
    progress: number; // 0-100
}

/**
 * Parses a partial JSON string and extracts as much valid WorldState as possible.
 */
export function parsePartialWorldState(partialJson: string): StreamingWorldState {
    try {
        // Attempt to parse with partial-json-parser
        const parsed = Parse(partialJson);

        if (!parsed || typeof parsed !== 'object') {
            return {
                isComplete: false,
                partialState: {},
                entitiesReady: [],
                environmentReady: false,
                progress: 0
            };
        }

        // Check what we have so far
        const hasScenario = !!parsed.scenario;
        const hasMode = !!parsed.mode;
        const hasEnvironment = !!parsed.environment;
        const entities: Entity[] = [];

        // Extract fully-formed entities
        if (Array.isArray(parsed.entities)) {
            for (const entity of parsed.entities) {
                // Check if entity has minimum required fields
                if (entity.id && entity.type && entity.position && entity.physics) {
                    entities.push(entity as Entity);
                }
            }
        }

        // Calculate progress based on what's complete
        let progress = 0;
        if (hasScenario) progress += 10;
        if (hasMode) progress += 10;
        if (hasEnvironment) progress += 20;
        if (parsed.description) progress += 10;
        if (parsed.explanation) progress += 10;
        if (entities.length > 0) progress += 40;

        // Check if the JSON is fully complete (ends with closing brace)
        const trimmed = partialJson.trim();
        const isComplete = trimmed.endsWith('}') &&
            hasScenario && hasMode && hasEnvironment &&
            parsed.successCondition && parsed.constraints;

        return {
            isComplete,
            partialState: parsed as Partial<WorldState>,
            entitiesReady: entities,
            environmentReady: hasEnvironment,
            progress: Math.min(100, progress)
        };
    } catch (error) {
        console.warn('[StreamingReality] Parse error:', error);
        return {
            isComplete: false,
            partialState: {},
            entitiesReady: [],
            environmentReady: false,
            progress: 0
        };
    }
}

/**
 * Creates a base WorldState for streaming with placeholder values.
 */
export function createStreamingPlaceholder(): WorldState {
    return {
        scenario: 'Reality Manifesting...',
        mode: 'PHYSICS',
        domain: 'SCIENCE',
        description: 'The simulation is being compiled by the neural network...',
        explanation: 'Please wait while we translate your hypothesis into physics.',
        constraints: ['Reality is loading...'],
        successCondition: 'Observation pending',
        entities: [],
        environment: {
            gravity: { x: 0, y: -9.81, z: 0 },
            timeScale: 1
        }
    };
}

/**
 * Merges a partial streaming state into an existing placeholder.
 */
export function mergeStreamingState(
    placeholder: WorldState,
    streaming: StreamingWorldState
): WorldState {
    const merged = { ...placeholder };
    const partial = streaming.partialState;

    // Merge available fields
    if (partial.scenario) merged.scenario = partial.scenario;
    if (partial.mode) merged.mode = partial.mode;
    if (partial.description) merged.description = partial.description;
    if (partial.explanation) merged.explanation = partial.explanation;
    if (partial.constraints) merged.constraints = partial.constraints;
    if (partial.successCondition) merged.successCondition = partial.successCondition;
    if (partial.environment) merged.environment = partial.environment;
    if (partial.python_code) merged.python_code = partial.python_code;
    if (partial.sabotage_reveal) merged.sabotage_reveal = partial.sabotage_reveal;

    // Add ready entities incrementally
    if (streaming.entitiesReady.length > 0) {
        merged.entities = streaming.entitiesReady;
    }

    return merged;
}

export type StreamingCallback = (state: StreamingWorldState) => void;

/**
 * Processes a stream of text chunks and calls back with partial states.
 */
export class StreamingRealityParser {
    private buffer: string = '';
    private callback: StreamingCallback;
    private lastEntityCount: number = 0;

    constructor(callback: StreamingCallback) {
        this.callback = callback;
    }

    /**
     * Feed a new chunk of text from the streaming response.
     */
    feed(chunk: string): void {
        this.buffer += chunk;

        const parsed = parsePartialWorldState(this.buffer);

        // Only callback if we have new data
        if (parsed.entitiesReady.length > this.lastEntityCount || parsed.environmentReady) {
            this.lastEntityCount = parsed.entitiesReady.length;
            this.callback(parsed);
        }
    }

    /**
     * Signal that streaming is complete.
     */
    complete(): StreamingWorldState {
        const final = parsePartialWorldState(this.buffer);
        final.isComplete = true;
        final.progress = 100;
        this.callback(final);
        return final;
    }

    /**
     * Reset the parser for a new stream.
     */
    reset(): void {
        this.buffer = '';
        this.lastEntityCount = 0;
    }
}
