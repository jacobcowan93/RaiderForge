// Mock MetaForge API client for ARC Raiders
// TODO: Replace with real MetaForge base URL and endpoints.

export type Marker = {
    id: string
    name: string
    description?: string
    region?: string
    coordinates?: { lat: number; lng: number }
    category: string
    rewards?: string[]
    tips?: string
}

export type Category = {
    id: string
    name: string
    type: string
}

export type GuideRoute = {
    id: string
    title: string
    difficulty: 'easy' | 'medium' | 'hard'
    description?: string
    waypoints?: { name: string; note?: string }[]
}

export type RaiderProfileSyncData = {
    raiderId: string
    clearedLocations: number
    eventsCompleted: number
    blueprintProgress: number
}

// Mock data
const mockMarkers: Marker[] = [
    {
        id: 'm-1',
        name: 'Lost Cache',
        description: 'Hidden loot cache near the ridge',
        region: 'Valley of Echoes',
        coordinates: { lat: 45.0, lng: -122.0 },
        category: 'loot',
        rewards: ['Blueprint: Plasma Injector'],
        tips: 'Bring a fast mount to reach before others.'
    },
    {
        id: 'm-2',
        name: 'Warden',
        description: 'Mini-boss encounter',
        category: 'boss',
        region: 'Steelworks',
        rewards: ['High-tier drop'],
        tips: 'Use fire damage to stagger.'
    }
]

const mockGuides: GuideRoute[] = [
    {
        id: 'g-1',
        title: 'Early-game Blueprint Run',
        difficulty: 'easy',
        description: 'Fast route optimized for blueprint drops',
        waypoints: [
            { name: 'Spawn' },
            { name: 'Lost Cache', note: 'Check north ledge' }
        ]
    }
]

export async function getMapMarkers(): Promise<Marker[]> {
    await new Promise((r) => setTimeout(r, 300))
    return mockMarkers
}

export async function getGuideRoutes(): Promise<GuideRoute[]> {
    await new Promise((r) => setTimeout(r, 300))
    return mockGuides
}

export async function getRaiderProfileSyncData(raiderId: string): Promise<RaiderProfileSyncData> {
    await new Promise((r) => setTimeout(r, 400))
    return {
        raiderId,
        clearedLocations: 24,
        eventsCompleted: 7,
        blueprintProgress: 42
    }
}
