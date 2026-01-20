# 🌌 Genesis Engine: The Intelligence Kernel

The Genesis Engine has been upgraded to a resilient, agent-centric intelligence platform.

### 🧪 Module K: The Lab Bench (Scientific Accuracy)
- **Math Kernel (`src/lib/physics/math.ts`)**: High-precision Runge-Kutta 4 (RK4) numerical integrator for solving Lagrangian dynamics.
- **Exact Physics Hook (`src/hooks/useExactPhysics.ts`)**: A performance-optimized hook using `useFrame` for real-time chaotic simulations with zero React overhead.
- **Lab Bench Component (`src/components/simulation/LabBench.tsx`)**: Scientific visualization of complex systems like the Double Pendulum.

### 🛡️ Infrastructure: Self-Healing Generator
- **Robust Resilience (`src/lib/genkit/resilience.ts`)**: Implements a **Socratic Feedback Loop**. If AI-generated JSON fails schema validation, the error is fed back to the model for an immediate corrective attempt.
- **Quota Protection**: All agents prioritize `gemini-2.5-flash-lite` to maximize RPM and minimize costs, with seamless failover to `gemini-2.5-flash`.

### 📜 Module I: The Quest Board
- **Quest Agent (`src/lib/genkit/agents/questAgent.ts`)**: Generates dynamic learning challenges tailored to the user's current topic.
- **Quest Overlay (`src/components/ui/QuestOverlay.tsx`)**: A cyberpunk-styled UI that automatically intervenes after repeated simulation failures to guide the user toward mastery.

### 🏛️ The Expanded Council of Agents
The backend architecture has been refactored into a modular agentic system managed by a central **Orchestrator**:
- **Babel Agent (`translator.ts`)**: Universal translator for physics intent (speech-to-meaning).
- **Vision Agent (`vision.ts`)**: Robotics-grade spatial understanding using a 1000x1000 normalized grid.
- **Physicist Agent (`physicist.ts`)**: Intelligent compiler that toggles between standard game physics and exact scientific math.
- **Critic Agent (`critic.ts`)**: Socratic gatekeeper that detects logical fallacies and impossible physical premises.

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
