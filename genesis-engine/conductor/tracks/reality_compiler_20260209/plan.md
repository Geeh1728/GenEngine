# MISSION: GENESIS ENGINE - THE REALITY COMPILER (v21.0)

**Context:**
We are upgrading the engine from a "Passive Reader" to an "Active Reality Compiler". The goal is to transform static text (PDFs) into dynamic, interactive ECS (Entity Component System) simulations with strict physics verification.

**Objective:**
Implement the "Text-to-ECS" compiler, "Living Exam" mode, and "Sentinel Physics Lawyer".

### EXECUTION TRACKS

#### 1. THE TEXT-TO-ECS COMPILER (Dual-Brain Architecture)
*   **Target:** `src/lib/genkit/ingestion.ts` & `src/lib/genkit/schemas.ts`
*   **Logic:**
    *   **Gemini 3 Flash (The Visionary):** Extracts visual rules and entity descriptions.
    *   **DeepSeek-R1 (The Mathematician):** Extracts mathematical formulas and physical constants.
    *   **Synthesis:** Merges outputs into a strict `SimConfig` JSON structure (Entities + Components).
*   **Outcome:** PDF upload -> Playable Simulation (e.g., "Ethanol" entity with `BoilingPoint` component).

#### 2. THE SENTINEL PHYSICS LAWYER
*   **Target:** `src/app/actions/sentinel.ts`
*   **Logic:**
    *   Validates user actions against the *ingested PDF rules*.
    *   If a user violates a rule (e.g., boiling point), the Sentinel cites the specific PDF page/question.
*   **Outcome:** "Violation Detected: Grade 10 Physical Sciences P2 (Q3.1) states boiling point is 78.37°C."

#### 3. LIVING EXAM MODE (Gamification)
*   **Target:** `src/lib/genkit/mastery_agent.ts`
*   **Logic:**
    *   Parses exam questions (e.g., "Question 3.5").
    *   Instantiates a `LabBench` scene pre-loaded with relevant chemicals/tools.
    *   Sets the "Win Condition" to replicating the phenomenon described in the question.
*   **Outcome:** Static exam papers become interactive challenges.

**Goal:**
The Genesis Engine now compiles reality directly from knowledge, verified by strict logic.
