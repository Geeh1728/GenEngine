# Project Constraints: The Unbreakable Protocol
1. **TDD-First:** For every track, generate the tests (Vitest/Jest) BEFORE the implementation code.
2. **Type-Safe Flows:** All Genkit flows must use Zod schemas for input and output. No `any` types allowed.
3. **Security Shield:** Every API route must include 'Model Armor' middleware to prevent prompt injection and data leakage.
4. **Failure Proofing:** Implement 'Durable Streaming' for all simulation outputs to handle user disconnects.
5. **Rate Limiting:** Every server action must have a Redis-based rate limiter (Upstash) to prevent scaling crashes.
