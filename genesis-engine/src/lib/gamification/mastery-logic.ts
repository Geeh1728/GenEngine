import { exobrain } from '../storage/exobrain';

/**
 * JEDI APPRENTICE MODE (Progressive Unlock Logic)
 * Objective: Gate high-IQ features behind mastery milestones to prevent user overwhelm.
 * Strategy: Check Exobrain mastery score before enabling advanced agentic nodes.
 */

export enum MasteryLevel {
    YOUNGLING = 0,    // Basic Physics, Reality Lens
    PADAWAN = 100,    // Hive Swarm (Worker Bees)
    KNIGHT = 500,     // DeepMind Soul (SIMA, AlphaGeometry)
    MASTER = 1000     // Global Edge Discovery, Custom Shaders
}

export class MasteryLogic {
    public static async getUnlockedLevel(): Promise<MasteryLevel> {
        const profile = await exobrain.load();
        const score = profile.masteryScore;

        if (score >= MasteryLevel.MASTER) return MasteryLevel.MASTER;
        if (score >= MasteryLevel.KNIGHT) return MasteryLevel.KNIGHT;
        if (score >= MasteryLevel.PADAWAN) return MasteryLevel.PADAWAN;
        return MasteryLevel.YOUNGLING;
    }

    /**
     * Checks if a specific engine capability is authorized for the user.
     */
    public static async isFeatureAuthorized(feature: 'HIVE' | 'SIMA' | 'P2P'): Promise<boolean> {
        const level = await this.getUnlockedLevel();
        
        switch (feature) {
            case 'HIVE': return level >= MasteryLevel.PADAWAN;
            case 'SIMA': return level >= MasteryLevel.KNIGHT;
            case 'P2P': return level >= MasteryLevel.MASTER;
            default: return true;
        }
    }
}
