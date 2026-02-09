# GENESIS ENGINE: THE REALITY COMPILER (v21.0)

**Mission:** Transform passive learning into "Inverse Construction." The user teaches the AI; the AI compiles that logic into a simulation; reality breaks if the user is wrong.

## 1. CORE ARCHITECTURE: THE PLATINUM SWARM
The system is managed by a **Hive Orchestrator** issuing parallel work orders to specialized agents:

### MODULE A: THE TEXT-TO-ECS COMPILER (The Builder)
**Goal:** Convert text rules (PDFs) into strict Entity Component System (ECS) data.
1.  **Visionary Brain (Gemini 3 Flash):** Extracts visual rules (e.g., "Ethanol is a clear liquid").
2.  **Logic Brain (DeepSeek-R1):** Extracts mathematical formulas and constants.
3.  **Result:** Automated simulation parameterization based on grounded knowledge.

### MODULE S: THE SENTINEL PHYSICS LAWYER (The Judge)
**Goal:** Real-time validation of simulation states against ingested PDF rules.
1.  **Logic:** Checks every state change against the `SimConfig`.
2.  **Feedback:** Cites specific sources (e.g., "Page 14, Q3.1") when violations occur.
3.  **Result:** Educational "debate" mode.

### MODULE G: THE REALITY LENS (The Eyes)
**Goal:** Robotics-grade spatial understanding.
1.  **Input:** Camera / Image Upload.
2.  **Processing:** Gemini 2.5 Flash (Spatial Prompt).
3.  **Output:** 1000x1000 normalized grid coordinates mapped to Three.js world space.

### MODULE F: THE BABEL NODE (The Ears)
**Goal:** Universal speech-to-meaning translation.
1.  **Input:** Web Speech API (Local).
2.  **Processing:** Gemini 2.5 Flash extracts "Physics Intent" from speech.
3.  **Output:** JSON Physics Deltas + Native Browser TTS.

### MODULE H: THE METAPHOR ENGINE (The Artist)
**Goal:** Gamify abstract concepts or mundane photos.
1.  **Input:** "Inflation" or "Messy Desk photo".
2.  **Processing:** Procedural geometry generation (Voxel/Primitive).
3.  **Result:** Playable metaphors (e.g., "Balloon Pop" game for inflation).

---

## 2. TECH STACK (REBEL STACK)
*   **Frontend:** Next.js 16 (App Router) + Tailwind v4 + Framer Motion.
*   **Intelligence:** Genkit + Google AI (Gemini 3 Flash, 2.5 Flash) + OpenRouter (DeepSeek-R1).
*   **Physics:** React Three Fiber + Rapier.js (Ghost Kernel).
*   **Storage:** PGLite (Postgres WASM) + OPFS (Titan Disk).

---

## 3. KEY FILE STRUCTURE
*   `src/lib/genkit/ingestion.ts`: Dual-Brain Text-to-ECS logic.
*   `src/lib/genkit/mastery_agent.ts`: Living Exam Mode parser.
*   `src/app/actions/vision.ts`: Reality Lens server action.
*   `src/app/actions/babel.ts`: Universal Translator server action.
*   `src/components/simulation/`: All UI components (Canvas, RealityLens, BabelNode).

---

## 4. DEPLOYMENT CHECKLIST
*   [x] `GOOGLE_GENAI_API_KEY` set.
*   [x] `OPENROUTER_API_KEY` set.
*   [x] Vercel Edge Runtime configured for API routes.
*   [x] Worker paths verified for production.

**Status:** READY FOR PRODUCTION.