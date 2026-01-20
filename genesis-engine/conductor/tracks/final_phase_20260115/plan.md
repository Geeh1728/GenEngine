# MISSION: GENESIS ENGINE - FINAL PHASE IMPLEMENTATION

**Context & Source of Truth:** 
We are building "The Genesis Engine," a Next.js 15 learning platform with a **Tri-Tier Hybrid Architecture**.
**CRITICAL:** I have provided a file named `gemini.md` (or this chat history). This file contains:
1.  **Exact Code Snippets** from Google Demos ("Kinetic Shapes", "Sky Metropolis").
2.  **Mathematical Formulas** for the Runge-Kutta solver.
3.  **Architectural Decisions** for the "Prometheus Protocol".
**You MUST read `gemini.md` to retrieve specific implementation details for the tasks below.**

**Current Status:**
- ✅ Module A (Ingestion) is DONE (Refactored to use `pdfjs-dist`).
- ✅ Module B (Kinetic Core) is DONE.
- ✅ Module C (Universal Renderer) is DONE.
- ✅ Module D (Saboteur) is DONE.
- ✅ Module E (Mind Garden) is DONE.
- ✅ Module F (Babel Node) is DONE.
- ✅ Module G (Reality Lens) is DONE.
- ❌ **Infrastructure (Self-Correction)** is MISSING.
- ❌ **Module K (Lab Bench)** is MISSING.
- ❌ **Module H (Metaphor Engine)** is MISSING.
- ❌ **Module I (Quest Board)** is MISSING.
- ❌ **Module L (Socratic State)** is MISSING.

**Objective:**
Implement the missing modules using the **Resilient Generation** pattern. Cross-reference `gemini.md` to ensure the code matches the "Rebel Stack" vision.

---

### EXECUTION TRACKS (Implement in Order)

#### 0. REFACTOR: AGENTIC ARCHITECTURE (Council of Agents)
*   **Reference:** "Gemini Agent Development Kit" & "Council of Agents" Strategy.
*   **Goal:** Move logic from server actions into testable Genkit Flows.
*   **Tasks:**
    1.  Create `src/lib/genkit/agents/`.
    2.  **`physicist.ts`**: Refactor `world_state.ts`. The primary logic engine.
    3.  **`artist.ts`**: The Metaphor Engine (Module H). Abstract to Voxel.
    4.  **`critic.ts`**: The Saboteur Gatekeeper (Module D/L). Socratic filter.
    5.  **`orchestrator.ts`**: The "Council" Boss. Handles Sequential/Parallel execution.
*   **Workflow:** Use `genkit flow:run` for terminal testing.

#### 1. INFRASTRUCTURE: THE "OPENCODE" GENERATOR (Self-Healing)
*   **Reference:** See "OpenCode" discussion in `gemini.md`.
*   **Task:** Create `src/lib/genkit/resilience.ts`.
*   **Logic:** Implement `generateWithResilience({ prompt, schema, retryCount })`:
    1.  **Tier 1:** Attempt `gemini-2.5-flash-lite`.
    2.  **Fallback:** If 429/500 Error, retry with `gemini-2.5-flash`.
    3.  **Self-Correction Loop:** Parse result with Zod. If it fails, feed the error back to the AI and retry.
    4.  **Why:** Stops the app from crashing on bad JSON.

#### 2. MODULE K: THE LAB BENCH (Scientific Accuracy)
*   **Reference:** Search `gemini.md` for `rungeKuttaStep` and `useExactPendulum`.
*   **Task:** 
    1.  Create `src/lib/physics/math.ts`: Copy the **Runge-Kutta 4** math from the chat history.
    2.  Create `src/hooks/useExactPhysics.ts`: Implement the hook logic found in `gemini.md` using `useFrame`.
    3.  Create `src/components/simulation/LabBench.tsx`: Render the "Double Pendulum" using `<Trail>` and neon aesthetics.
    4.  **Integration:** Update `Renderer.tsx` -> If `mode === 'SCIENTIFIC'`, render `<LabBench />`.

#### 3. MODULE H: THE HYBRID METAPHOR ENGINE
*   **Reference:** Search `gemini.md` for "Image to Voxel" and "Nano Banana".
*   **Task:**
    1.  Create Server Action `src/app/actions/metaphor.ts`:
        *   **Free Path:** Ask Gemini Flash for a 16x16x16 Voxel Array JSON (Minecraft style).
        *   **Premium Path:** (Stubbed) Prepare logic to call `imagen` for textures.
    2.  Create `src/components/simulation/VoxelRenderer.tsx`: Use `InstancedMesh` logic (adapted from the Google `IsoMap` code in `gemini.md`).
    3.  **Integration:** Update `Renderer.tsx` to handle `VOXEL` mode.

#### 4. MODULE I: THE QUEST BOARD
*   **Reference:** Search `gemini.md` for "Sky Metropolis" and `generateCityGoal`.
*   **Task:**
    1.  Create `src/lib/gamification/questEngine.ts`: Adapt the `generateCityGoal` logic to be `generateLearningGoal`.
    2.  Create `src/components/ui/QuestOverlay.tsx`: A UI that slides in when the user fails a simulation 3 times ("Mission: Stabilize the Bridge").

#### 5. MODULE L: THE SOCRATIC STATE
*   **Reference:** Search `gemini.md` for `slash-criticalthink` and `boardgame.io`.
*   **Task:**
    1.  Create `src/lib/multiplayer/GameState.ts`: Define the Reducer logic for future P2P syncing.
    2.  **Enhancement:** Update `src/lib/prompts/criticalThinking.ts` to use the Socratic method found in the chat history.

---

### TECHNICAL CONSTRAINTS
1.  **Use The Source:** Do not guess the implementation. Use the code provided in `gemini.md` as the base.
2.  **Error Handling:** Every AI call must use `generateWithResilience`.
3.  **No `pdf-parse`:** Strictly use the existing `pdf-processor.ts`.
4.  **Visuals:** Maintain "Cyber-Zen" aesthetics (Tailwind v4).
