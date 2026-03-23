import Link from 'next/link'
import { MAPS, getMapThumbnail } from '../../data/maps'
import { fetchMfEventsSchedule } from '../../api/metaforgeService'
import { getActiveConditionsForMap } from '../../lib/events/conditions'
import { getEventStyle } from '../../lib/events/eventsConfig'

const riskStyle: Record<string, { badge: string; dot: string }> = {
    Low:     { badge: 'bg-rf-green/15 text-rf-green border-rf-green/25',   dot: 'bg-rf-green'   },
    Medium:  { badge: 'bg-rf-yellow/15 text-rf-yellow border-rf-yellow/25', dot: 'bg-rf-yellow'  },
    High:    { badge: 'bg-rf-orange/15 text-rf-orange border-rf-orange/25', dot: 'bg-rf-orange'  },
    Extreme: { badge: 'bg-rf-red/15 text-rf-red border-rf-red/25',          dot: 'bg-rf-red'     },
}

export default async function MapsPage() {
    let events: Awaited<ReturnType<typeof fetchMfEventsSchedule>> = []
    try {
        events = await fetchMfEventsSchedule()
    } catch {
        // Fail silently — cards render without live event badges
    }

    const now = new Date()

    return (
        <div className="xl:pr-[300px]">
            <div className="py-12 px-6 max-w-7xl mx-auto">

                {/* Header */}
                <div className="mb-10">
                    <span className="text-xs uppercase tracking-widest text-rf-red font-semibold">Operations</span>
                    <h1 className="mt-2 text-3xl font-bold text-white">Tactical Zones</h1>
                    <p className="mt-3 text-rf-textSoft text-sm max-w-lg">
                        Live ARC Raiders map conditions — select a zone for tactical data and event overlays.
                    </p>
                </div>

                {/* Map grid — 3 col on lg, 2 col on md, 1 on sm */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {MAPS.map(map => {
                        const thumb = getMapThumbnail(map)
                        const conditions = getActiveConditionsForMap(map.id, now, events)
                        const risk = riskStyle[map.risk]
                        const hasEvents = conditions.activeConditions.length > 0

                        return (
                            <Link
                                key={map.id}
                                href={`/maps/${map.id}`}
                                className="group flex flex-col rf-card rounded-2xl overflow-hidden hover:border-white/15 hover:shadow-xl hover:shadow-black/60 transition-all duration-300 hover:-translate-y-0.5"
                            >
                                {/* Thumbnail */}
                                <div className="relative h-52 overflow-hidden bg-rf-bgSoft shrink-0">
                                    <img
                                        src={thumb}
                                        alt={map.displayName}
                                        className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out"
                                    />
                                    {/* Gradients */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />
                                    {/* Top fade for badge readability */}
                                    <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/50 to-transparent" />

                                    {/* Risk badge */}
                                    <div className={`absolute top-3 right-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider border rounded-full px-2.5 py-1 backdrop-blur-md ${risk.badge}`}>
                                        <span className={`h-1.5 w-1.5 rounded-full ${risk.dot}`} />
                                        {map.risk}
                                    </div>

                                    {/* Live indicator when events are active */}
                                    {hasEvents && (
                                        <div className="absolute top-3 left-3 flex items-center gap-1 text-[10px] font-semibold text-white/80 bg-black/50 backdrop-blur-sm rounded-full px-2 py-0.5 border border-white/10">
                                            <span className="h-1.5 w-1.5 rounded-full bg-rf-red animate-pulse" />
                                            Live
                                        </div>
                                    )}

                                    {/* Name overlay */}
                                    <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-8 bg-gradient-to-t from-black/90 to-transparent">
                                        <h2 className="font-bold text-white text-lg leading-tight">{map.displayName}</h2>
                                        <p className="text-xs text-white/45 mt-0.5">{map.subtitle}</p>
                                    </div>
                                </div>

                                {/* Info section */}
                                <div className="flex flex-col flex-1 px-5 py-4">
                                    {/* Event badges */}
                                    {hasEvents ? (
                                        <div className="flex flex-wrap gap-1.5 mb-4">
                                            {conditions.activeConditions.map(name => {
                                                const style = getEventStyle(name)
                                                return (
                                                    <span
                                                        key={name}
                                                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-full px-2.5 py-1 border"
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
                                        <p className="text-xs text-white/20 mb-4">No active events</p>
                                    )}

                                    {/* Bottom row: features + CTA */}
                                    <div className="mt-auto flex items-center justify-between pt-3 border-t border-white/5">
                                        <div className="flex items-center gap-x-2 flex-wrap gap-y-0">
                                            {map.features.slice(0, 2).map(f => (
                                                <span key={f} className="text-[10px] text-white/25">{f}</span>
                                            ))}
                                        </div>
                                        <span className="text-xs font-medium text-rf-red inline-flex items-center gap-1 group-hover:gap-2 transition-all shrink-0">
                                            Enter
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                            </svg>
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        )
                    })}
                </div>

                <p className="mt-12 text-[11px] text-white/20">
                    Live event conditions via{' '}
                    <a href="https://metaforge.app/arc-raiders" target="_blank" rel="noopener noreferrer" className="hover:text-white/40 transition-colors">
                        MetaForge
                    </a>
                    .
                </p>
            </div>
        </div>
    )
}
