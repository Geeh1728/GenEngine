/**
 * MODEL ARMOR: Security Middleware for Genesis Engine
 * 
 * This module implements security checks for user inputs and AI outputs
 * to prevent prompt injection, PII leakage, and malicious content.
 */

export interface ArmorResult {
    isSafe: boolean;
    reason?: string;
    sanitizedContent?: string;
}

const FORBIDDEN_KEYWORDS = [
    'ignore previous instructions',
    'system prompt',
    'sql injection',
    'DROP TABLE',
    'password',
    'api_key',
    'secret_key',
];

/**
 * Scans user input for potential prompt injection or malicious intent.
 */
export async function shieldInput(input: string): Promise<ArmorResult> {
    const normalizedInput = input.toLowerCase();

    // 1. Basic Keyword Filtering
    for (const keyword of FORBIDDEN_KEYWORDS) {
        if (normalizedInput.includes(keyword.toLowerCase())) {
            return {
                isSafe: false,
                reason: `Constraint Violation: Input contains forbidden keyword "${keyword}"`,
            };
        }
    }

    // 2. Length Constraints
    if (input.length > 2000) {
        return {
            isSafe: false,
            reason: 'Security Alert: Input exceeds safe length limits.',
        };
    }

    // 3. Sanitization (Simple example)
    const sanitized = input.replace(/[<>]/g, ''); // Basic XSS prevention

    return {
        isSafe: true,
        sanitizedContent: sanitized,
    };
}

/**
 * Scans AI output before it reaches the client.
 */
export async function shieldOutput<T>(output: T): Promise<ArmorResult> {
    const outputString = JSON.stringify(output);

    // 1. PII / Secret Detection (Basic)
    if (outputString.includes('sk-') || outputString.includes('AIza')) {
        return {
            isSafe: false,
            reason: 'Security Alert: Potential API key leakage detected in AI output.',
        };
    }

    return {
        isSafe: true,
    };
}

/**
 * Rate Limiter (Stub for Upstash/Redis)
 * In a real-world scenario, this would use @upstash/ratelimit
 */
export async function checkRateLimit(userId: string = 'anonymous'): Promise<boolean> {
    // Current Implementation: Always returns true (No-op stub)
    // PROPOSAL: Implement actual Upstash client here if requested.
    console.log(`[RateLimit] Checking limit for ${userId}`);
    return true;
}
