# Technology Stack - Genesis Engine

## Core Framework
- **Frontend/Backend**: [Next.js](https://nextjs.org/) (v16, App Router, TypeScript)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animation**: [Framer Motion](https://www.framer.com/motion/)

## AI & Intelligence
- **GenAI Framework**: [Google Genkit](https://firebase.google.com/docs/genkit)
- **Platinum Swarm (v20.7)**: 
  - **Gemini 3 Flash**: Primary reasoning and parallel orchestration.
  - **DeepSeek-R1 Full**: Symbolic math and logic verification.
  - **Molmo 2 8B**: High-precision robotics-grade spatial mapping.
  - **LiquidAI LFM-2.5**: Dynamic system stability analysis.
  - **Kimi K2.5**: Long-context textbook retrieval and peer review.
- **Universal Instrument Forge**: Physics-primitive based instrument compilation.
- **Google text-embedding-004**: Primary vector search engine.
- **Retrieval**: PGLite (Postgres WASM) + **Titan Disk (OPFS)** for high-speed local persistence.

## Physics & Simulation
- **3D Engine**: [React Three Fiber](https://r3f.docs.pmnd.rs/getting-started/introduction)
- **Physics Kernel**: **Ghost Kernel** (Multi-threaded Worker) using Rapier.js and SharedArrayBuffer.
- **Scientific Kernel**: Custom RK4 (Runge-Kutta 4th Order) numerical solver.
- **Omni-Shader Engine**: AI-generated GLSL for neural field visualizations.

## Infrastructure
- **Deployment**: Vercel (Edge Runtime enabled)
- **Iron Shield**: Secure Vercel Edge Proxy for WebSocket tunneling.
- **Ghost Mesh**: Serverless P2P synchronization via Yjs and WebRTC.

