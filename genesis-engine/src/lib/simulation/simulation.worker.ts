/**
 * THE LOGIC BUBBLE (Titan v5.0)
 * Objective: Execute AI-generated math in a secure, non-DOM environment.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let stepFunc: any = null;

self.onmessage = (e) => {
    const { type, code, entities, time } = e.data;

    if (type === 'INIT') {
        try {
            // Compile the AI's math function
            // The AI provides a function: (entities, time) => { ... return entities; }
            stepFunc = new Function('entities', 'time', code);
            self.postMessage({ type: 'READY' });
        } catch (err) {
            self.postMessage({ type: 'ERROR', error: (err as Error).message });
        }
    }

    if (type === 'STEP' && stepFunc) {
        try {
            // Run the math loop
            const nextEntities = stepFunc(entities, time);
            
            // Return only the necessary transform data (Coordinates)
            const transforms = nextEntities.map((ent: any) => ({
                id: ent.id,
                position: ent.position,
                rotation: ent.rotation
            }));

            self.postMessage({ type: 'TRANSFORMS', transforms });
        } catch (err) {
            self.postMessage({ type: 'ERROR', error: (err as Error).message });
        }
    }
};
