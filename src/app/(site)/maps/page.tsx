import Link from 'next/link'
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
    // Parallel fetches — all fail gracefully. Game maps use the same provider as GET /api/game/maps.
    const [events, ardbQuests, gameMaps] = await Promise.all([
        fetchMfEventsSchedule().catch(() => []),
        fetchArdbQuests().catch(() => []), // 30-min cache, used for quest count badges
        getGameDataProvider()
            .getMaps()
            .catch((err) => {
                console.warn('[maps] game-data getMaps failed (pipeline: /api/game/maps)', err)
                return []
            }),
    ])

    const gameByRfId = indexGameMapsByRfId(gameMaps)

    // Build quest-count-per-map from ARDB data
    const questCountByMap: Record<string, number> = {}
    for (const q of ardbQuests) {
        for (const m of q.maps ?? []) {
            questCountByMap[m.id] = (questCountByMap[m.id] ?? 0) + 1
        }
    }

    const now = new Date()

    const zones: MapZoneHubDTO[] = MAPS.map((map) => {
        const conditions = getActiveConditionsForMap(map.id, now, events)
        const conditionBadges = conditions.activeConditions.map((name) => {
            const style = getEventStyle(name)
            return { name, bg: style.bg, border: style.border, text: style.text }
        })
        return {
            id: map.id,
            displayName: map.displayName,
            subtitle: map.subtitle,
            thumb: resolveMapThumbWithGameData(map, gameByRfId),
            risk: map.risk,
            hasEvents: conditions.activeConditions.length > 0,
            conditionBadges,
            questCount: questCountByMap[map.id] ?? 0,
            containerCount: (CONTAINERS_BY_MAP[map.id] ?? []).length,
            featuresLine: map.features.slice(0, 2).join(' · '),
        }
    })

    return (
        <div className="py-14 px-6 max-w-6xl mx-auto">

            {/* ── Header ─────────────────────────────────────────────────────────
                Left-border accent with text-shadow lets the full-bleed background
                remain visible. No card overlay needed — rf-card on each map card
                handles per-item readability.  */}
            <div className="mb-10 pl-1">
                <div className="border-l-2 border-rf-red pl-5">
                    <span className="text-xs uppercase tracking-widest text-rf-red font-semibold">Operations</span>
                    <h1 className="mt-2 text-3xl font-bold text-white text-shadow-hero">Interactive tactical maps</h1>
                    <p className="mt-2.5 text-rf-textSoft text-sm max-w-xl text-shadow-hero leading-relaxed">
                        Pan and zoom ARDB map tiles, toggle quest and container layers, and track live zone conditions.
                        Same five regions as the in-game rotation: Dam Battlegrounds, Buried City, Blue Gate, Spaceport,
                        and Stella Montis.
                    </p>
                </div>
            </div>

            <div className="rf-card rounded-xl px-4 py-3.5 mb-8 border border-white/[0.06] bg-white/[0.02]">
                <p className="text-[11px] text-rf-textSoft leading-relaxed">
                    Community-run reference maps with extra POIs and keys are available at{' '}
                    <a
                        href="https://maps.tcno.co/arc"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-rf-blue hover:underline font-medium text-rf-text"
                    >
                        TroubleChute — ARC Raiders maps
                    </a>
                    . RaiderForge uses its own markers and{' '}
                    <a href="https://ardb.app" target="_blank" rel="noopener noreferrer" className="text-rf-blue hover:underline">
                        ardb.app
                    </a>{' '}
                    tiles; we do not mirror their data.
                </p>
            </div>

            <MapsTacticalZonesClient zones={zones} />

            {/* Attribution */}
            <p className="mt-12 text-[11px] text-white/20 text-shadow-hero">
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
