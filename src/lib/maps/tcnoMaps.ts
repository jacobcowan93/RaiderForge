/**
 * Central TroubleChute (maps.tcno.co) URLs — single place to tweak paths and query params (e.g. difficulty).
 */

export interface TcnoZone {
    id: string
    name: string
    /** Matches RaiderForge `MAPS[].id` for hub / tactical integration */
    slug: string
    tcnoUrl: string
    thumbnail?: string
}

export const TCNO_ZONES: TcnoZone[] = [
    {
        id: 'dam',
        name: 'Dam Battlegrounds',
        slug: 'dam-battlegrounds',
        tcnoUrl: 'https://maps.tcno.co/arc/dam?difficulty=Normal',
    },
    {
        id: 'buried',
        name: 'Buried City',
        slug: 'burial-city',
        tcnoUrl: 'https://maps.tcno.co/arc/buried?difficulty=Normal',
    },
    {
        id: 'spaceport',
        name: 'Spaceport',
        slug: 'spaceport',
        tcnoUrl: 'https://maps.tcno.co/arc/spaceport?difficulty=Normal',
    },
    {
        id: 'bluegate',
        name: 'Blue Gate',
        slug: 'blue-gate',
        tcnoUrl: 'https://maps.tcno.co/arc/bluegate?difficulty=Normal',
    },
    {
        id: 'stella',
        name: 'Stella Montis',
        slug: 'stella-montis',
        tcnoUrl: 'https://maps.tcno.co/arc/stella?difficulty=Normal',
    },
]

const FALLBACK_ARC = 'https://maps.tcno.co/arc'

/**
 * Resolve a RaiderForge map id (e.g. dam-battlegrounds), short tcno id (e.g. dam), or slug.
 */
export function getTcnoUrl(zoneIdOrSlug: string): string {
    const z = TCNO_ZONES.find((e) => e.id === zoneIdOrSlug || e.slug === zoneIdOrSlug)
    return z?.tcnoUrl ?? FALLBACK_ARC
}

export function getZoneBySlug(slug: string): TcnoZone | undefined {
    const k = slug.trim().toLowerCase()
    return TCNO_ZONES.find((z) => z.slug === k || z.id === k)
}
