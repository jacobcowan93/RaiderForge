import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MAPS } from '@/data/maps'
import { CONTAINERS_BY_MAP } from '@/data/containers'
import { fetchMfEventsSchedule, fetchMfQuests } from '@/api/metaforgeService'
import { fetchArdbQuests } from '@/api/ardbService'
import { mergeQuests, filterQuestsByMap } from '@/lib/quests/questUtils'
import { getActiveConditionsForMap } from '@/lib/events/conditions'
import { getEventStyle, isMajorEvent } from '@/lib/events/eventsConfig'
import { getMapGuide } from '@/lib/maps/mapGuideContent'
import { getMetaforgeMapLootAreas } from '@/lib/maps/metaforgeMapData'
import MapImageDisplay from '@/components/MapImageDisplay'
import MapFieldGuide from '@/components/MapFieldGuide'
import { getGameDataProvider } from '@/lib/game-data/provider'
import { indexGameMapsByRfId, resolveMapThumbWithGameData } from '@/lib/maps/rfGameMapBridge'

type Props = { params: Promise<{ mapId: string }> }

const riskStyle: Record<string, { badge: string; glow: string }> = {
    Low:     { badge: 'bg-rf-green/15 text-rf-green border-rf-green/30',   glow: 'shadow-rf-green/20'  },
    Medium:  { badge: 'bg-rf-yellow/15 text-rf-yellow border-rf-yellow/30', glow: 'shadow-rf-yellow/20' },
    High:    { badge: 'bg-rf-orange/15 text-rf-orange border-rf-orange/30', glow: 'shadow-rf-orange/20' },
    Extreme: { badge: 'bg-rf-red/15 text-rf-red border-rf-red/30',          glow: 'shadow-rf-red/20'    },
}

