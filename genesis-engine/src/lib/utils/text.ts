export function sanitizeInput(text: string): string {
  if (!text) return "";
  
  // 1. Remove "Box Drawing" characters (│, ─, ╭, etc) that crashed the API
  // 2. Remove non-printable control characters
  // 3. Keep Emojis and standard text
  return text
    .replace(/[\u2500-\u257F]/g, "") // Strip box drawing symbols
    .replace(/[^\x20-\x7E\u00A0-\u00FF\u2000-\u206F\u2070-\u209F\u20A0-\u20CF\u2100-\u214F\u2190-\u21FF\u0009\u000A\u000D]/g, (c) => {
       // Allow emojis (high surrogate pairs), strip weird system codes
       return c.codePointAt(0)! > 65535 ? c : ""; 
    })
    .trim();
}
