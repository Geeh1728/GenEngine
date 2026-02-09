# Genesis Engine: The Reality Compiler

**Version 21.0 - The Text-to-ECS Revolution**

## Overview
The **Genesis Engine** is a "Reality Compiler" that transforms passive learning materials (PDFs, Exams, Photos) into interactive, physics-based simulations. It uses a **Dual-Brain** architecture (Gemini + DeepSeek) to ensure both visual fidelity and mathematical rigor.

## Key Features

### 1. Text-to-ECS Compiler
Upload a PDF (e.g., "Grade 10 Physical Sciences"). The engine automatically extracts:
*   **Visual Rules:** "Ethanol is a clear liquid."
*   **Math Constants:** "Boiling Point = 78.37°C."
*   **Result:** A playable simulation where entities behave according to the text.

### 2. Reality Lens (Robotics Vision)
Take a photo of a bridge or a messy desk. The engine scans it using **Gemini 2.5 Flash** (Spatial Mode) and teleports the objects into the 3D world as physics bodies.

### 3. Sentinel Physics Lawyer
The engine validates your actions against the ingested rules. If you try to boil Ethanol at 50°C, the **Sentinel** cites the specific exam question proving you wrong.

### 4. Living Exam Mode
Static exam papers become interactive challenges. "Question 3.5: Explain the phase change" becomes a level where you must replicate the phase change in the lab.

### 5. Universal Translator (Babel Node)
Speak in any language (Zulu, Japanese). The engine translates your **Intent** (e.g., "Make it heavier") into physics updates, allowing cross-cultural collaboration.

## Tech Stack
*   **Framework:** Next.js 16 + React 19 + Tailwind v4
*   **AI:** Google Genkit + Gemini 3 Flash / 2.5 Flash + DeepSeek-R1
*   **Physics:** React Three Fiber + Rapier.js (Worker Thread)
*   **Database:** PGLite (Postgres WASM) + OPFS

## Setup
1.  Clone the repo.
2.  `npm install`
3.  Set `GOOGLE_GENAI_API_KEY` and `OPENROUTER_API_KEY` in `.env.local`.
4.  `npm run dev`

## License
MIT