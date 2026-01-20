# Implementation Plan - Genesis Engine Core

## Phase 1: Foundation & Indexing
- [ ] Initialize Genkit configuration (`genkit.config.ts`).
- [ ] Set up Gemini 2.0 Flash and File Search API credentials.
- [ ] Create an API route `api/ingest` to handle PDF uploads and indexing.

## Phase 2: Genkit Flow & Extraction
- [ ] Define the `simulationFlow` in Genkit.
- [ ] Implement logic to extract simulation rules from the indexed PDF.
- [ ] Define the `SimulationCard` interface and Generative UI schema.

## Phase 3: Generative UI & Interaction
- [ ] Create the `SimulationCard` React component in Next.js.
- [ ] Integrate Genkit's Generative UI components to render the card dynamically.
- [ ] Implement user action handling (e.g., button clicks) that loops back to the Genkit flow.

## Phase 4: Model Armor & Verification
- [ ] Implement a verification layer that checks every simulation action against the retrieved PDF chunks.
- [ ] Display "Verified" badges or source citations on the UI.
