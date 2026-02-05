# Genesis Engine: Aether-Logic Master Design Prompt

**Identity:** "Sovereign Aether-Logic" - A high-fidelity, futuristic interface for an AI-integrated 3D simulation engine. The vibe is "Glass & Neural Light," blending Sovereign Tech aesthetics with liquid-smooth interactivity.

## 1. Global Atmosphere & Styling
*   **Background:** Dynamic "Neural Void." Deep Indigo (#020617) shifting into Obsidian (#000000). Use subtle CSS radial-gradients or an animated canvas backdrop with faint, drifting violet nebulae.
*   **Materiality:** "Glassmorphism 2.0." Components use ultra-heavy backdrop blurs (`backdrop-blur-xl`), semi-transparent surfaces (`bg-white/5`), and razor-thin borders (`border-white/10`).
*   **Color Palette:**
    *   **Logic (Primary):** Cyan-500 (#06B6D4) for active states and technical data.
    *   **Creativity (Secondary):** Violet-500 (#8B5CF6) for agent interactions.
    *   **Stability (Accent):** Emerald-400 (#10B981) for success indicators.
*   **Typography:** 
    *   `Inter` for primary UI (tight tracking, semi-bold headings).
    *   `JetBrains Mono` for agentic streams and system telemetry.

## 2. Structural Components

### A. The Omni-Intent Portal (Bottom Dock)
*   A sleek, floating capsule centered at the bottom.
*   **Visuals:** Frosted glass, cyan inner glow when focused.
*   **Input:** "Manifest Intent..." placeholder.
*   **Iconography:** A morphing SVG icon on the left (Logic/Vision/Chat based on context).

### B. The Council Constellation (Agent HUD)
*   Top-right floating panel visualizing Astra (Companion), Physicist, and Librarian.
*   **Layout:** Circular "Orbit" layout.
*   **Activity Glow:** When an agent speaks, its icon scale increases with a soft violet pulse.

### C. The Reality Lens (Main Canvas)
*   The central viewport should appear as a "cutout" through the UI glass, showing a 3D grid world.
*   **Overlay:** A subtle scanning scanline effect (low opacity) over the 3D viewport.

### D. Jedi Mastery Feedback (Diegetic Progress)
*   Bottom-left HUD showing "Voxel" icons for locked/unlocked capabilities.
*   Unlocked tools glow with "Aetheric" light (cyan/violet gradient).

## 3. Implementation Instructions (Tailwind/Code)
*   Use `group-hover` for intricate nested transitions.
*   Incorporate `animate-pulse` on active data streams.
*   Ensure full mobile responsiveness with bottom-up drawers for detail panels.
*   Apply `tracking-tighter` to all large headings for that premium technical feel.
