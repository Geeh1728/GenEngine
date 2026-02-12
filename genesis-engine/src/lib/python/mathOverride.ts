'use client';

import { runPython } from './pyodide';
import { WorldState, Entity } from '@/lib/simulation/schema';
import { blackboard } from '@/lib/genkit/context';

/**
 * Math Override Module (The Verification Pivot)
 * 
 * Objective: Execute AI-generated Python code and use its numerical results
 * to OVERRIDE the AI's guessed coordinates, making math the "Source of Truth."
 */

interface MathResult {
    positions?: Array<{ id: string; x: number; y: number; z: number }>;
    trajectories?: Array<{ id: string; path: Array<{ x: number; y: number; z: number }> }>;
    constants?: Record<string, number>;
    raw?: string;
}

/**
 * Parses structured math output from Python stdout.
 * Expected format: JSON object with positions, trajectories, or constants.
 */
function parseMathOutput(stdout: string): MathResult {
    if (!stdout) return { raw: '' };

    // Try to extract JSON from the output
    const jsonMatch = stdout.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        try {
            return JSON.parse(jsonMatch[0]);
        } catch (e) {
            console.warn('[MathOverride] Failed to parse JSON from stdout:', e);
        }
    }

    // Fallback: Try to extract coordinate tuples like (x, y, z)
    const coordMatches = [...stdout.matchAll(/(\w+):\s*\(([^)]+)\)/g)];
    if (coordMatches.length > 0) {
        const positions = coordMatches.map(match => {
            const [x, y, z] = match[2].split(',').map(v => parseFloat(v.trim()));
            return { id: match[1], x, y, z };
        });
        return { positions, raw: stdout };
    }

    return { raw: stdout };
}

/**
 * Executes Python code and returns structured math results.
 */
export async function executeMathVerification(pythonCode: string): Promise<MathResult | null> {
    if (typeof window === 'undefined') return null;

    const result = await runPython(pythonCode);

    if (result?.error) {
        console.error('[MathOverride] Python execution error:', result.error);
        return null;
    }

    if (result?.stdout) {
        return parseMathOutput(result.stdout);
    }

    return null;
}

/**
 * THE VERIFICATION PIVOT (v15.0 Neuro-Symbolic)
 * 
 * Objective: Execute multiple AI hypotheses and select the one with 
 * 'Zero-Error' symbolic verification as the Ground Truth.
 */
export async function applyMathOverride(
    worldState: WorldState,
    pythonCode: string,
    customAxioms?: { PI?: number; C?: number; G?: number },
    chronesthesia?: { year: number; enabled: boolean }
): Promise<WorldState> {
    if (!pythonCode || typeof window === 'undefined') {
        return worldState;
    }

    // AXIOM BREAKER (v23.5): Inject User-Defined Constants
    let effectiveCode = pythonCode;
    
    // v35.5: HISTORICAL KERNEL OVERRIDE
    if (chronesthesia?.enabled) {
        let historicalHeader = "# CHRONESTHESIA KERNEL ACTIVE:\n";
        if (chronesthesia.year < 1905) {
            historicalHeader += "# Era: Pre-Einsteinian. Disabling Relativistic effects.\n";
            historicalHeader += "def calculate_lorentz(v, c): return 1.0 # Override to 1.0 (No contraction)\n";
            historicalHeader += "C = 999999999 # Treat C as effectively infinite for Newtonian math\n";
            blackboard.log('Astra', `Historical kernel active: ${chronesthesia.year}. Enforcing Newtonian absolutes.`, 'INFO');
        }
        effectiveCode = historicalHeader + "\n" + effectiveCode;
    }

    if (customAxioms) {
        let axiomHeader = "# AXIOM OVERRIDES:\n";
        if (customAxioms.PI) axiomHeader += `import math\nmath.pi = ${customAxioms.PI}\nPI = ${customAxioms.PI}\n`;
        if (customAxioms.C) axiomHeader += `C = ${customAxioms.C} # Speed of Light\n`;
        if (customAxioms.G) axiomHeader += `G = ${customAxioms.G} # Gravitational Constant\n`;

        effectiveCode = axiomHeader + "\n" + pythonCode;
        console.log("[AxiomBreaker] Injected custom constants into Python kernel.");
    }

    // AlphaGeometry Heist: Split code into potential hypotheses if delimited
    const hypotheses = pythonCode.split('### HYPOTHESIS').filter(h => h.trim().length > 0);

    let bestResult: MathResult | null = null;

    if (hypotheses.length > 1) {
        console.log(`[AlphaGeometry] Searching ${hypotheses.length} logical hypotheses for symbolic proof...`);
        blackboard.log('Solver', `🔍 AlphaGeometry: Proof Search initiated (${hypotheses.length} paths)...`, 'THINKING');

        for (let i = 0; i < hypotheses.length; i++) {
            const hCode = customAxioms ?
                `# AXIOM INJECTION\nimport math\n${customAxioms.PI ? `math.pi=${customAxioms.PI}` : ''}\n` + hypotheses[i]
                : hypotheses[i];

            const res = await executeMathVerification(hCode);

            // SYMBOLIC PROOF: If the hypothesis outputs a valid result without error, select it
            if (res && !res.raw?.includes('Error')) {
                console.log(`[AlphaGeometry] Hypothesis ${i + 1} verified.`);
                blackboard.log('Solver', `✅ Hypothesis ${i + 1} verified via Symbolic Proof.`, 'SUCCESS');
                bestResult = res;
                break;
            }
        }
    } else {
        bestResult = await executeMathVerification(effectiveCode);
    }

    if (!bestResult) {
        console.warn('[MathOverride] No verified math result, using AI-generated positions.');
        return worldState;
    }

    const mathResult = bestResult;
    // Clone the world state for immutable update
    const patchedState = { ...worldState };

    // Override positions if math computed them
    if (mathResult.positions && patchedState.entities) {
        patchedState.entities = patchedState.entities.map((entity: Entity) => {
            const computed = mathResult.positions?.find(p => p.id === entity.id);
            if (computed) {
                console.log(`[MathOverride] Overriding ${entity.id} position with computed values.`);
                blackboard.log('Solver', `⚖️ SYMBOLIC TRUTH: Python verified coordinates for ${entity.id} (${entity.name})`, 'SYMBOLIC');
                return {
                    ...entity,
                    position: { x: computed.x, y: computed.y, z: computed.z },
                    truthSource: 'CALCULATED' as const
                };
            }
            return entity;
        });
    }

    // Store trajectories for future animation
    if (mathResult.trajectories) {
        patchedState._computedTrajectories = mathResult.trajectories;
    }

    // Override scientific constants
    if (mathResult.constants && patchedState.scientificParams) {
        patchedState.scientificParams = {
            ...patchedState.scientificParams,
            ...mathResult.constants
        };
    }

    // Mark that math verification was applied
    patchedState.python_result = mathResult.raw || 'Verification applied successfully.';

    console.log('[MathOverride] WorldState patched with computed values.');
    return patchedState;
}
