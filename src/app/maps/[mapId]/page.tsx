import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MAPS, getMapThumbnail } from '../../../data/maps'
import { fetchMfEventsSchedule } from '../../../api/metaforgeService'
import { getActiveConditionsForMap } from '../../../lib/events/conditions'
import { getEventStyle, isMajorEvent } from '../../../lib/events/eventsConfig'
import MapImageDisplay from '../../../components/MapImageDisplay'

type Props = { params: Promise<{ mapId: string }> }

const riskStyle: Record<string, { badge: string; label: string; glow: string }> = {
    Low:     { badge: 'bg-rf-green/15 text-rf-green border-rf-green/30',   label: 'Low Risk',     glow: 'shadow-rf-green/20'   },
    Medium:  { badge: 'bg-rf-yellow/15 text-rf-yellow border-rf-yellow/30', label: 'Medium Risk',  glow: 'shadow-rf-yellow/20'  },
    High:    { badge: 'bg-rf-orange/15 text-rf-orange border-rf-orange/30', label: 'High Risk',    glow: 'shadow-rf-orange/20'  },
    Extreme: { badge: 'bg-rf-red/15 text-rf-red border-rf-red/30',          label: 'Extreme Risk', glow: 'shadow-rf-red/20'     },
}

export default async function MapDetailPage({ params }: Props) {
    const { mapId } = await params
    const map = MAPS.find(m => m.id === mapId)
    if (!map) notFound()

    let events: Awaited<ReturnType<typeof fetchMfEventsSchedule>> = []
    try {
        events = await fetchMfEventsSchedule()
    } catch {
        // Fail silently — page renders with rotation-fallback conditions
    }

    const now = new Date()
    const conditions = getActiveConditionsForMap(map.id, now, events)
    const thumb = getMapThumbnail(map)
    const risk = riskStyle[map.risk]
    const hasEvents = conditions.activeConditions.length > 0

    return (
        <div className="xl:pr-[300px]">
            <div className="py-8 px-6 max-w-7xl mx-auto">

                {/* Breadcrumb */}
                <div className="mb-6">
                    <Link
                        href="/maps"
                        className="inline-flex items-center gap-2 text-xs font-medium text-white/40 hover:text-white/80 bg-white/5 hover:bg-white/8 border border-white/8 hover:border-white/15 rounded-full px-3 py-1.5 transition-all"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                        </svg>
                        All Zones
                    </Link>
                </div>

                {/* Hero */}
                <div className="relative h-72 sm:h-96 rounded-2xl overflow-hidden mb-8 bg-rf-bgSoft">
                    <img src={thumb} alt={map.displayName} className="w-full h-full object-cover" />
                    {/* Cinematic overlays */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/15" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent" />

                    {/* Risk badge — top right */}
                    <span className={`absolute top-4 right-4 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider border rounded-full px-3 py-1.5 backdrop-blur-md shadow-lg ${risk.badge} ${risk.glow}`}>
                        {map.risk}
                    </span>

                    {/* Active events — top left */}
                    {hasEvents && (
                        <div className="absolute top-4 left-4 flex flex-wrap gap-1.5">
                            {conditions.activeConditions.map(name => {
                                const style = getEventStyle(name)
                                return (
                                    <span
                                        key={name}
                                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-full px-3 py-1 backdrop-blur-md border"
                                        style={{
                                            backgroundColor: style.bg,
                                            borderColor:     style.border,
                                            color:           style.text,
                                        }}
                                    >
                                        <span
                                            className="h-1.5 w-1.5 rounded-full animate-pulse flex-shrink-0"
                                            style={{ backgroundColor: style.text }}
                                        />
                                        {name}
                                    </span>
                                )
                            })}
                        </div>
                    )}

                    {/* Title — bottom left */}
                    <div className="absolute bottom-0 left-0 right-0 px-6 pb-6 pt-16 bg-gradient-to-t from-black/80 to-transparent">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold mb-1.5">{map.subtitle}</p>
                        <h1 className="text-4xl font-black text-white tracking-tight">{map.displayName}</h1>
                    </div>
                </div>

                {/* Content grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Main: Tactical Grid */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="rf-card rounded-2xl overflow-hidden">
                            {/* Grid header */}
                            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5 bg-white/[0.02]">
                                <div className="flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 text-white/30">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
                                    </svg>
                                    <span className="text-xs uppercase tracking-widest text-white/40 font-semibold">Tactical Grid</span>
                                </div>
                                <span className="text-[10px] text-white/20">{map.displayName}</span>
                            </div>
                            <MapImageDisplay map={map} />
                        </div>

                        {/* Zone overview */}
                        <div className="rf-card rounded-2xl p-5">
                            <h2 className="text-xs uppercase tracking-widest text-white/35 font-semibold mb-3">Zone Overview</h2>
                            <p className="text-sm text-rf-textSoft leading-relaxed">{map.description}</p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {map.features.map(f => (
                                    <span key={f} className="text-xs border border-white/8 rounded-full px-3 py-1 text-white/40 bg-white/[0.03]">
                                        {f}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">

                        {/* Live Conditions */}
                        <div className="rf-card rounded-2xl p-4">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <span className={`h-1.5 w-1.5 rounded-full ${hasEvents ? 'bg-rf-red animate-pulse' : 'bg-white/20'}`} />
                                    <span className="text-xs uppercase tracking-widest text-white/40 font-semibold">Live Conditions</span>
                                </div>
                                {conditions.source === 'rotation-fallback' && (
                                    <span className="text-[10px] text-rf-yellow/50 border border-rf-yellow/20 rounded-full px-1.5 py-0.5">Fallback</span>
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
                                                    className="h-2 w-2 rounded-full animate-pulse flex-shrink-0"
                                                    style={{ backgroundColor: style.text }}
                                                />
                                                <span className="text-sm font-semibold text-white flex-1">{name}</span>
                                                <span
                                                    className="text-[9px] font-black uppercase tracking-widest rounded-full px-2 py-0.5 border"
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
                                <p className="text-sm text-white/25 py-2">No active events</p>
                            )}

                            {conditions.nextEvent && (
                                <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-1.5 text-xs text-white/30">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 text-white/20">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                    </svg>
                                    Next: <span className="text-white/50 font-medium">{conditions.nextEvent.major ?? conditions.nextEvent.minor}</span> in {conditions.nextEvent.hoursAway}h
                                </div>
                            )}
                        </div>

                        {/* Classification */}
                        <div className="rf-card rounded-2xl p-4">
                            <span className="text-xs uppercase tracking-widest text-white/35 font-semibold">Classification</span>
                            <div className="mt-3 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-white/40">Risk Level</span>
                                    <span className={`text-[10px] font-bold uppercase tracking-wide border rounded-full px-2.5 py-1 ${risk.badge}`}>
                                        {map.risk}
                                    </span>
                                </div>
                                <div className="h-px bg-white/5" />
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-white/40">Zone Type</span>
                                    <span className="text-xs text-white/50 capitalize">{map.mapType.replace('-', ' ')}</span>
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

                        {/* Tactical Markers status */}
                        <div className="rf-card rounded-2xl p-4 border-dashed">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs uppercase tracking-widest text-white/35 font-semibold">Tactical Markers</span>
                                <span className="text-[9px] font-bold uppercase tracking-wider border border-rf-yellow/25 bg-rf-yellow/8 text-rf-yellow/70 rounded-full px-2 py-0.5">
                                    Unavailable
                                </span>
                            </div>
                            <p className="text-[11px] text-white/25 leading-relaxed">
                                MetaForge <code className="text-white/20 font-mono">/game-map-data</code> is returning errors. POI markers, loot spawns, and ARC patrol routes will auto-populate when the API recovers.
                            </p>
                            <a
                                href="https://metaforge.app/arc-raiders"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-3 inline-flex items-center gap-1 text-[10px] text-white/25 hover:text-white/50 transition-colors"
                            >
                                MetaForge status
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-2.5 h-2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
