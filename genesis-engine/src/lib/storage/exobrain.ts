import { titanDisk } from './titan-disk';

/**
 * THE EXOBRAIN (Module E - Persistent Persona)
 * Objective: Local storage of user-specific learning vectors and preferences.
 * Strategy: Persistent OPFS memory for Astra's empathy and Jedi difficulty scaling.
 */

interface UserProfile {
    masteryScore: number;
    completedQuests: string[];
    skillLevels: Record<string, number>;
    preferences: {
        astraTone: 'SCHOLAR' | 'PARTNER' | 'CRITIC';
        hapticEnabled: boolean;
    };
    lastActive: number;
}

const EXOBRAIN_KEY = 'exobrain_v1.json';

export class Exobrain {
    private static instance: Exobrain;
    private profile: UserProfile | null = null;

    public static getInstance() {
        if (!Exobrain.instance) {
            Exobrain.instance = new Exobrain();
        }
        return Exobrain.instance;
    }

    public async load(): Promise<UserProfile> {
        if (this.profile) return this.profile;

        const data = await titanDisk.load(EXOBRAIN_KEY);
        if (data) {
            this.profile = data as UserProfile;
        } else {
            // Initialize default profile
            this.profile = {
                masteryScore: 0,
                completedQuests: [],
                skillLevels: {},
                preferences: { astraTone: 'PARTNER', hapticEnabled: true },
                lastActive: Date.now()
            };
            await this.save();
        }
        return this.profile!;
    }

    public async save() {
        if (!this.profile) return;
        this.profile.lastActive = Date.now();
        const data = new TextEncoder().encode(JSON.stringify(this.profile));
        await titanDisk.save(EXOBRAIN_KEY, data.buffer);
    }

    public async updateMastery(points: number) {
        const profile = await this.load();
        profile.masteryScore += points;
        await this.save();
    }

    public getProfile() {
        return this.profile;
    }
}

export const exobrain = Exobrain.getInstance();
