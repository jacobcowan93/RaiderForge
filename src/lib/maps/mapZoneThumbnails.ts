/**
 * Single source of truth for zone preview / cover thumbnails (command center cards, trials, heroes).
 * Paths are URL-encoded (`%20`) so Next.js `Image` and static file serving work for `ARC Raiders Maps`.
 *
 * Files live under: public/images/ARC Raiders Maps/
 */

const MAPS_DIR = '/images/ARC%20Raiders%20Maps'

/** RaiderForge `MapMeta.id` → static preview asset (covers preferred over raw map PNGs). */
export const MAP_THUMBNAIL_BY_RF_MAP_ID = {
    'dam-battlegrounds': `${MAPS_DIR}/dam_battlegrounds.png`,
    'burial-city': `${MAPS_DIR}/buried_city_cover.png`,
    spaceport: `${MAPS_DIR}/spaceport_cover.png`,
    'blue-gate': `${MAPS_DIR}/blue_gate_cover.png`,
    'stella-montis': `${MAPS_DIR}/stella_cover.png`,
} as const

export type MapZoneRfId = keyof typeof MAP_THUMBNAIL_BY_RF_MAP_ID

/** ARDB / external ids that resolve to the same RF zone thumbnail */
const THUMB_ALIASES: Record<string, MapZoneRfId> = {
    'buried-city': 'burial-city',
}

/** When a zone id is not in the shipped catalog (should be rare). */
export const UNKNOWN_ZONE_THUMBNAIL_FALLBACK = '/images/ARC_Maps.PNG'

/**
 * Encode each path segment for folders/files with spaces (or other reserved chars).
 * Safe to call on already-encoded paths (segments without `%` stay idempotent for typical ASCII paths).
 */
function encodePathSegment(seg: string): string {
    if (!seg) return seg
    try {
        return encodeURIComponent(decodeURIComponent(seg))
    } catch {
        return encodeURIComponent(seg)
    }
}

export function encodeLocalPublicPath(path: string): string {
    if (!path.startsWith('/')) return path
    return '/' + path
        .slice(1)
        .split('/')
        .map(encodePathSegment)
        .join('/')
}

/** Canonical thumbnail for a known RF map id; `undefined` if unknown (callers may use iframe/placeholder). */
export function mapCoverPath(rfMapId: string): string | undefined {
    const id = (THUMB_ALIASES[rfMapId] ?? rfMapId) as string
    if (id in MAP_THUMBNAIL_BY_RF_MAP_ID) {
        return MAP_THUMBNAIL_BY_RF_MAP_ID[id as MapZoneRfId]
    }
    return undefined
}

/** Hub/listing: always prefer shipped art; unknown ids get the global fallback image. */
export function getZoneThumbnailUrlOrFallback(rfMapId: string): string {
    return mapCoverPath(rfMapId) ?? UNKNOWN_ZONE_THUMBNAIL_FALLBACK
}
