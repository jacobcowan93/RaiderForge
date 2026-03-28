/**
 * URL slugs for the /maps command center (?zone=…) and /maps/hub/[slug].
 * Aliases match TroubleChute paths where applicable (dam, buried, bluegate, …).
 */

const SLUG_TO_MAP_ID: Record<string, string> = {
    dam: 'dam-battlegrounds',
    'dam-battlegrounds': 'dam-battlegrounds',
    buried: 'burial-city',
    'burial-city': 'burial-city',
    bluegate: 'blue-gate',
    'blue-gate': 'blue-gate',
    spaceport: 'spaceport',
    stella: 'stella-montis',
    'stella-montis': 'stella-montis',
}

/** Preferred short slug for ?zone= and /maps/hub/… links */
const MAP_ID_TO_SLUG: Record<string, string> = {
    'dam-battlegrounds': 'dam',
    'burial-city': 'buried',
    'blue-gate': 'bluegate',
    spaceport: 'spaceport',
    'stella-montis': 'stella',
}

/**
 * Resolve ?zone=dam, ?zone=bluegate, full ids, etc. to a RaiderForge map id.
 */
export function resolveMapsHubZoneParam(raw: string | null | undefined): string | null {
    if (raw == null || raw === '') return null
    const k = raw.trim().toLowerCase().replace(/[\s_]+/g, '-')
    return SLUG_TO_MAP_ID[k] ?? SLUG_TO_MAP_ID[k.replace(/-/g, '')] ?? null
}

export function canonicalHubSlugForMapId(mapId: string): string {
    return MAP_ID_TO_SLUG[mapId] ?? mapId
}

export function hubUrlForMapId(mapId: string): string {
    return `/maps?zone=${encodeURIComponent(canonicalHubSlugForMapId(mapId))}`
}

export function mapsHubDedicatedPath(slug: string): string {
    return `/maps/hub/${encodeURIComponent(slug)}`
}
