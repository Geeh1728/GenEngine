# PROJECT GENESIS: THE PROMETHEUS PROTOCOL
**Version:** 20.7.0 (The UNIVERSAL FORGE Iteration)
**Mission:** Transform passive learning into "Inverse Construction." The user teaches the AI; the AI compiles that logic into a simulation; reality breaks if the user is wrong. Now featuring **Acoustic Synchronization** across the Ghost Mesh.

---

## 1. THE "REBEL" TECH STACK (R0 Budget / South Africa Optimized)
*   **Hosting:** Vercel (Production Ready).
*   **Framework:** Next.js 16 (App Router) + Tailwind v4 + Framer Motion ("Cyber-Zen" Aesthetic).
*   **Intelligence:** Platinum Swarm (v20.7)
    *   *Orchestrator:* Gemini 3 Flash / DeepSeek-R1 (Waterfall Routing).
    *   *Specialists:* Molmo 2 (Vision), LiquidAI (Dynamics), Kimi K2.5 (Context).
    *   *Iron Shield Proxy:* Secure Vercel Edge tunnel for Gemini Live Audio.
*   **Database (Memory):** **PGLite** (Postgres WASM). Runs 100% in-browser with OPFS (Titan Disk).
*   **Physics Engine:** Ghost Kernel (Worker-Thread) + Rapier.js + SharedArrayBuffer.

---

## 2. CORE ARCHITECTURE: THE HIVE SWARM
The system is managed by a **Hive Orchestrator** issuing parallel work orders to specialized agents:

### MODULE F: THE BABEL AGENT (Ears)
**Goal:** Universal speech-to-meaning translation.
1.  **Input:** Astra Protocol (Native Audio) via Iron Shield Proxy.
2.  **Processing:** Adaptive translation with cultural analogies.

### MODULE G: THE VISION AGENT (Eyes)
**Goal:** Robotics-grade spatial understanding.
1.  **Input:** Reality Lens (Molmo 2 / Qwen 3).
2.  **Processing:** 1000x1000 normalized grid + Kinematic Ancestry mapping.

### MODULE B/K: THE PHYSICIST AGENT (The Brain)
**Goal:** Intelligent compilation of intent into reality.
1.  **UNIVERSAL INSTRUMENT FORGE (v20.7):** Compiles ANY instrument using 4 Physics Primitives (Trigger, Tension, Impact, Valve).
2.  **Math Override:** Python-verified symbolic truth (AlphaGeometry pattern).

### MODULE A-S: ACOUSTIC SYNC (The Ghost Mesh)
**Goal:** Ephemeral audio event synchronization across peers.
1.  **Logic:** Broadcasts `AUDIO_EVENT` packets (Frequency, Amplitude, Type) to the Yjs mesh.
2.  **Result:** Zero-latency synchronized soundscapes for all participants.

### MODULE D/L: THE CRITIC AGENT (The Saboteur)
**Goal:** Socratic verification and Quota Protection.
1.  **Mechanism:** Self-Verifying logic traps using DeepSeek-R1.
2.  **Outcome:** Blocks invalid requests, challenging assumptions.

### MODULE I: THE QUEST AGENT (The Game Master)
**Goal:** Dynamic challenge generation.
1.  **Mechanism:** Action-conditioned state machines for learning goals.

---

## 3. INFRASTRUCTURE: SELF-HEALING KERNEL
*   **APEX Resilience:** Cascading waterfalls with smart-pivot on 429/500 errors.
*   **Titan Disk:** OPFS-backed PGLite for 10x faster I/O.
*   **Ghost Mesh:** Serverless P2P synchronization with 15Hz throttling.

---

## 4. SCIENTIFIC KERNEL: THE LAB BENCH
*   **Numerical Integration:** Runge-Kutta 4 (RK4) + Verlet.
*   **Omni-Shader Engine:** AI-generated GLSL for field-based visualizations.

---

## 5. DATA STRUCTURES (The DNA)

**`src/lib/simulation/schema.ts` (WorldStateSchema):**
```typescript
z.object({
  scenario: z.string(),
  mode: z.enum(["PHYSICS", "METAPHOR", "SCIENTIFIC", "VOXEL", "ASSEMBLER"]),
  entities: z.array(EntitySchema).optional(), 
  voxels: z.array(VoxelSchema).optional(),
  scientificParams: ScientificParamsSchema.optional(),
  python_code: z.string().optional(),
  custom_canvas_code: z.string().optional()
})
```




