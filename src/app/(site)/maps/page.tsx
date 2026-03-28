import { MAPS, PRACTICE_RANGE_OVERVIEW } from '@/data/maps'
import { CONTAINERS_BY_MAP } from '@/data/containers'
import { fetchMfEventsSchedule } from '@/api/metaforgeService'
import { fetchArdbQuests } from '@/api/ardbService'
import { getActiveConditionsForMap } from '@/lib/events/conditions'
import { getEventStyle } from '@/lib/events/eventsConfig'
import { MapsTacticalZonesClient, type MapZoneHubDTO } from '@/components/maps/MapsTacticalZonesClient'
import { getGameDataProvider } from '@/lib/game-data/provider'
import { indexGameMapsByRfId, resolveMapThumbWithGameData } from '@/lib/maps/rfGameMapBridge'

/** Cycles ARC-style accent colors across zone field-note headings (Dam → … → Practice Range). */
const arcTitleColors = [
    'text-red-500',
    'text-orange-400',
    'text-yellow-300',
    'text-sky-400',
    'text-white',
] as const

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
            description: map.description,
            features: map.features,
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
                Red rail + text-shadow; body copy stays white for contrast on tinted bg. */}
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
                        Browse all ARC Raiders zones in one place, complete with lore snippets and embedded interactive
                        maps. The in&#x2011;game layouts and POIs are powered by Wesley&apos;s excellent work at{' '}
                        <a
                            href="https://maps.tcno.co/arc"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-rf-blue hover:underline font-medium text-rf-text"
                        >
                            maps.tcno.co/arc
                        </a>
                        .
                    </p>
                </div>
            </div>

            <div className="rf-card rounded-xl px-4 py-3.5 mb-8 border border-white/[0.08] bg-black/35 backdrop-blur-sm">
                <p className="text-[11px] text-white/85 leading-relaxed">
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

            <section
                className="mt-16 border-t border-white/[0.06] pt-12 max-w-3xl"
                aria-label="Zone field notes"
            >
                <p className="text-xs uppercase tracking-widest text-rf-red/90 font-semibold mb-8 drop-shadow-sm">
                    Zone field notes
                </p>
                <div className="space-y-10">
                    {MAPS.map((m, index) => (
                        <article key={m.id}>
                            <h2
                                className={`text-4xl font-extrabold drop-shadow-lg ${
                                    arcTitleColors[index % arcTitleColors.length]
                                }`}
                            >
                                {m.displayName}
                            </h2>
                            <p className="mt-3 text-white/90 text-sm leading-relaxed">{m.description}</p>
                        </article>
                    ))}
                    <article>
                        <h2
                            className={`text-4xl font-extrabold drop-shadow-lg ${
                                arcTitleColors[MAPS.length % arcTitleColors.length]
                            }`}
                        >
                            {PRACTICE_RANGE_OVERVIEW.displayName}
                        </h2>
                        <p className="mt-3 text-white/90 text-sm leading-relaxed">
                            {PRACTICE_RANGE_OVERVIEW.description}
                        </p>
                    </article>
                </div>
            </section>

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
