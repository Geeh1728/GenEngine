import { useEffect, useRef, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import { useGenesisStore } from '@/lib/store/GenesisContext';
import { analyzeStructuralIntegrity } from '@/app/actions/sentinel';

/**
 * useSentinel: Proactive Visual Critique Hook
 * Objective: Captures canvas snapshots and feeds the Agentic Sentinel.
 */
export function useSentinel() {
    const { state, dispatch } = useGenesisStore();
    const { gl, scene, camera } = useThree();
    const lastAnalysisTime = useRef<number>(0);
    const isAnalyzing = useRef<boolean>(false);

    const performAnalysis = useCallback(async () => {
        if (isAnalyzing.current || !state.worldState || state.isProcessing) return;
        
        const now = Date.now();
        if (now - lastAnalysisTime.current < 5000) return; // Limit to every 5 seconds

        isAnalyzing.current = true;
        try {
            // 1. Capture Canvas Snapshot
            gl.render(scene, camera);
            const snapshot = gl.domElement.toDataURL('image/jpeg', 0.5);

            // 2. Prepare Scene Context
            const sceneState = `
                SCENARIO: ${state.worldState.scenario}
                ENTITIES: ${state.worldState.entities?.map(e => `${e.type} at [${e.position.x.toFixed(1)}, ${e.position.y.toFixed(1)}]`).join(', ')}
            `;

            // 3. Consult the Visual Sentinel
            const result = await analyzeStructuralIntegrity(snapshot, sceneState);

            if (result.success) {
                dispatch({ type: 'SET_HEATMAP', payload: result.heatmap });
                
                if (result.heatmap.overallStability < 40) {
                    dispatch({ 
                        type: 'ADD_MISSION_LOG', 
                        payload: { 
                            agent: 'Sentinel', 
                            message: `Warning: Structural integrity critical (${result.heatmap.overallStability}%). Check heatmap for failure points.`, 
                            type: 'ERROR' 
                        } 
                    });
                }
            }
        } catch (error) {
            console.error('[Sentinel Hook] Analysis failed:', error);
        } finally {
            isAnalyzing.current = false;
            lastAnalysisTime.current = Date.now();
        }
    }, [gl, scene, camera, state.worldState, state.isProcessing, dispatch]);

    useEffect(() => {
        const interval = setInterval(performAnalysis, 5000);
        return () => clearInterval(interval);
    }, [performAnalysis]);

    return null;
}
