/**
 * Maps Mahcks/community `GameMap` ids (arcdata.mahcks.com / GET /api/game/maps) onto RaiderForge
 * `MapMeta.id` values. Used so thumbnails can use upstream CDN art while tiles/quests stay on RF ids.
 */

import type { MapMeta } from '@/data/maps'
import { getMapThumbnail } from '@/data/maps'
import type { GameMap } from '@/lib/game-data/types'

/** Upstream dataset ids → RaiderForge `MAPS[].id` */
export const UPSTREAM_GAME_MAP_ID_TO_RF: Record<string, string> = {
    dam_battlegrounds: 'dam-battlegrounds',
    the_spaceport: 'spaceport',
    buried_city: 'burial-city',
    the_blue_gate: 'blue-gate',
    stella_montis_upper: 'stella-montis',
    stella_montis_lower: 'stella-montis',
}

/**
 * Collapse upstream rows onto one entry per RF map (e.g. Stella upper/lower).
 * Prefers a row with `imageUrl` when merging duplicates.
 */
export function indexGameMapsByRfId(gameMaps: readonly GameMap[]): Map<string, GameMap> {
    const out = new Map<string, GameMap>()
    for (const g of gameMaps) {
        const rfId = UPSTREAM_GAME_MAP_ID_TO_RF[g.id]
        if (!rfId) continue
        const existing = out.get(rfId)
        if (!existing) {
            out.set(rfId, g)
            continue
        }
        const preferNew = Boolean(g.imageUrl?.trim()) && !existing.imageUrl?.trim()
        out.set(rfId, preferNew ? g : existing)
    }
    return out
}

/** Client-friendly thumbnail overrides from a `/api/game/maps` payload (`data.maps`). */
export function buildRfThumbnailOverrideUrls(gameMaps: readonly GameMap[]): Record<string, string> {
    const idx = indexGameMapsByRfId(gameMaps)
    const record: Record<string, string> = {}
    idx.forEach((g, rfId) => {
        const u = g.imageUrl?.trim()
        if (u) record[rfId] = u
    })
    return record
}

/** Card/listing thumbnail: upstream image when mapped + URL present, else RF static (cover → image → floors). */
export function resolveMapThumbWithGameData(map: MapMeta, gameByRfId: Map<string, GameMap>): string {
    const g = gameByRfId.get(map.id)
    const u = g?.imageUrl?.trim()
    if (u) return u
    return getMapThumbnail(map)
}

/** Tactical map detail hero: canonical zone cover first, then CDN / static chain. */
export function resolveMapHeroThumb(map: MapMeta, gameByRfId: Map<string, GameMap>): string {
    return map.coverImage ?? resolveMapThumbWithGameData(map, gameByRfId)
}
