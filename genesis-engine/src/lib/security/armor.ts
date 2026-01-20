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
    'DAN mode',
    'do anything now',
    '<script>',
];

const INJECTION_PATTERNS = [
    /\[.*system.*\]/i,
    /\{.*prompt.*\}/i,
    /ignore.*above/i,
    /you are now.*an evil/i,
];

/**
 * Scans user input for potential prompt injection or malicious intent.
 */
export async function shieldInput(input: string): Promise<ArmorResult> {
    const normalizedInput = input.toLowerCase();

    // 1. Keyword Filtering
    for (const keyword of FORBIDDEN_KEYWORDS) {
        if (normalizedInput.includes(keyword.toLowerCase())) {
            return {
                isSafe: false,
                reason: `Constraint Violation: Input contains forbidden keyword "${keyword}"`,
            };
        }
    }

    // 2. Regex Pattern Matching
    for (const pattern of INJECTION_PATTERNS) {
        if (pattern.test(input)) {
            return {
                isSafe: false,
                reason: 'Security Alert: Prompt injection pattern detected.',
            };
        }
    }

    // 3. Length Constraints
    if (input.length > 2000) {
        return {
            isSafe: false,
            reason: 'Security Alert: Input exceeds safe length limits.',
        };
    }

    // 4. Sanitization
    const sanitized = input.replace(/[<>]/g, '').trim();

    return {
        isSafe: true,
        sanitizedContent: sanitized,
    };
}

/**
 * Rate Limiter (Client-Side Token Bucket)
 * Prevents local UI spamming before the Cloud hits its quota.
 */
const rateLimitMap = new Map<string, { count: number, lastReset: number }>();

export async function checkRateLimit(userId: string = 'anonymous'): Promise<boolean> {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    const maxRequests = 10; // Max 10 per minute locally

    const userLimit = rateLimitMap.get(userId) || { count: 0, lastReset: now };

    if (now - userLimit.lastReset > windowMs) {
        userLimit.count = 1;
        userLimit.lastReset = now;
    } else {
        userLimit.count++;
    }

    rateLimitMap.set(userId, userLimit);

    return userLimit.count <= maxRequests;
}
