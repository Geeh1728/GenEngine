# Defensive Architect Super-Prompt

When defining a new feature using `/conductor:newTrack`, use this wrapper to ensure reliability and security:

> **Track Objective:** [Your Feature Here]
> 
> **Architecture Requirements:**
> - **Boundary Checks:** If the input (PDF/Video) is malformed or too large, the app must catch it and show a 'Graceful Degradation' UI.
> - **Operational Logic:** Add `try-catch` blocks with specific error logging (using Sentry or Axiom) for every external API call (Gemini/File Search).
> - **Code Quality:** Use modular functions—no single file should exceed 200 lines. If it does, refactor into smaller 'Logic Units'.
> - **Security Audit:** Before finalizing the implementation, perform a 'Self-Review' and list any potential OWASP vulnerabilities (like SSRF in the YouTube URL fetcher)."