export default async function MapDetailPage({ params }: Props) {
    const { mapId } = await params
    const map = MAPS.find(m => m.id === mapId)
    if (!map) notFound()

    // Parallel fetches — all fail gracefully. Game maps: same pipeline as GET /api/game/maps.
    const [events, mfQuests, ardbQuests, mfLootAreas, gameMaps] = await Promise.all([
        fetchMfEventsSchedule().catch(() => []),
        fetchMfQuests().catch(() => []),
        fetchArdbQuests().catch(() => []),
        getMetaforgeMapLootAreas(mapId).catch(() => []),
        getGameDataProvider()
            .getMaps()
            .catch((err) => {
                console.warn('[maps] game-data getMaps failed (pipeline: /api/game/maps)', err)
                return []
            }),
    ])

    const gameByRfId = indexGameMapsByRfId(gameMaps)

    const allMergedQuests = mergeQuests(mfQuests, ardbQuests)
    const mapQuests       = filterQuestsByMap(allMergedQuests, map.id)

    const now        = new Date()
    const conditions = getActiveConditionsForMap(map.id, now, events)
    const thumb      = resolveMapThumbWithGameData(map, gameByRfId)
    const risk       = riskStyle[map.risk]
    const hasEvents  = conditions.activeConditions.length > 0

    const questsWithPosition = mapQuests.filter(q => q.position !== null)
    const containerCount     = (CONTAINERS_BY_MAP[map.id] ?? []).length
    const guide              = getMapGuide(map.id)
    const traderBreakdown    = mapQuests.reduce<Record<string, number>>((acc, q) => {
        acc[q.traderName] = (acc[q.traderName] ?? 0) + 1
        return acc
    }, {})

    return (
        <div className="py-8 px-6 max-w-7xl mx-auto">

            {/* Breadcrumb */}
            <div className="mb-6">
                <Link
                    href="/maps"
                    className="inline-flex items-center gap-2 text-xs font-medium
                               text-white/40 hover:text-white/80
                               bg-white/5 hover:bg-white/8
                               border border-white/8 hover:border-white/15
                               rounded-full px-3 py-1.5 transition-all"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                         strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 shrink-0">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                    </svg>
                    All Zones
                </Link>
            </div>

            {/* ── Hero ─────────────────────────────────────────────────────────── */}
            <div className="relative h-72 sm:h-96 rounded-2xl overflow-hidden mb-10 bg-rf-bgSoft">
                <img src={thumb} alt={map.displayName} className="w-full h-full object-cover" />

                {/* Cinematic overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/15" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/35 via-transparent to-transparent" />

                {/* Risk badge — top right */}
                <span className={`absolute top-4 right-4 flex items-center gap-1.5
                                  text-[10px] font-bold uppercase tracking-wider
                                  border rounded-full px-3 py-1.5
                                  backdrop-blur-md shadow-lg ${risk.badge} ${risk.glow}`}>
                    {map.risk}
                </span>

                {/* Active event badges — top left */}
                {hasEvents && (
                    <div className="absolute top-4 left-4 flex flex-wrap gap-1.5">
                        {conditions.activeConditions.map(name => {
                            const style = getEventStyle(name)
                            return (
                                <span
                                    key={name}
                                    className="inline-flex items-center gap-1.5
                                               text-[11px] font-semibold
                                               rounded-full px-3 py-1
                                               backdrop-blur-md border"
                                    style={{
                                        backgroundColor: style.bg,
                                        borderColor:     style.border,
                                        color:           style.text,
                                    }}
                                >
                                    <span
                                        className="h-1.5 w-1.5 rounded-full animate-pulse shrink-0"
                                        style={{ backgroundColor: style.text }}
                                    />
                                    {name}
                                </span>
                            )
                        })}
                    </div>
                )}

                {/* Map title — bottom left */}
                <div className="absolute bottom-0 left-0 right-0 px-6 pb-6 pt-16
                                bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold mb-1.5">
                        {map.subtitle}
                    </p>
                    <h1 className="text-4xl font-black text-white tracking-tight">{map.displayName}</h1>
                </div>
            </div>

            {/* ── Content grid ─────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* ── Main column ── */}
                <div className="lg:col-span-2 space-y-5">

                    {/* Tactical Grid */}
                    <div className="rf-card rounded-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-3.5
                                        border-b border-white/5 bg-white/[0.02]">
                            <div className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                     strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 text-white/30">
                                    <path strokeLinecap="round" strokeLinejoin="round"
                                          d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
                                </svg>
                                <span className="text-xs uppercase tracking-widest text-white/40 font-semibold">
                                    Tactical Grid
                                </span>
                            </div>
                            <span className="text-[10px] text-white/20">{map.displayName}</span>
                        </div>
                        <MapImageDisplay
                            map={map}
                            mapQuests={mapQuests}
                            mfLootAreas={mfLootAreas}
                            enableFullscreen
                        />
                    </div>

                    {/* Zone Overview */}
                    <div className="rf-card rounded-2xl p-5">
                        <h2 className="text-xs uppercase tracking-widest text-white/35 font-semibold mb-3">
                            Zone Overview
                        </h2>
                        <p className="text-sm text-rf-textSoft leading-relaxed">{map.description}</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {map.features.map(f => (
                                <span key={f}
                                      className="text-xs border border-white/8 rounded-full px-3 py-1
                                                 text-white/40 bg-white/[0.03]">
                                    {f}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Field Guide — curated tactics + live intel */}
                    <MapFieldGuide
                        guide={guide}
                        mapName={map.displayName}
                        questCount={mapQuests.length}
                        questsWithPosition={questsWithPosition.length}
                        containerCount={containerCount}
                        hasEvents={hasEvents}
                        activeConditions={conditions.activeConditions}
                    />
                </div>

                {/* ── Sidebar ── */}
                <div className="space-y-4">

                    {/* Live Conditions */}
                    <div className="rf-card rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                                    hasEvents ? 'bg-rf-red animate-pulse' : 'bg-rf-green/50'
                                }`} />
                                <span className="text-xs uppercase tracking-widest text-white/40 font-semibold">
                                    Live Conditions
                                </span>
                            </div>
                            {conditions.source === 'rotation-fallback' && (
                                <span className="text-[10px] text-rf-yellow/50 border border-rf-yellow/20
                                                 rounded-full px-1.5 py-0.5">
                                    Fallback
                                </span>
                            )}
                        </div>

                        {hasEvents ? (
                            <div className="space-y-2">
                                {conditions.activeConditions.map(name => {
                                    const style = getEventStyle(name)
                                    const major = isMajorEvent(name)
                                    return (
                                        <div
                                            key={name}
                                            className="flex items-center gap-3 rounded-xl p-3 border"
                                            style={{
                                                backgroundColor: style.bg,
                                                borderColor:     style.border,
                                            }}
                                        >
                                            <span
                                                className="h-2 w-2 rounded-full animate-pulse shrink-0"
                                                style={{ backgroundColor: style.text }}
                                            />
                                            <span className="text-sm font-semibold text-white flex-1">{name}</span>
                                            <span
                                                className="text-[9px] font-black uppercase tracking-widest
                                                           rounded-full px-2 py-0.5 border shrink-0"
                                                style={{
                                                    color:           style.text,
                                                    borderColor:     style.border,
                                                    backgroundColor: style.bg,
                                                }}
                                            >
                                                {major ? 'Major' : 'Active'}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            /* Nominal — matches index page card treatment */
                            <div className="flex items-center gap-2 py-0.5">
                                <span className="h-2 w-2 rounded-full bg-rf-green/50 shrink-0" />
                                <span className="text-sm font-medium text-rf-green/60">Nominal</span>
                            </div>
                        )}

                        {conditions.nextEvent && (
                            <div className="mt-3 pt-3 border-t border-white/5
                                            flex items-center gap-1.5 text-xs text-white/30">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                     strokeWidth={2} stroke="currentColor" className="w-3 h-3 text-white/20 shrink-0">
                                    <path strokeLinecap="round" strokeLinejoin="round"
                                          d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                                Next:{' '}
                                <span className="text-white/50 font-medium">
                                    {conditions.nextEvent.major ?? conditions.nextEvent.minor}
                                </span>{' '}
                                in {conditions.nextEvent.hoursAway}h
                            </div>
                        )}
                    </div>

                    {/* Classification */}
                    <div className="rf-card rounded-2xl p-4">
                        <span className="text-xs uppercase tracking-widest text-white/35 font-semibold">
                            Classification
                        </span>
                        <div className="mt-3 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-white/40">Risk Level</span>
                                <span className={`text-[10px] font-bold uppercase tracking-wide
                                                  border rounded-full px-2.5 py-1 ${risk.badge}`}>
                                    {map.risk}
                                </span>
                            </div>
                            <div className="h-px bg-white/5" />
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-white/40">Zone Type</span>
                                <span className="text-xs text-white/50 capitalize">
                                    {map.mapType.replace('-', ' ')}
                                </span>
                            </div>
                            {map.mapType === 'multi-floor' && (
                                <>
                                    <div className="h-px bg-white/5" />
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-white/40">Floors</span>
                                        <span className="text-xs text-white/50">{map.floors?.length}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Quest Markers */}
                    <div className="rf-card rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs uppercase tracking-widest text-white/35 font-semibold">
                                Quest Markers
                            </span>
                            {mapQuests.length > 0 ? (
                                <span className="text-[9px] font-bold uppercase tracking-wider
                                                 border border-rf-blue/25 bg-rf-blue/8 text-rf-blue/70
                                                 rounded-full px-2 py-0.5">
                                    {mapQuests.length} quests
                                </span>
                            ) : (
                                <span className="text-[9px] font-bold uppercase tracking-wider
                                                 border border-white/10 bg-white/5 text-white/30
                                                 rounded-full px-2 py-0.5">
                                    None
                                </span>
                            )}
                        </div>

                        {mapQuests.length > 0 ? (
                            <>
                                {/* Trader breakdown */}
                                <div className="space-y-2">
                                    {Object.entries(traderBreakdown).map(([traderName, count]) => (
                                        <div key={traderName} className="flex items-center justify-between">
                                            <span className="text-xs text-white/45">{traderName}</span>
                                            <span className="text-[11px] font-semibold text-white/55">{count}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Position coverage note */}
                                {questsWithPosition.length < mapQuests.length && (
                                    <p className="text-[10px] text-white/20 mt-3 pt-3
                                                  border-t border-white/5 leading-relaxed">
                                        {questsWithPosition.length} of {mapQuests.length} quests have map
                                        positions. Remaining are tracked by MetaForge but not yet placed.
                                    </p>
                                )}

                                <p className="text-[10px] text-white/15 mt-2">
                                    via MetaForge &amp; ardb.app
                                </p>
                            </>
                        ) : (
                            <p className="text-[11px] text-white/25 leading-relaxed">
                                No quest data available for this map.
                                Check back after the next MetaForge sync.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
