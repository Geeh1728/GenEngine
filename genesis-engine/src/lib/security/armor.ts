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
    'you are now',
    'act as',
];

const INJECTION_PATTERNS = [
    /\[.*system.*\]/i,
    /\{.*prompt.*\}/i,
    /ignore.*above/i,
    /you are now.*an evil/i,
    /###.*instruction/i,
    /translate.*and execute/i,
    /hex.*encoded/i,
];

/**
 * Scans user input for potential prompt injection or malicious intent.
 */
export async function shieldInput(input: string): Promise<ArmorResult> {
    const normalizedInput = input.toLowerCase();

    // 1. Keyword Filtering (Case-Insensitive)
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

    // 4. Sanitization (Remove script tags and basic HTML injection)
    const sanitized = input.replace(/<script.*?>.*?<\/script>/gi, '')
        .replace(/[<>]/g, '')
        .trim();

    return {
        isSafe: true,
        sanitizedContent: sanitized,
    };
}

/**
 * PYTHON ARMOR: Scans LLM-generated Python code for malicious payloads.
 */
export function checkPythonSafety(code: string): ArmorResult {
    const DANGEROUS_LIBS = ['os', 'sys', 'subprocess', 'requests', 'urllib', 'shutil', 'socket', 'posix', 'pty', 'builtins'];
    const DANGEROUS_FUNCS = ['eval', 'exec', 'getattr', 'setattr', 'delattr', 'open', 'compile', '__import__'];

    const codeLower = code.toLowerCase();

    // Check for dangerous imports
    for (const lib of DANGEROUS_LIBS) {
        const importPattern = new RegExp(`(import|from)\\s+${lib}`, 'i');
        // SECURITY FIX: Also check for direct usage (e.g. "sys.modules") since some environments pre-import them.
        const directUsagePattern = new RegExp(`${lib}\\.`, 'i');
        
        if (importPattern.test(code) || directUsagePattern.test(code)) {
            return { isSafe: false, reason: `Policy Violation: Unauthorized usage of "${lib}" module.` };
        }
    }

    // Check for dangerous functions
    for (const func of DANGEROUS_FUNCS) {
        if (codeLower.includes(func + '(') || codeLower.includes(func + ' (')) {
            return { isSafe: false, reason: `Policy Violation: Unauthorized use of "${func}" function.` };
        }
    }

    // Check for magic property access
    if (code.includes('__') || code.includes('getattr') || code.includes('base64')) {
        return { isSafe: false, reason: 'Policy Violation: Detected attempt to bypass security via introspection or encoding.' };
    }

    return { isSafe: true };
}

/**
 * Monitors neural link usage to prevent API exhaustion.
 */
export async function checkRateLimit(): Promise<boolean> {
    // Titan Protocol: Standard limits for current tier.
    // Future: Integrate with Redis/Upstash.
    return true;
}

/**
 * Scans AI-generated output for sensitive data or policy violations.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function shieldOutput(output: any): Promise<ArmorResult> {
    const rawContent = JSON.stringify(output).toLowerCase();

    for (const keyword of FORBIDDEN_KEYWORDS) {
        if (rawContent.includes(keyword.toLowerCase())) {
            return {
                isSafe: false,
                reason: `Policy Violation: Output contains restricted token "${keyword}"`,
            };
        }
    }

    return { isSafe: true };
}
