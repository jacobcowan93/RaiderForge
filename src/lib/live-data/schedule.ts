/**
 * Normalized batch resolution: map MetaForge schedule + rotation fallback in one place.
 */

import { MAPS } from '@/data/maps'
import { getActiveConditionsForMap, type MfEvent, type MapConditions } from '@/lib/events/conditions'

import { shouldUseMetaForgeEventList } from './feedState'

export type MapLiveScheduleSlice = {
    mapId: string
    conditions: MapConditions
    /** True when this map's modifiers came from matching MetaForge rows. */
    fromMetaforge: boolean
}

export type LiveScheduleBatch = {
    maps: MapLiveScheduleSlice[]
    /** Upstream succeeded but returned zero events — all maps use rotation. */
    usedEmptyApiResponse: boolean
    /** Any map row is rotation-backed (includes empty-API case). */
    anyRotationFallback: boolean
}

/**
 * Resolve conditions for every RaiderForge zone in one pass.
 * Pass `events` only when MetaForge returned a non-empty list and upstream succeeded.
 */
export function buildLiveScheduleBatch(
    now: Date,
    events: MfEvent[],
    upstreamOk: boolean | null
): LiveScheduleBatch {
    const useList = shouldUseMetaForgeEventList(upstreamOk, events.length)
    const apiSlice = useList ? events : undefined
    const usedEmptyApiResponse = upstreamOk === true && events.length === 0

    const maps: MapLiveScheduleSlice[] = MAPS.map((m) => {
        const conditions = getActiveConditionsForMap(m.id, now, apiSlice)
        return {
            mapId: m.id,
            conditions,
            fromMetaforge: conditions.source === 'api',
        }
    })

    const anyRotationFallback = maps.some((row) => !row.fromMetaforge)

    return { maps, usedEmptyApiResponse, anyRotationFallback }
}

export function scheduleSliceByMapId(batch: LiveScheduleBatch): Record<string, MapLiveScheduleSlice> {
    const out: Record<string, MapLiveScheduleSlice> = {}
    for (const row of batch.maps) out[row.mapId] = row
    return out
}
