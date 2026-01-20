# Specification - Genesis Engine Core

## Goal
Implement a Genkit-powered system that indexes PDFs and renders interactive "Simulation Cards".

## Requirements
1.  **PDF Indexing**: Use Gemini's File Search API (or Genkit's Document indexing if applicable) to process user-uploaded PDFs.
2.  **Simulation Card**: A dynamic Generative UI component that displays rules, stats, or mechanics extracted from the PDF.
3.  **Verification**: Implement "Model Armor" logic to ensure that any state change or action in the simulation is strictly grounded in the PDF content.
4.  **Interactive Logic**: Users should be able to trigger actions on the card, which are then processed by the LLM and verified.

## User Scenarios
- User uploads a board game rulebook (PDF).
- System indexes the PDF and identifies "Combat Rules".
- System renders a "Combat Simulation Card" where the user can roll dice or select actions.
- The system confirms: "Action allowed per page 14 of the rulebook."
