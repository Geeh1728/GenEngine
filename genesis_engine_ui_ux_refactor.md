# Genesis Engine UI/UX Refactor: The "Aether-Logic" System

**Prompt Strategy:** This document defines the "Master Design Prompt" for the Genesis Engine. It establishes the "Aether-Logic" design system, global atmosphere, and specific intelligent UI components. Use this as the foundational instruction for the design architect.

---

## 1. System Identity: "Aether-Logic"
**Vibe:** High-end, Futuristic, 2030 Sovereign Tech, "Glass & Neural Light".

*   **Atmosphere:**
    *   **Background:** Deep, animated neural shaders. Subtle, shifting gradients of deep indigo, void black, and faint violet. Not static—alive.
    *   **Materiality:** "Glassmorphism 2.0". Heavy use of backdrop blurs (`backdrop-filter: blur(20px)`), ultra-thin white borders (`border-white/10`), and subtle noise textures to ground the digital elements.
*   **Color Palette:**
    *   **Base:** Void Black (`#020205`), Deep Indigo (`#0F172A`).
    *   **Accents:** Neon "Neural" Colors—Cyan (`#06B6D4`) for logic, Violet (`#8B5CF6`) for creativity, Emerald (`#10B981`) for success/stability.
    *   **Text:** High-contrast White for headings, muted Grey-Blue (`#94A3B8`) for secondary text.
*   **Typography:**
    *   **Headings:** `Inter` (Variable, tight tracking). Clean, authoritative.
    *   **Code/Data:** `JetBrains Mono`. Technical, precise, used for the "Agentic" elements and data streams.

## 2. Core UX Components (The "Intelligence" Layer)

### A. The Omni-Intent Field
*   **Concept:** A search bar that is not a static input, but a "living" portal.
*   **Behavior:**
    *   **Idle:** A sleek, glass capsule pulsing gently.
    *   **Active (Typing):** Morphs shape.
        *   *Typing "Physics":* Glows Cyan, corners sharpen.
        *   *Typing "Vision":* Glows Violet, expands to show a "Lens" icon.
        *   *Typing "Chat":* Softens, glows White.
*   **Visuals:** Floating label "Manifest Intent...", micro-interactions on focus.

### B. The Council Visualization
*   **Concept:** Visualizing the multi-agent swarm (Astra, Physicist, Librarian).
*   **Layout:** Not just a list. A 3D-implies "Orbit" or "Constellation" layout.
*   **Animation:**
    *   **"Neural Traces":** When agents are thinking/working, draw fine, animated lines (SVG/Canvas) connecting their icons to the center of the screen (the 3D world).
    *   **Status:** Agents glow brighter when active, dim when idle.

### C. The Reality Lens (Portal Effect)
*   **Concept:** The transition between 2D UI and 3D Simulation.
*   **Animation:** "Pixel-Dissolve". When scanning or selecting an object, the UI overlay shouldn't just fade. It should "dissolve" into digital dust/pixels, revealing the 3D world underneath, then reform. A shader-based transition.

### D. Agentic Feedback (Audio-Reactive HUD)
*   **Concept:** The UI listens to Astra.
*   **Behavior:** Bind the global UI opacity or specific "glow" layers to the audio amplitude of Astra's voice.
    *   *Astra Speaks:* The HUD borders pulse in sync.
    *   *Silence:* The UI remains steady.
*   **Implementation:** A subtle `box-shadow` or `border-color` transition linked to the audio visualizer hook.

### E. Jedi Mastery HUD
*   **Concept:** Gamified progress that feels diegetic.
*   **Visuals:**
    *   **Locked Tools:** Represented by "Voxel" icons (cubes) that are dim and locked behind a "glitch" effect or padlock.
    *   **Unlock:** When mastery is gained, the Voxel "assembles" into the high-fidelity tool icon with a burst of light.

## 3. Layout & Structure (Responsive "Sovereign Mobile")

*   **Global Layout (`layout.tsx`):**
    *   **Z-Index Strategy:**
        *   Layer 0: 3D Simulation (Canvas).
        *   Layer 1: "Neural Atmosphere" (Gradient/Shader Overlay).
        *   Layer 2: Glass UI (HUD, Sidebar, Omni-Field).
    *   **Mobile First:**
        *   Controls are thumb-accessible (bottom arcs or floating action buttons).
        *   Panels slide up from the bottom (Drawers) with heavy blur, rather than sidebar overlays, on small screens.

---

**Implementation Prompt for Stitch:**
"Create a high-fidelity, futuristic UI design for the 'Genesis Engine'. The aesthetic is 'Aether-Logic'—dark mode, deep glassmorphism, and neon neural accents.
1.  **Background:** Abstract, animated dark nebula.
2.  **Navigation:** A floating, glass 'Omni-Bar' at the bottom center.
3.  **Sidebar:** A collapsible, frosted-glass panel on the right for 'God Mode' controls.
4.  **Main Feature:** A central 'Omni-Intent Field' that glows cyan.
5.  **Font:** Inter for UI, JetBrains Mono for data.
6.  Ensure the layout is responsive, prioritizing mobile ergonomics."
