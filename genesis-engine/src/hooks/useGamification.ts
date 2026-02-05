import { useState, useCallback } from 'react';
import { SkillTreeSchema, SkillNodeSchema } from '@/lib/genkit/schemas';
import { storeKnowledge } from '@/lib/db/pglite';
import { z } from 'genkit';
import { Question } from '@/components/mastery/MasteryChallenge';
import { Quest, MASTER_QUESTS } from '@/lib/gamification/questEngine';
import { blackboard } from '@/lib/genkit/context';

type SkillTree = z.infer<typeof SkillTreeSchema>;
type SkillNode = z.infer<typeof SkillNodeSchema>; // No longer unused

interface MasteryState {
    questions: Question[];
    isChallengeOpen: boolean;
    isCrystalUnlocked: boolean;
    score: number;
    isGenerating: boolean;
}

interface GardenNode {
    id: string;
    topic: string;
    lastReviewDate: number;
    health: number;
}

interface GardenState {
    nodes: GardenNode[];
}

import { useGenesisStore } from '@/lib/store/GenesisContext';

export function useGamification() {
    const { state, dispatch } = useGenesisStore();
    const { quests, currentQuestId } = state;

    // --- Mastery OS / Skill Tree ---
    const [skillTree, setSkillTree] = useState<SkillTree | null>(null);
    const [activeNode, setActiveNode] = useState<SkillNode | null>(null);
    const [completedNodeIds, setCompletedNodeIds] = useState<string[]>([]);

    // --- Quest & Gamification ---
    const [failureCount, setFailureCount] = useState(0);

    // --- Mastery Features ---
    const [masteryState, setMasteryState] = useState<MasteryState>({
        questions: [],
        isChallengeOpen: false,
        isCrystalUnlocked: false,
        score: 0,
        isGenerating: false,
    });

    // --- Mind Garden ---
    const [gardenState, setGardenState] = useState<GardenState>({
        nodes: []
    });

    const setActiveQuest = useCallback((quest: Quest | null) => {
        if (quest) {
            dispatch({ type: 'SET_QUESTS', payload: [...quests, quest] });
            dispatch({ type: 'SET_CURRENT_QUEST', payload: quest.id });
        } else {
            dispatch({ type: 'SET_CURRENT_QUEST', payload: null });
        }
    }, [dispatch, quests]);

    const setIsQuestVisible = useCallback((visible: boolean) => {
        if (!visible) dispatch({ type: 'SET_CURRENT_QUEST', payload: null });
    }, [dispatch]);

    const generateSkillTree = useCallback(async (goal: string) => {
        try {
            const response = await fetch('/api/mastery/curriculum', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    goal,
                    fileUri: state.fileUri
                }),
            });
            if (response.ok) {
                const data = await response.json();
                setSkillTree(data);

                // Persistence
                await storeKnowledge([{
                    text: `SKILL_TREE_${data.goal}`,
                    vector: Array(384).fill(0),
                    metadata: { type: 'SKILL_TREE', data }
                }]);
                localStorage.setItem('GENESIS_ACTIVE_GOAL', data.goal);
            }
        } catch (err) {
            console.error('Failed to generate skill tree', err);
            throw err;
        }
    }, []);

    const updateGardenHealth = useCallback(() => {
        setGardenState(prev => ({
            nodes: prev.nodes.map(node => {
                const daysSinceReview = (Date.now() - node.lastReviewDate) / (1000 * 60 * 60 * 24);
                const health = Math.max(0, 1.0 - (daysSinceReview * 0.1));
                return { ...node, health };
            })
        }));
    }, []);

    const trackFailure = useCallback(async () => {
        const newCount = failureCount + 1;
        setFailureCount(newCount);
        
        if (newCount >= 3) {
            console.log("[LingBot] Threshold reached (3 failures). Generating Adaptive Bridge Node...");
            blackboard.log('Architect', 'High frustration detected. Building a conceptual bridge to simplify the physics...', 'THINKING');

            try {
                // 1. Trigger the 'Adaptive Bridge' Agent (Architect Specialist)
                const response = await fetch('/api/mastery/bridge', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        currentTopic: skillTree?.goal || 'Physics',
                        failedNodeId: activeNode?.id,
                        failureContext: state.worldState?.explanation
                    }),
                });

                if (response.ok) {
                    const bridgeNode = await response.json();
                    
                    // 2. MORPH THE SKILL TREE: Inject the bridge node
                    if (skillTree) {
                        const newNodes = [...skillTree.nodes, bridgeNode];
                        const newPath = [...skillTree.recommendedPath];
                        const activeIdx = newPath.indexOf(activeNode?.id || '');
                        
                        // Insert before the failed node
                        if (activeIdx !== -1) {
                            newPath.splice(activeIdx, 0, bridgeNode.id);
                        } else {
                            newPath.unshift(bridgeNode.id);
                        }

                        setSkillTree({
                            ...skillTree,
                            nodes: newNodes,
                            recommendedPath: newPath
                        });

                        blackboard.log('Astra', `I've added a new step: "${bridgeNode.label}" to help you master this. Let's try it first!`, 'SUCCESS');
                    }
                }
            } catch (e) {
                console.warn("Adaptive bridge failed.");
            }
            
            setFailureCount(0);
        }
    }, [failureCount, skillTree, activeNode, state.worldState]);

    return {
        skillTree,
        activeNode,
        setActiveNode,
        completedNodeIds,
        setCompletedNodeIds,
        activeQuest: quests.find(q => q.id === currentQuestId) || null,
        setActiveQuest,
        isQuestVisible: !!currentQuestId,
        setIsQuestVisible,
        masteryState,
        setMasteryState,
        gardenState,
        setGardenState,
        updateGardenHealth,
        generateSkillTree,
        trackFailure
    };
}

