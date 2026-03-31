/**
 * Curated map POIs — RaiderForge-owned coordinates and metadata.
 * Upstream APIs (ARDB, MetaForge) may enrich via questIds / itemIds; they do not own placement.
 */

export type PoiCategory =
    | 'extract'
    | 'key'
    | 'quest'
    | 'container'
    | 'loot'
    | 'nature'
    | 'arc'
    | 'interaction'
    | 'noise'
    | 'area'

/** Supported in-raid difficulty variants for ARC Raiders. */
export type Difficulty =
    | 'Normal'
    | 'Night'
    | 'Storm'
    | 'Lush Blooms'
    | 'Uncovered Caches'
    | 'Cold Snap'
    | 'Hurricane'
    | 'Bird City'
    | 'Tower Loot'

export type MapPoi = {
    id: string
    mapId: string
    name: string
    category: PoiCategory
    /** Optional exact icon key when this POI should use a specific sourced icon rather than category fallback. */
    iconKey?: string
    /** Horizontal position, percent from left of the tactical map (0–100). */
    x: number
    /** Vertical position, percent from top of the tactical map (0–100). */
    y: number
    description?: string
    foundIn?: string[]
    itemIds?: string[]
    questIds?: string[]
    tags?: string[]
    isTemporary?: boolean
    /**
     * Multi-floor maps (e.g. Stella): tile layer index aligned with `MapMeta.floors` / `activeFloor`.
     * Omit to show on every floor.
     */
    floorIndex?: number
    /**
     * If set, this POI is only shown when one of these difficulties is active.
     * Omit to show in all difficulties.
     */
    difficulties?: Difficulty[]
}
