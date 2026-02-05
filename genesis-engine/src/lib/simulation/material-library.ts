export const MATERIAL_PHYSICS: Record<string, { density: number; friction: number; restitution: number }> = {
    STEEL: { density: 7850, friction: 0.2, restitution: 0.1 },
    RUBBER: { density: 1100, friction: 0.9, restitution: 0.8 },
    WOOD: { density: 600, friction: 0.5, restitution: 0.3 },
    PLASTIC: { density: 950, friction: 0.4, restitution: 0.4 },
    GLASS: { density: 2500, friction: 0.1, restitution: 0.05 },
    CONCRETE: { density: 2400, friction: 0.6, restitution: 0.1 },
    FOAM: { density: 50, friction: 0.8, restitution: 0.2 },
    FABRIC: { density: 300, friction: 0.7, restitution: 0.05 },
};

export function getPhysicsForMaterial(material?: string) {
    if (!material) return null;
    const key = material.toUpperCase();
    return MATERIAL_PHYSICS[key] || null;
}
