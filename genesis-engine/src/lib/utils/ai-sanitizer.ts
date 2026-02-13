/**
 * AI SANITIZER UTILITY (Iron Shield)
 * Objective: Clean raw output and sanitize inputs for client-side models.
 */

// 1. Output Sanitization (The "Filter")
export function cleanModelOutput(rawText: string): string {
    if (!rawText) return "";
    let cleaned = rawText.replace(/<think>[\s\S]*?<\/think>/gi, "");
    cleaned = cleaned.replace(/```(?:json)?/gi, "").replace(/```/g, "");
    return cleaned.trim();
}

/**
 * Extracts the content between <think> tags for the Neural Trace UI.
 */
export function extractReasoningTrace(rawText: string): string | null {
    if (!rawText) return null;
    const match = rawText.match(/<think>([\s\S]*?)<\/think>/i);
    return match ? match[1].trim() : null;
}

// 2. Input Sanitization (The "Iron Shield")
// Prevents Prompt Injection on local/client-side models
export function sanitizeInput(userInput: string): string {
    if (!userInput) return "";
    
    // Remove potential jailbreak patterns
    let sanitized = userInput
        .replace(/ignore previously/gi, "[REDACTED]")
        .replace(/system prompt/gi, "[REDACTED]")
        .replace(/simulated mode/gi, "[REDACTED]");
        
    return sanitized;
}
