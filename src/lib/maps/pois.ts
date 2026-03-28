import {
    blueGatePois,
    buriedCityPois,
    damBattlegroundsPois,
    spaceportPois,
    stellaMontisPois,
} from '@/data/pois'
import type { MapPoi, PoiCategory } from './poi-types'

export type { MapPoi, PoiCategory } from './poi-types'

/** Single registry — add new map files here as they are authored. */
export const ALL_MAP_POIS: MapPoi[] = [
    ...damBattlegroundsPois,
    ...buriedCityPois,
    ...blueGatePois,
    ...spaceportPois,
    ...stellaMontisPois,
]

export const POI_MVP_CATEGORIES: readonly PoiCategory[] = ['quest', 'container', 'key', 'extract']

export function getPoisForMap(mapId: string): MapPoi[] {
    return ALL_MAP_POIS.filter(p => p.mapId === mapId)
}

/** When the Pins layer is on, filter by enabled categories (empty set ⇒ none visible). */
export function filterPoisByCategories(pois: readonly MapPoi[], active: ReadonlySet<PoiCategory>): MapPoi[] {
    if (active.size === 0) return []
    return pois.filter(p => active.has(p.category))
}

/** Respect optional `floorIndex` for multi-floor maps. */
export function filterPoisForFloor(pois: readonly MapPoi[], floorIndex: number): MapPoi[] {
    return pois.filter(p => p.floorIndex === undefined || p.floorIndex === floorIndex)
}
