'use client';

import { useSentinel } from '@/hooks/useSentinel';

/**
 * SentinelManager: Invisible component to trigger the useSentinel hook
 * inside the R3F Canvas context.
 */
export const SentinelManager = () => {
    useSentinel();
    return null;
};
