import { MAPS } from '@/data/maps'
import { CONTAINERS_BY_MAP } from '@/data/containers'
import { fetchMfEventsSchedule } from '@/api/metaforgeService'
import { fetchArdbQuests } from '@/api/ardbService'
import { getActiveConditionsForMap } from '@/lib/events/conditions'
import { getEventStyle } from '@/lib/events/eventsConfig'
import { MapsTacticalZonesClient, type MapZoneHubDTO } from '@/components/maps/MapsTacticalZonesClient'
import { getGameDataProvider } from '@/lib/game-data/provider'
import { indexGameMapsByRfId, resolveMapThumbWithGameData } from '@/lib/maps/rfGameMapBridge'

export default async function MapsPage() {
    // Parallel fetches — all fail gracefully.
    const [events, ardbQuests, gameMaps] = await Promise.all([
        fetchMfEventsSchedule().catch(() => []),
        fetchArdbQuests().catch(() => []),
        getGameDataProvider()
            .getMaps()
            .catch((err) => {
                console.warn('[maps] game-data getMaps failed', err)
                return []
            }),
    ])

    const gameByRfId = indexGameMapsByRfId(gameMaps)

    // Quest count per map from ARDB data
    const questCountByMap: Record<string, number> = {}
    for (const q of ardbQuests) {
        for (const m of q.maps ?? []) {
            questCountByMap[m.id] = (questCountByMap[m.id] ?? 0) + 1
        }
    }

    const now = new Date()

    const zones: MapZoneHubDTO[] = MAPS.map((map) => {
        const conditions    = getActiveConditionsForMap(map.id, now, events)
        const conditionBadges = conditions.activeConditions.map((name) => {
            const style = getEventStyle(name)
            return { name, bg: style.bg, border: style.border, text: style.text }
        })
        return {
            id:             map.id,
            displayName:    map.displayName,
            subtitle:       map.subtitle,
            description:    map.description,
            thumb:          resolveMapThumbWithGameData(map, gameByRfId),
            risk:           map.risk,
            hasEvents:      conditions.activeConditions.length > 0,
            conditionBadges,
            questCount:     questCountByMap[map.id] ?? 0,
            containerCount: (CONTAINERS_BY_MAP[map.id] ?? []).length,
            features:       map.features,
        }
    })

    return (
        <div className="py-14 px-6 max-w-5xl mx-auto">

            {/* ── Header ──────────────────────────────────────────────────────── */}
            <div className="mb-10 pl-1">
                <div className="border-l-2 border-rf-red pl-5">
                    <span className="text-xs uppercase tracking-widest text-rf-red font-semibold drop-shadow-sm">
                        Operations
                    </span>
                    <h1 className="mt-2 text-3xl font-bold tracking-tight text-white text-shadow-hero">
                        ARC Raiders{' '}
                        <span className="text-rf-red">Interactive Maps</span>
                    </h1>
                    <p className="mt-2.5 text-sm max-w-xl text-white text-shadow-hero leading-relaxed">
                        All five ARC Raiders zones with embedded interactive maps, curated POI pins, and
                        live condition tracking. Tile data provided by{' '}
                        <a
                            href="https://ardb.app"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white/55 hover:text-white/80 transition-colors underline underline-offset-2"
                        >
                            ardb.app
                        </a>
                        {'; '}community reference maps at{' '}
                        <a
                            href="https://maps.tcno.co/arc"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white/55 hover:text-white/80 transition-colors underline underline-offset-2"
                        >
                            maps.tcno.co/arc
                        </a>
                        .
                    </p>
                </div>
            </div>

            {/* ── Zone list ────────────────────────────────────────────────────── */}
            <MapsTacticalZonesClient zones={zones} />

            {/* ── Attribution ──────────────────────────────────────────────────── */}
            <p className="mt-10 text-[11px] text-white/20 text-shadow-hero">
                Live conditions via{' '}
                <a href="https://metaforge.app/arc-raiders" target="_blank" rel="noopener noreferrer"
                   className="hover:text-white/40 transition-colors">
                    MetaForge
                </a>
                {' '}· Quest data via{' '}
                <a href="https://ardb.app" target="_blank" rel="noopener noreferrer"
                   className="hover:text-white/40 transition-colors">
                    ardb.app
                </a>
                .
            </p>
        </div>
    )
}
