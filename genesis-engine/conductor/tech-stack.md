# Technology Stack - Genesis Engine

## Core Framework
- **Frontend/Backend**: [Next.js](https://nextjs.org/) (App Router, TypeScript)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animation**: [Framer Motion](https://www.framer.com/motion/)

## AI & Intelligence
- **GenAI Framework**: [Google Genkit](https://firebase.google.com/docs/genkit)
- **Models**: 
- **Gemini 2.5 Flash**: The primary reasoning and multimodal engine.
- **Gemini Robotics ER 1.5**: Spatial understanding and 3D bounding boxes.
- **Google text-embedding-004**: For RAG and semantic search.
- **Retrieval**: PGLite (Postgres WASM) for local-first vector search.
- **Verification**: Socratic Critic Agent + Model Armor principles.

## Physics & Simulation
- **3D Engine**: [React Three Fiber](https://r3f.docs.pmnd.rs/getting-started/introduction)
- **Game Physics**: [Rapier.js](https://rapier.rs/)
- **Scientific Kernel**: Custom RK4 (Runge-Kutta 4th Order) numerical solver for exact Lagrangian dynamics.

## Infrastructure
- **Deployment**: Vercel (Free Tier)
- **State Management**: React Hooks + Local Reducers for P2P Socratic Syncing.

