/**
 * Curated map POIs — RaiderForge-owned coordinates and metadata.
 * Upstream APIs (ARDB, MetaForge) may enrich via questIds / itemIds; they do not own placement.
 */

export type PoiCategory = 'quest' | 'container' | 'key' | 'extract'

export type MapPoi = {
    id: string
    mapId: string
    name: string
    category: PoiCategory
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
}
