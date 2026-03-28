import Link from 'next/link'
import { MAPS, getMapThumbnail } from '@/data/maps'
import { CONTAINERS_BY_MAP } from '@/data/containers'
import { fetchMfEventsSchedule } from '@/api/metaforgeService'
import { fetchArdbQuests } from '@/api/ardbService'
import { getActiveConditionsForMap } from '@/lib/events/conditions'
import { getEventStyle } from '@/lib/events/eventsConfig'

const riskStyle: Record<string, { badge: string; dot: string }> = {
    Low:     { badge: 'bg-rf-green/15 text-rf-green border-rf-green/25',    dot: 'bg-rf-green'  },
    Medium:  { badge: 'bg-rf-yellow/15 text-rf-yellow border-rf-yellow/25', dot: 'bg-rf-yellow' },
    High:    { badge: 'bg-rf-orange/15 text-rf-orange border-rf-orange/25', dot: 'bg-rf-orange' },
    Extreme: { badge: 'bg-rf-red/15 text-rf-red border-rf-red/25',          dot: 'bg-rf-red'    },
}

export default async function MapsPage() {
    // Parallel fetches — both fail gracefully
    const [events, ardbQuests] = await Promise.all([
        fetchMfEventsSchedule().catch(() => []),
        fetchArdbQuests().catch(() => []),    // 30-min cache, used for quest count badges
    ])

    // Build quest-count-per-map from ARDB data
    const questCountByMap: Record<string, number> = {}
    for (const q of ardbQuests) {
        for (const m of q.maps ?? []) {
            questCountByMap[m.id] = (questCountByMap[m.id] ?? 0) + 1
        }
    }

    const now = new Date()

    return (
        <div className="py-14 px-6 max-w-6xl mx-auto">

            {/* ── Header ─────────────────────────────────────────────────────────
                Left-border accent with text-shadow lets the full-bleed background
                remain visible. No card overlay needed — rf-card on each map card
                handles per-item readability.  */}
            <div className="mb-12 pl-1">
                <div className="border-l-2 border-rf-red pl-5">
                    <span className="text-xs uppercase tracking-widest text-rf-red font-semibold">Operations</span>
                    <h1 className="mt-2 text-3xl font-bold text-white text-shadow-hero">Tactical Zones</h1>
                    <p className="mt-2.5 text-rf-textSoft text-sm max-w-md text-shadow-hero">
                        Live ARC Raiders map conditions — select a zone for tactical data,
                        quest markers, and interactive overlays.
                    </p>
                </div>
            </div>

            {/* ── Map grid ───────────────────────────────────────────────────────
                flex-wrap + justify-center keeps the last (incomplete) row centred.
                gap-6 (24px) with calc() widths fills exactly 100% per row:
                  3 × (33.333% − 16px) + 2 × 24px = 100%  ✓
                  2 × (50%    − 12px)  + 1 × 24px = 100%  ✓  */}
            <div className="flex flex-wrap justify-center gap-6">
                {MAPS.map(map => {
                    const thumb          = getMapThumbnail(map)
                    const conditions     = getActiveConditionsForMap(map.id, now, events)
                    const risk           = riskStyle[map.risk]
                    const hasEvents      = conditions.activeConditions.length > 0
                    const questCount     = questCountByMap[map.id] ?? 0
                    const containerCount = (CONTAINERS_BY_MAP[map.id] ?? []).length

                    return (
                        <Link
                            key={map.id}
                            href={`/maps/${map.id}`}
                            className="group flex flex-col rf-card rounded-2xl overflow-hidden
                                       hover:border-white/20 hover:shadow-2xl hover:shadow-black/60
                                       transition-all duration-300 hover:-translate-y-1
                                       w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]"
                        >
                            {/* ── Thumbnail ── */}
                            <div className="relative h-52 overflow-hidden bg-rf-bgSoft shrink-0">
                                <img
                                    src={thumb}
                                    alt={map.displayName}
                                    className="w-full h-full object-cover
                                               group-hover:scale-[1.05] transition-transform duration-700 ease-out"
                                />
                                {/* Scrim: bottom-up for name, top-down for badge readability */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                                <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/60 to-transparent" />

                                {/* Risk badge — top right */}
                                <div className={`absolute top-3 right-3 flex items-center gap-1.5
                                                text-[10px] font-bold uppercase tracking-wider
                                                border rounded-full px-2.5 py-1 backdrop-blur-md ${risk.badge}`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${risk.dot}`} />
                                    {map.risk}
                                </div>

                                {/* Live badge — top left, only when MetaForge reports active events */}
                                {hasEvents && (
                                    <div className="absolute top-3 left-3 flex items-center gap-1
                                                    text-[10px] font-semibold text-white/85
                                                    bg-black/55 backdrop-blur-sm rounded-full px-2.5 py-1
                                                    border border-white/10">
                                        <span className="h-1.5 w-1.5 rounded-full bg-rf-red animate-pulse" />
                                        Live
                                    </div>
                                )}

                                {/* Map name + subtitle */}
                                <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-10
                                                bg-gradient-to-t from-black/70 to-transparent">
                                    <h2 className="font-bold text-white text-[17px] leading-tight">
                                        {map.displayName}
                                    </h2>
                                    <p className="text-[11px] text-white/50 mt-0.5 tracking-wide">
                                        {map.subtitle}
                                    </p>
                                </div>
                            </div>

                            {/* ── Info section ── */}
                            <div className="flex flex-col flex-1 px-4 pt-4 pb-3.5">

                                {/* Conditions area — min-h locks row height so data badges land
                                    at the same vertical offset across all cards in the same row,
                                    regardless of how many event badges are shown.  */}
                                <div className="min-h-[2.25rem] mb-2.5">
                                    {hasEvents ? (
                                        <div className="flex flex-wrap gap-1.5">
                                            {conditions.activeConditions.map(name => {
                                                const style = getEventStyle(name)
                                                return (
                                                    <span
                                                        key={name}
                                                        className="inline-flex items-center gap-1.5
                                                                   text-[11px] font-semibold
                                                                   rounded-full px-2.5 py-1 border"
                                                        style={{
                                                            backgroundColor: style.bg,
                                                            borderColor:     style.border,
                                                            color:           style.text,
                                                        }}
                                                    >
                                                        <span
                                                            className="h-1.5 w-1.5 rounded-full flex-shrink-0 animate-pulse"
                                                            style={{ backgroundColor: style.text }}
                                                        />
                                                        {name}
                                                    </span>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5">
                                            <span className="h-1.5 w-1.5 rounded-full bg-rf-green/55 shrink-0" />
                                            <span className="text-[11px] text-rf-green/55 font-medium tracking-wide">
                                                Nominal
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Secondary badges — quest count (ARDB) + container count (local) */}
                                {(questCount > 0 || containerCount > 0) && (
                                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                        {questCount > 0 && (
                                            <span className="inline-flex items-center gap-1
                                                             text-[10px] font-semibold
                                                             text-rf-blue/65 border border-rf-blue/18
                                                             bg-rf-blue/[0.07] rounded-full px-2 py-0.5">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                                     strokeWidth={2} stroke="currentColor" className="w-2.5 h-2.5 shrink-0">
                                                    <path strokeLinecap="round" strokeLinejoin="round"
                                                          d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
                                                </svg>
                                                {questCount} quests
                                            </span>
                                        )}
                                        {containerCount > 0 && (
                                            <span className="inline-flex items-center gap-1
                                                             text-[10px] font-semibold
                                                             text-rf-yellow/65 border border-rf-yellow/18
                                                             bg-rf-yellow/[0.07] rounded-full px-2 py-0.5">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                                     strokeWidth={2} stroke="currentColor" className="w-2.5 h-2.5 shrink-0">
                                                    <path strokeLinecap="round" strokeLinejoin="round"
                                                          d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                                                </svg>
                                                {containerCount} containers
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Bottom row — features + Enter CTA */}
                                <div className="mt-auto flex items-center justify-between
                                                pt-3 border-t border-white/[0.06]">
                                    <span className="text-[10px] text-white/28 truncate pr-3">
                                        {map.features.slice(0, 2).join(' · ')}
                                    </span>
                                    <span className="text-xs font-medium text-rf-red
                                                     inline-flex items-center gap-1
                                                     group-hover:gap-2 transition-all shrink-0">
                                        Enter
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                             strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                                            <path strokeLinecap="round" strokeLinejoin="round"
                                                  d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                        </svg>
                                    </span>
                                </div>
                            </div>
                        </Link>
                    )
                })}
            </div>

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
