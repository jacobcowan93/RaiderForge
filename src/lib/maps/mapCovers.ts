/**
 * Canonical cover art for the five ARC Raiders zones (command center, LivePanel, heroes).
 * Keys are RaiderForge route ids (`MapMeta.id`).
 *
 * Buried City: RF id and URL segment are **`burial-city`** (`/maps/burial-city`). ARDB / tiles use
 * the id `buried-city` — do not use that string as a `MAP_COVERS` key; use `mapCoverPath()` for
 * lookups so the `buried-city` alias resolves to the same asset.
 */

export const MAP_COVERS = {
    'blue-gate': '/images/ARC Raiders Maps/blue_gate_cover.png',
    'burial-city': '/images/ARC Raiders Maps/buried_city_cover.png',
    'dam-battlegrounds': '/images/ARC Raiders Maps/dam_battlegrounds.png',
    spaceport: '/images/ARC Raiders Maps/spaceport_cover.png',
    'stella-montis': '/images/ARC Raiders Maps/stella_cover.png',
} as const

export type MapCoverRfId = keyof typeof MAP_COVERS

/** ARDB / external ids that should resolve to the same cover as an RF map id. */
const MAP_COVER_ALIASES: Record<string, MapCoverRfId> = {
    'buried-city': 'burial-city',
}

export function mapCoverPath(rfMapId: string): string | undefined {
    const id = (MAP_COVER_ALIASES[rfMapId] ?? rfMapId) as MapCoverRfId
    return MAP_COVERS[id]
}
