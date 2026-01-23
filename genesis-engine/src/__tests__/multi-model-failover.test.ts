
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ingestionFlow } from '../lib/genkit/ingestion';
import { ai } from '../lib/genkit/config';

// Mock the AI instance
vi.mock('../lib/genkit/config', () => {
    return {
        ai: {
            defineFlow: (config: any, fn: any) => fn, // Return the handler directly
            generate: vi.fn(),
        },
        geminiFlash: { name: 'googleai/gemini-2.5-flash-lite' },
        geminiPro: { name: 'googleai/gemini-2.5-flash' },
        DEEPSEEK_LOGIC_MODEL: 'openai/deepseek/deepseek-r1'
    };
});

describe('Multi-Model Ingestion Flow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should failover to DeepSeek-R1 when Gemini fails', async () => {
        const generateMock = ai.generate as any;

        generateMock.mockImplementation(async (params: any) => {
            const modelName = typeof params.model === 'string' ? params.model : params.model?.name;

            // Check if it's DeepSeek - Failover success
            if (modelName === 'openai/deepseek/deepseek-r1') {
                return {
                    output: {
                        rules: [{ id: 'deepseek-rule', rule: 'R1', description: 'From DeepSeek', grounding_source: 'DS' }],
                        metadata: { source_type: 'pdf', title: 'DeepSeek' }
                    }
                };
            }

            // Default/Gemini: Fail
            throw new Error('Gemini Timeout Simulation');
        });

        // Execute logic
        // We act as if defineFlow returned the handler function directly (due to mock)
        const result = await (ingestionFlow as any)({
            source: 'Test Content',
            sourceType: 'pdf',
        });

        expect(result.rules).toHaveLength(1);
        expect(result.rules[0].id).toBe('deepseek-rule');
    });

    it('should execute Qwen2.5-VL in parallel when images are present', async () => {
        const generateMock = ai.generate as any;

        generateMock.mockImplementation(async (params: any) => {
            const modelName = typeof params.model === 'string' ? params.model : params.model?.name;

            // Task 2: Qwen
            if (modelName === 'openai/qwen/qwen-2.5-vl-72b-instruct') {
                return {
                    output: {
                        rules: [{ id: 'qwen-rule', rule: 'Visual Rule', description: 'Seen in diagram', grounding_source: 'Image' }],
                        metadata: { source_type: 'pdf', title: 'Qwen' }
                    }
                };
            }

            // Task 1: Gemini (default) - Success
            return {
                output: {
                    rules: [{ id: 'gemini-rule', rule: 'Text Rule', description: 'Read text', grounding_source: 'Text' }],
                    metadata: { source_type: 'pdf', title: 'Gemini' }
                }
            };
        });

        const result = await (ingestionFlow as any)({
            source: 'Test Content',
            sourceType: 'pdf',
            images: ['http://example.com/diagram.jpg']
        });

        // Should have merged rules
        const ruleIds = result.rules.map((r: any) => r.id);

        expect(ruleIds).toContain('gemini-rule');
        expect(ruleIds).toContain('qwen-rule');
    });
});
