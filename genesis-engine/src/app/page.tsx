'use client';

import React from 'react';
import { useGenesisEngine } from '@/hooks/useGenesisEngine';
import { useLocalInterface } from '@/hooks/useLocalInterface';
import { GenesisShell } from '@/components/layout/GenesisShell';

/**
 * HOME: The Entry Point
 * Refactored (Titan Protocol v3.6):
 * - Clean Controller Pattern
 * - Atomic State Hooks
 * - Decoupled View Layer (GenesisShell)
 */
export default function Home() {
  const engine = useGenesisEngine();
  const localUI = useLocalInterface(engine);

  return <GenesisShell engine={engine} ui={localUI} />;
}
