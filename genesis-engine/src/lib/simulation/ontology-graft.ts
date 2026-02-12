import { WorldRuleSchema } from '@/lib/genkit/schemas';
import { z } from 'zod';

type WorldRule = z.infer<typeof WorldRuleSchema>;

/**
 * MODULE G: ONTOLOGY GRAFTING (v30.0)
 * Objective: Blend rules from two different domains (e.g. Science + Finance).
 */
export function graftOntologies(primaryRules: WorldRule[], secondaryRules: WorldRule[]): WorldRule[] {
    console.log(`[Grafting] Merging ${primaryRules.length} primary rules with ${secondaryRules.length} secondary rules.`);
    
    // De-duplication and Priority Logic
    const combined = [...primaryRules];
    
    secondaryRules.forEach(rule => {
        if (!combined.some(r => r.rule.toLowerCase() === rule.rule.toLowerCase())) {
            combined.push({
                ...rule,
                id: `graft-${rule.id}`,
                description: `[GRAFTED]: ${rule.description}`
            });
        }
    });
    
    return combined;
}
