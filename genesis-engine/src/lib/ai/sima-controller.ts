import { Entity, Vector3 } from '../simulation/schema';
import { executeApexLoop } from '../genkit/resilience';
import { z } from 'zod';
import { blackboard } from '../genkit/context';

/**
 * MODULE SIMA: BEHAVIORAL GENERALIST (Project SIMA Heist)
 * Objective: Real-time agentic control of physics entities.
 * Strategy: Map high-level language ("Push the block") to low-level Rapier forces.
 */

export interface SimaAction {
    force: Vector3;
    torque: Vector3;
    duration: number;
}

class SimaController {
    private static instance: SimaController;

    public static getInstance() {
        if (!SimaController.instance) {
            SimaController.instance = new SimaController();
        }
        return SimaController.instance;
    }

    /**
     * Translates a natural language command into physical actions for an entity.
     */
    public async calculateAction(command: string, entity: Entity): Promise<SimaAction | null> {
        console.log(`[SIMA] Calculating action for "${entity.name}": ${command}`);
        blackboard.log('Astra', `Agentic Control: Determining how to "${command}" the ${entity.name}...`, 'THINKING');

        try {
            const result = await executeApexLoop({
                task: 'VISION', // Using vision/robotics waterfall for spatial control
                prompt: `ACT AS ROBOTICS CONTROLLER:
                Entity: "${entity.name}" at position [${entity.position.x}, ${entity.position.y}].
                Goal: "${command}"
                Physical Constraints: Mass: ${entity.physics.mass}.
                
                Calculate the necessary 3D Force and Torque vectors to achieve this goal within 1 second.
                Return JSON { force: {x,y,z}, torque: {x,y,z}, duration }.`,
                schema: z.object({
                    force: z.object({ x: z.number(), y: z.number(), z: z.number() }),
                    torque: z.object({ x: z.number(), y: z.number(), z: z.number() }),
                    duration: z.number()
                })
            });

            if (result.output) {
                blackboard.log('Astra', `Action vectors calculated. Applying physical impulse.`, 'SUCCESS');
                return result.output;
            }
        } catch (e) {
            console.error("SIMA control failed.");
        }

        return null;
    }
}

export const simaController = SimaController.getInstance();
