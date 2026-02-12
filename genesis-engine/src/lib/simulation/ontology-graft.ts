// Local type definition to avoid server-side schema imports
interface WorldRule {
    id: string;
    rule: string;
    description: string;
    grounding_source?: string;
    isActive: boolean;
}

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
