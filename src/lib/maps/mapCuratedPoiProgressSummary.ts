import { MAPS } from '@/data/maps'
import type { MapProgressSaveV1 } from '@/lib/maps/mapProgressSave'
import { ALL_MAP_POIS, getPoisForMap } from '@/lib/maps/pois'

/** Map ids that have at least one curated `MapPoi` (derived from static data). */
export function getMapIdsWithCuratedPins(): string[] {
    const ids = new Set<string>()
    for (const p of ALL_MAP_POIS) ids.add(p.mapId)
    return [...ids].sort()
}

function displayNameForMap(mapId: string): string {
    return MAPS.find(m => m.id === mapId)?.displayName ?? mapId
}

/** Visited curated pins: keys in `slice.p` that are still present in static POI data. */
export function countVisitedCuratedPins(save: MapProgressSaveV1 | null | undefined, mapId: string): number {
    if (!save?.maps) return 0
    const valid = new Set(getPoisForMap(mapId).map(p => p.id))
    if (valid.size === 0) return 0
    const bucket = save.maps[mapId]?.p
    if (!bucket) return 0
    let n = 0
    for (const [id, v] of Object.entries(bucket)) {
        if (v === true && valid.has(id)) n++
    }
    return n
}

export type CuratedPoiMapProgressRow = {
    mapId: string
    displayName: string
    href: string
    totalPins: number
    visitedPins: number
    percent: number
}

export type CuratedPoiProgressSummary = {
    /** Distinct tactical maps that ship curated pins in static data. */
    mapsWithCuratedPins: number
    /** Sum of curated pins across those maps. */
    totalCuratedPins: number
    /** Visited pins (matched to current static ids). */
    totalVisitedPins: number
    /** Rounded overall completion for curated pins only. */
    overallPercent: number
    perMap: CuratedPoiMapProgressRow[]
}

/**
 * Build profile / dashboard stats from synced `MapProgressSaveV1`.
 * Only the `p` bucket (curated MapPoi ids) is counted — not quests, containers, or loot areas.
 */
export function summarizeCuratedPoiProgress(save: MapProgressSaveV1 | null | undefined): CuratedPoiProgressSummary {
    const mapIds = getMapIdsWithCuratedPins()
    const perMap: CuratedPoiMapProgressRow[] = []
    let totalCuratedPins = 0
    let totalVisitedPins = 0

    for (const mapId of mapIds) {
        const totalPins = getPoisForMap(mapId).length
        if (totalPins === 0) continue
        const visitedPins = countVisitedCuratedPins(save, mapId)
        totalCuratedPins += totalPins
        totalVisitedPins += visitedPins
        const percent = totalPins > 0 ? Math.min(100, Math.round((visitedPins / totalPins) * 100)) : 0
        perMap.push({
            mapId,
            displayName: displayNameForMap(mapId),
            href: `/maps/${mapId}`,
            totalPins,
            visitedPins,
            percent,
        })
    }

    const overallPercent =
        totalCuratedPins > 0 ? Math.min(100, Math.round((totalVisitedPins / totalCuratedPins) * 100)) : 0

    return {
        mapsWithCuratedPins: perMap.length,
        totalCuratedPins,
        totalVisitedPins,
        overallPercent,
        perMap,
    }
}
