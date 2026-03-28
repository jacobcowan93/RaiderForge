import { getActiveConditionsForMap, type MfEvent, type MapConditions } from '@/lib/events/conditions'

import { metaForgeApiEventSlice } from './metaForgeSlice'

/** Single entry point for map pages: respects upstream failure vs usable MetaForge rows. */
export function getLiveMapConditions(
    mapId: string,
    now: Date,
    events: MfEvent[],
    upstreamOk: boolean | null,
): MapConditions {
    return getActiveConditionsForMap(mapId, now, metaForgeApiEventSlice(events, upstreamOk))
}
