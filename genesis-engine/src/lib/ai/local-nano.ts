/**
 * MODULE X-0: HARDWARE REFLEX (Gemini Nano)
 * Objective: 0ms Latency, 100% Privacy, 0 Cost UI Reflexes.
 * Strategy: Use Chrome's built-in Gemini Nano model for background tasks.
 */

export interface NanoResult {
    success: boolean;
    text?: string;
    error?: string;
}

export async function checkNanoCapabilities(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    
    try {
        // @ts-ignore - Experimental Chrome API
        const capabilities = await window.ai?.languageModel?.capabilities();
        return capabilities?.available === 'readily';
    } catch (e) {
        return false;
    }
}

/**
 * Generic query for the local Gemini Nano model.
 */
export async function localReflexQuery(prompt: string, systemPrompt?: string): Promise<NanoResult> {
    try {
        if (!(await checkNanoCapabilities())) {
            throw new Error("Gemini Nano not available.");
        }

        // @ts-ignore - Experimental Chrome API
        const session = await window.ai.languageModel.create({
            systemPrompt: systemPrompt || "You are the Genesis Neural OS. Be concise and precise."
        });

        const result = await session.prompt(prompt);
        session.destroy();

        return {
            success: true,
            text: result
        };
    } catch (error) {
        return {
            success: false,
            error: String(error)
        };
    }
}

/**
 * Summarizes the Mission Logs locally to preserve cloud quota.
 */
export async function summarizeLogsLocally(logs: string[]): Promise<NanoResult> {
    const prompt = "Summarize these recent simulation logs into a single concise status update: " + logs.join(" ");
    return localReflexQuery(prompt, "You are a Scientific Librarian. Summarize logs concisely.");
}