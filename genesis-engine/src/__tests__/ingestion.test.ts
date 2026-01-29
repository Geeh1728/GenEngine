import { describe, it, expect } from 'vitest';
import { IngestionOutputSchema } from '../lib/genkit/schemas';

describe('Ingestion Flow', () => {
    it('should validate the world rules schema correctly', () => {
        const validData = {
            rules: [
                {
                    id: 'rule-1',
                    rule: 'Observation collapses the wave function',
                    description: 'A particle does not have a definite state until it is observed.',
                    grounding_source: 'Feynman Lectures, Page 12',
                    isActive: true
                },
            ],
            metadata: {
                source_type: 'pdf',
                title: 'Quantum Physics Intro',
            },
        };

        const result = IngestionOutputSchema.safeParse(validData);
        expect(result.success).toBe(true);
    });

    it('should fail validation with missing grounding_source', () => {
        const invalidData = {
            rules: [
                {
                    id: 'rule-1',
                    rule: 'Incomplete Rule',
                    description: 'Missing grounding source',
                },
            ],
            metadata: {
                source_type: 'pdf',
                title: 'Bad Data',
            },
        };

        const result = IngestionOutputSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
    });
});
