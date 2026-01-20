# Track: Core Intelligence Layer - Knowledge to Simulation

**Mission:** Implement the Core Intelligence Layer of the Genesis Engine.
**Objective:** Build a high-performance Genkit flow that transforms static source material into a playable world state.

## Technical Specifications

### 1. TOOL INTEGRATION
- **Goal:** Extract and implement 'File Search' and 'YouTube Transcript' logic patterns as modular utilities.
- **Location:** `/src/lib/tools`
- **Implementation:**
  - Create standalone, modular utilities.
  - Use **Gemini File Search API** as the primary grounded knowledge source.
  - *Reference:* Google Agent Starter Pack samples (for pattern only).

### 2. LOGIC & STATE (The World Model)
- **Goal:** Create a structured representation of the simulation world.
- **Schema:**
  - Create a **Zod-validated schema** for `WorldState`.
  - Must include:
    - `PhysicalRules`
    - `ActiveEntities`
    - `CausalLoops`
- **Flow:** `generateSimulationLogic`
  - a) Query File Search API for core concepts.
  - b) Instruct Gemini 3 Pro to translate concepts into JSON configuration for 2D/3D simulation.
  - c) **Grounding:** Every rule must have a specific citation from source material.

### 3. UNBREAKABLE ARCHITECTURE (Safety First)
- **Goal:** Ensure robustness and safety.
- **Requirements:**
  - **Model Armor:** Wrap all AI calls in middleware to prevent hallucination/injection.
  - **Defensive Error Handling:** Fallback to a stable 'Safe State' on failure.
  - **Strict TypeScript:** No `any`.

### 4. GENERATIVE UI HANDOFF
- **Goal:** Prepare for visual rendering.
- **Requirement:**
  - Design logic for a `SimulationCard` component.
  - Component must accept JSON `WorldState` and be ready for Framer Motion/Three.js.

## Constraints
- **Do NOT import the full Starter Pack project.**
- Mirror professional Tool-Calling patterns.
- Focus on transition from 'Reading Knowledge' to 'Executing Reality'.
- **Order:** Implement backend logic first, then React structure.
