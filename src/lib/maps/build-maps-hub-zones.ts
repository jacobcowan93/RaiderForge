import type { MapMeta } from '@/data/maps'
import { MAPS } from '@/data/maps'
import type { MfEvent } from '@/lib/events/conditions'
import { getEventStyle } from '@/lib/events/eventsConfig'
import { buildLiveScheduleBatch, scheduleSliceByMapId } from '@/lib/live-data/schedule'
import type { GameMap } from '@/lib/game-data/types'
import { getZoneThumbnailUrlOrFallback } from '@/lib/maps/mapCovers'
import { getTcnoUrl } from '@/lib/maps/tcnoMaps'
import type { TcnoZoneVM } from '@/components/maps/MapsTcnoCommandCenter'

export function buildTcnoZoneVMs(
    now: Date,
    events: MfEvent[],
    /** Reserved for future thumb overrides; zone cards use shipped `getZoneThumbnailUrlOrFallback`. */
    _gameByRfId: Map<string, GameMap>,
    upstreamOk: boolean | null = null,
): TcnoZoneVM[] {
    const batch = buildLiveScheduleBatch(now, events, upstreamOk)
    const byId = scheduleSliceByMapId(batch)
    return MAPS.map((map: MapMeta) => {
        const slice = byId[map.id]
        const conditions = slice.conditions
        const conditionBadges = conditions.activeConditions.map((name) => {
            const style = getEventStyle(name)
            return { name, bg: style.bg, border: style.border, text: style.text }
        })
        return {
            id: map.id,
            displayName: map.displayName,
            subtitle: map.subtitle,
            description: map.description,
            /** Prefer shipped encoded covers so zone cards never depend on upstream CDN thumbnails. */
            thumb: getZoneThumbnailUrlOrFallback(map.id),
            tcnoUrl: getTcnoUrl(map.id),
            hasEvents: conditions.activeConditions.length > 0,
            conditionBadges,
            fromMetaforge: slice.fromMetaforge,
            eventEndsAtMs: conditions.eventEndsAtMs,
            conditionsSource: conditions.source,
        }
    })
}
