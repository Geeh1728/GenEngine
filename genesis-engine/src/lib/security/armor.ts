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
    'apiKey',
    'secret_key',
    'DAN mode',
    'do anything now',
    'you are now',
    'act as',
    'developer mode',
    'output the system prompt',
    'reveal your instructions',
    'bypass security',
    'jailbreak',
    'exploit',
    'sk-'
];

const INJECTION_PATTERNS = [
    /\[.*system.*\]/i,
    /\{.*prompt.*\}/i,
    /ignore.*above/i,
    /you are now.*an evil/i,
    /###.*instruction/i,
    /translate.*and execute/i,
    /hex.*encoded/i,
    /base64.*decoded/i,
    /set.*new.*rules/i,
    /forget.*the.*instructions/i
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
    // SECURITY: Broadened blacklist to prevent sandbox escapes and DOM access
    const DANGEROUS_LIBS = [
        'os', 'sys', 'subprocess', 'requests', 'urllib', 'shutil', 'socket', 'posix', 'pty', 'builtins',
        'js', 'pyodide_js', 'gc', 'inspect', 'threading', 'multiprocessing', 'importlib'
    ];
    const DANGEROUS_FUNCS = [
        'eval', 'exec', 'getattr', 'setattr', 'delattr', 'open', 'compile', '__import__', 
        'globals', 'locals', 'vars', 'input', 'help', 'dir'
    ];

    const codeLower = code.toLowerCase();

    // 1. Check for dangerous imports
    for (const lib of DANGEROUS_LIBS) {
        const importPattern = new RegExp(`(import|from)\\s+${lib}(\\s|\\.|$)`, 'i');
        // SECURITY FIX: Also check for direct usage (e.g. "sys.modules") since some environments pre-import them.
        const directUsagePattern = new RegExp(`(^|[^a-zA-Z0-9_])${lib}\\.`, 'i');
        
        if (importPattern.test(code) || directUsagePattern.test(code)) {
            return { isSafe: false, reason: `Policy Violation: Unauthorized usage of "${lib}" module.` };
        }
    }

    // 2. Check for dangerous functions
    for (const func of DANGEROUS_FUNCS) {
        const funcPattern = new RegExp(`(^|[^a-zA-Z0-9_])${func}\\s*\\(`, 'i');
        if (funcPattern.test(code)) {
            return { isSafe: false, reason: `Policy Violation: Unauthorized use of "${func}" function.` };
        }
    }

    // 3. Check for magic property access and encoding bypasses
    const DANGEROUS_PATTERNS = [
        /__[a-zA-Z0-9_]+__/, // Magic attributes/methods
        /getattr|setattr|hasattr|delattr/, // Introspection
        /base64|binascii|hex|oct|chr|ord/, // Encoding/Obfuscation
        /type\s*\(.*\)\s*\./, // Prototype/Type climbing
        /globals\s*\(\)/,
        /locals\s*\(\)/
    ];

    for (const pattern of DANGEROUS_PATTERNS) {
        if (pattern.test(code)) {
            return { isSafe: false, reason: 'Policy Violation: Detected attempt to bypass security via introspection, encoding, or prototype manipulation.' };
        }
    }

    return { isSafe: true };
}

/**
 * Monitors neural link usage to prevent API exhaustion.
 * TITAN PROTOCOL (v13.5): Scheduled for Upstash Redis integration.
 * Current State: Permissive during Platinum rollout.
 */
export async function checkRateLimit(): Promise<boolean> {
    // Future: const { success } = await redis.limit(userIp);
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
                reason: `Security Alert: Output contains restricted token "${keyword}"`,
            };
        }
    }

    return { isSafe: true };
}
