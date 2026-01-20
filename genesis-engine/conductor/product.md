# PROJECT GENESIS: THE PROMETHEUS PROTOCOL
**Version:** 1.5.0 (The Intelligence Kernel Iteration)
**Mission:** Transform passive learning into "Inverse Construction." The user teaches the AI; the AI compiles that logic into a simulation; reality breaks if the user is wrong.

---

## 1. THE "REBEL" TECH STACK (R0 Budget / South Africa Optimized)
*   **Hosting:** Vercel (Free Tier).
*   **Framework:** Next.js 15 (App Router) + Tailwind v4 + Framer Motion ("Cyber-Zen" Aesthetic).
*   **Intelligence:** Google Genkit + Gemini API (Free Tier).
    *   *Workhorse:* `gemini-2.5-flash-lite` (High RPM, 10/min).
    *   *Intelligence/Fallback:* `gemini-2.5-flash`.
    *   *Unlimited Channel:* `gemini-2.5-flash-native-audio-dialog` (Live API).
    *   *Embeddings:* `text-embedding-004`.
*   **Database (Memory):** **PGLite** (Postgres WASM). Runs 100% in-browser. Zero cloud costs.
*   **Physics Engine:** React Three Fiber (R3F) + Rapier (Game Physics) + Custom RK4 Math (Exact Science).

---

## 2. CORE ARCHITECTURE: THE COUNCIL OF AGENTS
The backend logic is managed by a central **Orchestrator** governing specialized agents:

### MODULE F: THE BABEL AGENT (Ears)
**Goal:** Universal speech-to-meaning translation.
1.  **Input:** Web Speech API captures local language (e.g., Zulu, Xhosa).
2.  **Processing:** Translates intent into English for the physics engine and returns a native acknowledgement reply.

### MODULE G: THE VISION AGENT (Eyes)
**Goal:** Robotics-grade spatial understanding.
1.  **Input:** User uploads or captures real-world photos.
2.  **Processing:** Detects objects using a **1000x1000 normalized grid**.
3.  **Outcome:** Objects are "teleported" into the 3D scene with estimated physics properties.

### MODULE B/K: THE PHYSICIST AGENT (The Brain)
**Goal:** Intelligent compilation of intent into reality.
1.  **Dual Mode:** 
    - **PHYSICS Mode:** Generates Rapier.js rigid bodies for standard interactions.
    - **SCIENTIFIC Mode:** Detects chaotic systems (Pendulums, Orbits) and generates exact mathematical parameters for the RK4 solver.
2.  **Logic:** Obey the user's "Dumb God" hypothesis to show failure modes.

### MODULE D/L: THE CRITIC AGENT (The Gatekeeper)
**Goal:** Socratic verification and Quota Protection.
1.  **Mechanism:** Sequential guard that scans user input for logical fallacies or impossible physics.
2.  **Outcome:** Blocks invalid requests before they burn API quota, challenging the user to refine their reasoning.

### MODULE I: THE QUEST AGENT (The Game Master)
**Goal:** Dynamic challenge generation.
1.  **Trigger:** Activates on topic change or repeated simulation failure.
2.  **Mechanism:** Generates bite-sized missions with precise physical win conditions to guide mastery.

---

## 3. INFRASTRUCTURE: SELF-HEALING KERNEL
*   **Resilience Layer (`resilience.ts`):** Implements a **Socratic Feedback Loop**.
*   **Self-Correction:** If an agent generates invalid JSON, the Zod error is fed back to the model ("You made a syntax error: [Error]. Fix it.") for an immediate retry.
*   **Model Tiering:** Automatically starts with *Lite* models and falls back to *Pro* only when needed.

---

## 4. SCIENTIFIC KERNEL: THE LAB BENCH
*   **Numerical Integration:** Implements the **Runge-Kutta 4 (RK4)** method for solving complex differential equations.
*   **Performance:** A specialized `useExactPhysics` hook runs the math kernel inside the `useFrame` loop, ensuring 60FPS accuracy for chaotic systems like the Double Pendulum.

---

## 5. DATA STRUCTURES (The DNA)

**`src/lib/simulation/schema.ts` (WorldStateSchema):**
```typescript
z.object({
  scenario: z.string(),
  mode: z.enum(["PHYSICS", "METAPHOR", "SCIENTIFIC", "VOXEL"]),
  entities: z.array(EntitySchema).optional(), // Rapier objects
  scientificParams: z.object({ // Exact math params
    l1: z.number(), m1: z.number(), g: z.number(), 
    initialState: z.array(number) 
  }).optional(),
  constraints: z.array(z.string()), 
  successCondition: z.string()
})
```




