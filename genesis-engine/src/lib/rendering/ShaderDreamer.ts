import { blackboard } from '../genkit/context';
import { evolveShader } from '@/app/actions/shaders';

/**
 * MODULE D: SHADER DREAMER (Genetic Evolution)
 * Objective: Background evolution of GLSL shaders for maximum beauty/clarity.
 * Strategy: Idle-only generation -> Background compilation -> Swap.
 */

class ShaderDreamer {
    private static instance: ShaderDreamer;
    private idleTimer: NodeJS.Timeout | null = null;
    private IS_EVOLVING = false;

    public static getInstance() {
        if (!ShaderDreamer.instance) {
            ShaderDreamer.instance = new ShaderDreamer();
        }
        return ShaderDreamer.instance;
    }

    public init() {
        if (typeof window === 'undefined') return;

        // Watch for idle state
        const resetTimer = () => {
            if (this.idleTimer) clearTimeout(this.idleTimer);
            this.idleTimer = setTimeout(() => this.dream(), 30000); // 30s idle
        };

        window.addEventListener('mousemove', resetTimer);
        window.addEventListener('keydown', resetTimer);
        window.addEventListener('visibilitychange', () => {
            if (document.hidden) this.dream();
        });
        resetTimer();
    }

    private async dream() {
        if (this.IS_EVOLVING || !blackboard.getContext().currentWorldState) return;

        console.log("[ShaderDreamer] User is idle. Engine is 'Dreaming' of better visuals...");
        this.IS_EVOLVING = true;

        try {
            const currentShader = blackboard.getContext().currentWorldState?.entities?.[0]?.shaderCode || "void main() { gl_FragColor = vec4(0.2, 0.5, 1.0, 1.0); }";

            // 1. Call Server Action for Evolution
            const result = await evolveShader(currentShader);

            if (result.success && result.variants) {
                // 2. Background Compilation Check
                const bestVariant = result.variants[0];
                
                blackboard.log('Artist', "Engine optimized the visual field during rest. Manifesting new neural shader.", 'MANIFEST');
                
                // 3. Apply to Blackboard
                const state = blackboard.getContext().currentWorldState!;
                if (state.entities && state.entities.length > 0) {
                    state.entities[0].shaderCode = bestVariant;
                    blackboard.updateFromWorldState(state);
                }
            }
        } catch (e) {
            console.warn("Shader dreaming failed.");
        } finally {
            this.IS_EVOLVING = false;
        }
    }
}

export const shaderDreamer = ShaderDreamer.getInstance();
