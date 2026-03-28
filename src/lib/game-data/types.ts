/**
 * Normalized ARC Raiders game data shapes for RaiderForge.
 * Upstream providers (Mahcks, future official API) map into these types only.
 */

/** Pagination envelope for list endpoints our API exposes. */
export type GameDataPage<T> = {
    items: T[]
    total: number
    offset: number
    limit: number
    hasMore: boolean
}

export type GameItem = {
    id: string
    name: string
    description: string | null
    type: string | null
    rarity: string | null
    value: number | null
    weightKg: number | null
    stackSize: number | null
    imageUrl: string | null
    updatedAt: string | null
}

export type GameMap = {
    id: string
    name: string
    imageUrl: string | null
}

export type GameQuest = {
    id: string
    name: string
    description: string | null
    traderName: string | null
    xp: number | null
    objectiveSummary: string | null
    rewardItemIds: string[]
    previousQuestIds: string[]
    nextQuestIds: string[]
}

export type GameProject = {
    id: string
    name: string
    description: string | null
    disabled: boolean
}

export type GameSkillNode = {
    id: string
    name: string
    category: string | null
    description: string | null
    isMajor: boolean
    maxPoints: number | null
    impactedSkill: string | null
}

export type GameMapEvent = {
    id: string
    displayName: string
    category: string | null
    iconUrl: string | null
    disabled: boolean
}

/**
 * Map rotation bundle (schedule + event type catalog). Structure may evolve with upstream;
 * `schedule` / `maps` stay loosely typed so UI can opt in to specifics later.
 */
export type GameMapEventsBundle = {
    eventTypes: GameMapEvent[]
    maps: unknown
    schedule: unknown
    readme: unknown
}

