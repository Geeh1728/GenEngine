# Defensive Architect Super-Prompt

When defining a new feature using `/conductor:newTrack`, use this wrapper to ensure reliability and security:

> **Track Objective:** [Your Feature Here]
> 
> **Architecture Requirements:**
> - **Boundary Checks:** If the input (PDF/Video) is malformed or too large, the app must catch it and show a 'Graceful Degradation' UI.
> - **Operational Logic:** Add `try-catch` blocks with specific error logging (using Sentry or Axiom) for every external API call (Gemini/File Search).
> - **Code Quality:** Use modular functions—no single file should exceed 200 lines. If it does, refactor into smaller 'Logic Units'.
> - **Security Audit:** Before finalizing the implementation, perform a 'Self-Review' and list any potential OWASP vulnerabilities (like SSRF in the YouTube URL fetcher)."

# Production Launch Checklist

When preparing for a final Vercel deployment, use this checklist:

> **Mission: Production Seal**
> 
> 1. **Env Audit:** Ensure `GOOGLE_GENAI_API_KEY`, `OPENROUTER_API_KEY`, and `NEXT_PUBLIC_SIGNALING_URL` are set in Vercel.
> 2. **Worker Paths:** Verify all `new Worker(new URL(...))` calls use relative paths (`../../`) and not aliases.
> 3. **Edge Runtime:** Confirm `export const runtime = 'edge'` is present in all high-traffic API routes.
> 4. **Astra's First Breath:** Trigger the `INIT` goal to verify the production welcome message and system stabilization.
