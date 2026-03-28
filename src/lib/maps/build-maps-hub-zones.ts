import type { MapMeta } from '@/data/maps'
import { MAPS } from '@/data/maps'
import { getActiveConditionsForMap, type MfEvent } from '@/lib/events/conditions'
import { getEventStyle } from '@/lib/events/eventsConfig'
import type { GameMap } from '@/lib/game-data/types'
import { resolveMapThumbWithGameData } from '@/lib/maps/rfGameMapBridge'
import { getTcnoUrl } from '@/lib/maps/tcnoMaps'
import type { TcnoZoneVM } from '@/components/maps/MapsTcnoCommandCenter'

export function buildTcnoZoneVMs(
    now: Date,
    events: MfEvent[],
    gameByRfId: Map<string, GameMap>,
): TcnoZoneVM[] {
    return MAPS.map((map: MapMeta) => {
        const conditions = getActiveConditionsForMap(map.id, now, events)
        const conditionBadges = conditions.activeConditions.map((name) => {
            const style = getEventStyle(name)
            return { name, bg: style.bg, border: style.border, text: style.text }
        })
        return {
            id: map.id,
            displayName: map.displayName,
            subtitle: map.subtitle,
            description: map.description,
            thumb: map.coverImage ?? resolveMapThumbWithGameData(map, gameByRfId),
            tcnoUrl: getTcnoUrl(map.id),
            hasEvents: conditions.activeConditions.length > 0,
            conditionBadges,
        }
    })
}
