// Mock ARDB client for blueprint tracking
// TODO: Wire to real ARDB base URL and API key via process.env.ARDB_API_BASE / ARDB_API_KEY

export type Blueprint = {
    id: string
    name: string
    description?: string
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
    owned: boolean
    progress?: number
}

export type BlueprintProgressSummary = {
    total: number
    owned: number
    percentage: number
}

const mockBlueprints: Blueprint[] = [
    { id: 'bp-1', name: 'Plasma Injector', rarity: 'rare', owned: false, progress: 10 },
    { id: 'bp-2', name: 'Titan Chassis', rarity: 'epic', owned: true, progress: 100 }
]

export async function getBlueprintsForUser(userId: string): Promise<Blueprint[]> {
    await new Promise((r) => setTimeout(r, 250))
    return mockBlueprints
}

export async function getBlueprintProgressSummary(userId: string): Promise<BlueprintProgressSummary> {
    const total = mockBlueprints.length
    const owned = mockBlueprints.filter((b) => b.owned).length
    return { total, owned, percentage: Math.round((owned / total) * 100) }
}
