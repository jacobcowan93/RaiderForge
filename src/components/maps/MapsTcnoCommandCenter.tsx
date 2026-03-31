'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { getEventDescription, EVENT_ICONS } from '@/lib/events/eventsConfig'
import { msLeftInUtcHour } from '@/lib/events/conditions'
import { fmtCountdown } from '@/lib/events/rotationTable'
import { LiveDataFeedStrip } from '@/components/live-data/LiveDataFeedStrip'
import { LIVE_DATA_MAP_ROTATION_HINT } from '@/lib/live-data/messages'
import { MapsHubLegend } from '@/components/maps/MapsHubLegend'
import { MapCoverImage } from '@/components/maps/MapCoverImage'
import { canonicalHubSlugForMapId, resolveMapsHubZoneParam } from '@/lib/maps/maps-hub-zone'

export type TcnoZoneVM = {
    id: string
    displayName: string
    subtitle: string
    description: string
    thumb: string
    tcnoUrl: string
    hasEvents: boolean
    conditionBadges: { name: string; bg: string; border: string; text: string }[]
    /** Zone modifiers matched live MetaForge rows (else rotation table). */
    fromMetaforge: boolean
    /** Earliest MetaForge endTime among active rows for this zone (epoch ms), else null. */
    eventEndsAtMs: number | null
    conditionsSource: 'api' | 'rotation-fallback'
}

type Props = {
    zones: TcnoZoneVM[]
    useTcnoIframe: boolean
    /** Resolved server-side from ?zone= */
    initialZoneId: string | null
    /** ISO timestamp — MetaForge pull time for zone modifiers */
    liveConditionsUpdatedAt?: string | null
    liveConditionsUpstreamOk?: boolean
    /** Raw event count from last MetaForge payload (for chip: empty vs live). */
    liveMetaforgeEventCount?: number
}

export function MapsTcnoCommandCenter({
    zones,
    useTcnoIframe,
    initialZoneId,
    liveConditionsUpdatedAt,
    liveConditionsUpstreamOk,
    liveMetaforgeEventCount = 0,
}: Props) {
    const router = useRouter()
    const pathname = usePathname()
    const validIds = useMemo(() => new Set(zones.map((z) => z.id)), [zones])
    const firstId = zones[0]?.id ?? ''

    const [selectedId, setSelectedId] = useState(() => {
        if (initialZoneId && validIds.has(initialZoneId)) return initialZoneId
        return firstId
    })

    useEffect(() => {
        if (initialZoneId && validIds.has(initialZoneId)) setSelectedId(initialZoneId)
    }, [initialZoneId, validIds])

    useEffect(() => {
        const onPop = () => {
            const q = new URLSearchParams(window.location.search).get('zone')
            const id = resolveMapsHubZoneParam(q)
            if (id && validIds.has(id)) setSelectedId(id)
        }
        window.addEventListener('popstate', onPop)
        return () => window.removeEventListener('popstate', onPop)
    }, [validIds])

    const [query, setQuery] = useState('')
    const [modifiersOnly, setModifiersOnly] = useState(false)
    const [now, setNow] = useState(() => new Date())

    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 1000)
        return () => clearInterval(id)
    }, [])

    const selectZone = (id: string) => {
        setSelectedId(id)
        const slug = canonicalHubSlugForMapId(id)
        router.replace(`${pathname}?zone=${encodeURIComponent(slug)}`, { scroll: false })
        requestAnimationFrame(() => {
            document.getElementById('maps-command-stage')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        })
    }

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        return zones.filter((z) => {
            if (modifiersOnly && !z.hasEvents) return false
            if (!q) return true
            return (
                z.displayName.toLowerCase().includes(q) ||
                z.subtitle.toLowerCase().includes(q) ||
                z.description.toLowerCase().includes(q) ||
                z.conditionBadges.some((b) => b.name.toLowerCase().includes(q)) ||
                z.id.replace(/-/g, ' ').includes(q)
            )
        })
    }, [zones, query, modifiersOnly])

    const selected = zones.find((z) => z.id === selectedId) ?? zones[0]
    const selectedInFilter = selected && filtered.some((z) => z.id === selected.id)

    if (!selected) return null

    return (
        <div className="space-y-6">
            {liveConditionsUpdatedAt ? (
                <div className="rounded-lg border border-white/[0.08] bg-black/35 px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold mb-2">Live conditions</p>
                    <LiveDataFeedStrip
                        fetchedAt={liveConditionsUpdatedAt}
                        upstreamOk={
                            liveConditionsUpstreamOk === undefined ? null : liveConditionsUpstreamOk ? true : false
                        }
                        polledEventCount={liveMetaforgeEventCount}
                        loading={false}
                    />
                </div>
            ) : null}

            <div className="flex flex-col lg:flex-row lg:items-end gap-4 lg:gap-6">
                <label className="flex-1 min-w-0 max-w-xl">
                    <span className="sr-only">Search zones</span>
                    <input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Quick jump — search any zone or modifier…"
                        className="w-full rounded-xl border border-white/[0.12] bg-black/40 px-4 py-2.5 text-sm text-white
                                   placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-red-500/35"
                    />
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer select-none shrink-0">
                    <input
                        type="checkbox"
                        checked={modifiersOnly}
                        onChange={(e) => setModifiersOnly(e.target.checked)}
                        className="rounded border-white/20 bg-black/40 text-red-500 focus:ring-red-500/40"
                    />
                    <span className="text-xs font-medium text-white/70">Show zones with active modifiers only</span>
                </label>
            </div>

            <div>
                <p className="text-[10px] uppercase tracking-widest text-white/40 font-semibold mb-3">Select zone</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {filtered.map((z) => {
                        const active = z.id === selected.id
                        return (
                            <button
                                key={z.id}
                                type="button"
                                onClick={() => selectZone(z.id)}
                                className={`group text-left rounded-xl border overflow-hidden transition-all
                                    ${active
                                        ? 'border-red-500/70 bg-red-500/[0.14] shadow-[0_0_32px_-8px_rgba(239,68,68,0.55)] ring-2 ring-red-500/30'
                                        : 'border-white/[0.08] bg-black/30 hover:border-red-500/20 hover:bg-black/45'
                                    }`}
                            >
                                <div className="relative aspect-[16/10] bg-rf-bgSoft">
                                    <MapCoverImage
                                        src={z.thumb}
                                        alt={`${z.displayName} — zone preview`}
                                        fill
                                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                                        className="object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                                    {active && (
                                        <div className="absolute inset-0 ring-2 ring-inset ring-red-500/40 pointer-events-none" />
                                    )}
                                    {z.hasEvents && (
                                        <span
                                            className="absolute top-2 left-2 h-2 w-2 rounded-full bg-red-500 animate-pulse shadow shadow-red-500/80"
                                            title="Active modifiers"
                                        />
                                    )}
                                    <div
                                        className="absolute top-2 right-2 flex flex-col items-end gap-0.5 rounded-md bg-black/55 px-1.5 py-1 border border-white/10"
                                        title="Schedule window / modifier timing"
                                    >
                                        <span className="text-[10px] font-bold tabular-nums text-white/95 leading-none">
                                            {fmtCountdown(msLeftInUtcHour(now))}
                                        </span>
                                        {z.conditionsSource === 'api' && z.eventEndsAtMs != null ? (
                                            <span className="text-[9px] font-semibold tabular-nums text-amber-200/95 leading-none">
                                                {fmtCountdown(Math.max(0, z.eventEndsAtMs - now.getTime()))}
                                            </span>
                                        ) : null}
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 px-2.5 pb-2 pt-6">
                                        <p className="text-[9px] uppercase tracking-wider text-white/45 truncate">{z.subtitle}</p>
                                        <p className="text-sm font-bold text-white truncate leading-tight">{z.displayName}</p>
                                    </div>
                                </div>
                                {z.conditionBadges.length > 0 && (
                                    <div className="px-2 py-1.5 flex flex-wrap gap-1 border-t border-white/[0.06] bg-black/50">
                                        {z.conditionBadges.slice(0, 2).map((b) => (
                                            <span
                                                key={b.name}
                                                title={getEventDescription(b.name)}
                                                className="text-[9px] font-semibold truncate max-w-full cursor-help rounded px-1.5 py-0.5 border"
                                                style={{
                                                    backgroundColor: b.bg,
                                                    borderColor: b.border,
                                                    color: b.text,
                                                }}
                                            >
                                                {b.name}
                                            </span>
                                        ))}
                                        {z.conditionBadges.length > 2 && (
                                            <span className="text-[9px] text-white/35">+{z.conditionBadges.length - 2}</span>
                                        )}
                                    </div>
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>

            <div
                id="maps-command-stage"
                className="rounded-2xl border border-red-500/12 bg-[#020308]/98 overflow-hidden flex flex-col shadow-[0_28px_100px_-28px_rgba(0,0,0,0.95)] scroll-mt-24"
            >
                {!selectedInFilter && (
                    <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-[11px] text-amber-100/90">
                        Selected zone is hidden by filters — pick another or clear search / modifier filter.
                    </div>
                )}

                <div className="flex flex-col lg:flex-row lg:items-stretch border-b border-white/[0.06] bg-black/40">
                    <div className="flex-1 p-4 sm:p-5 lg:border-r border-white/[0.06] min-w-0">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-red-500 font-bold mb-1">{selected.subtitle}</p>
                        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-3 drop-shadow-sm">
                            {selected.displayName}
                        </h2>
                        <p className="text-sm text-white/60 leading-relaxed mb-4 line-clamp-3 sm:line-clamp-none">
                            {selected.description}
                        </p>
                        {!selected.fromMetaforge ? (
                            <p className="text-[10px] text-white/38 leading-snug max-w-xl mb-3">{LIVE_DATA_MAP_ROTATION_HINT}</p>
                        ) : null}
                        {selected.conditionBadges.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-4">
                                {selected.conditionBadges.map((b) => {
                                    const icon = EVENT_ICONS[b.name]
                                    return (
                                        <span
                                            key={b.name}
                                            title={getEventDescription(b.name)}
                                            className="inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-full px-2.5 py-1 border cursor-help"
                                            style={{
                                                backgroundColor: b.bg,
                                                borderColor: b.border,
                                                color: b.text,
                                            }}
                                        >
                                            {icon && (
                                                /* eslint-disable-next-line @next/next/no-img-element */
                                                <img src={icon} alt="" className="w-3.5 h-3.5 object-contain opacity-90 shrink-0" />
                                            )}
                                            {b.name}
                                        </span>
                                    )
                                })}
                            </div>
                        )}
                        <div className="flex flex-col sm:flex-row flex-wrap gap-2.5">
                            <Link
                                href={`/maps/${selected.id}`}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-500
                                           text-white text-sm font-bold px-5 py-3 shadow-lg shadow-red-950/60
                                           transition-colors border border-red-400/25"
                            >
                                Open RaiderForge interactive map
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 shrink-0">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
                                </svg>
                            </Link>
                            <Link
                                href={`/maps/hub/${canonicalHubSlugForMapId(selected.id)}`}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/12 bg-transparent
                                           text-white/70 hover:text-white text-xs font-semibold px-4 py-3 transition-colors"
                            >
                                Dedicated zone page
                            </Link>
                        </div>
                    </div>
                    {!useTcnoIframe && (
                        <div className="lg:w-[min(42%,420px)] shrink-0 relative min-h-[200px] lg:min-h-[220px] bg-black/70">
                            <MapCoverImage
                                src={selected.thumb}
                                alt={`${selected.displayName} — zone preview`}
                                fill
                                sizes="(max-width: 1024px) 100vw, 420px"
                                className="object-cover opacity-40"
                            />
                            <div className="absolute inset-0 bg-gradient-to-l from-transparent via-black/50 to-black/90 hidden lg:block" />
                            <div className="absolute inset-0 flex flex-col justify-center p-5 text-center lg:text-left">
                                <p className="text-[11px] text-white/50 leading-relaxed">
                                    RaiderForge hosts the tactical map flow directly. Open the native map to browse curated POIs,
                                    filters, quests, and loot layers on-site.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="relative w-full bg-[#010204] min-h-[min(72vh,920px)] flex flex-col">
                    {useTcnoIframe ? (
                        <>
                            <div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-white/[0.06] bg-black/90 shrink-0">
                                <span className="text-[10px] uppercase tracking-wider text-red-500/70 font-semibold truncate">
                                    Live zone preview
                                </span>
                                <Link
                                    href={`/maps/${selected.id}`}
                                    className="text-[10px] font-semibold text-red-400/90 hover:text-red-300 whitespace-nowrap"
                                >
                                    Open RaiderForge map
                                </Link>
                            </div>
                            <div className="relative flex-1 min-h-[min(68vh,880px)] w-full">
                                <MapCoverImage
                                    src={selected.thumb}
                                    alt={`${selected.displayName} — zone preview`}
                                    fill
                                    sizes="100vw"
                                    className="object-cover opacity-30"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#020308] via-[#020308]/90 to-[#020308]/55" />
                                <div className="relative z-10 flex h-full items-center justify-center p-8">
                                    <div className="max-w-lg text-center">
                                        <p className="text-xs uppercase tracking-[0.25em] text-red-500 font-bold mb-3">RaiderForge Maps</p>
                                        <p className="text-lg font-bold text-white mb-2">Interactive maps stay on RaiderForge</p>
                                        <p className="text-sm text-white/50 mb-6 leading-relaxed">
                                            Open the native map for curated POIs, tactical filters, containers, quests, and live map
                                            condition context without leaving the site.
                                        </p>
                                        <Link
                                            href={`/maps/${selected.id}`}
                                            className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold px-8 py-3.5 border border-red-400/30 shadow-xl shadow-black/50"
                                        >
                                            Open RaiderForge interactive map
                                        </Link>
                                    </div>
                                </div>
                            </div>
                            <div className="px-3 py-2 border-t border-white/[0.06] bg-red-950/25 text-[10px] text-white/50 leading-relaxed">
                                RaiderForge tactical maps are the primary interactive surface for this release.
                            </div>
                        </>
                    ) : (
                        <div className="relative flex-1 min-h-[320px] sm:min-h-[400px]">
                            <MapCoverImage
                                src={selected.thumb}
                                alt={`${selected.displayName} — zone preview`}
                                fill
                                sizes="100vw"
                                className="object-cover opacity-25"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#020308] via-[#020308]/95 to-[#020308]/55" />
                            <div className="relative z-10 h-full flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto">
                                <p className="text-xs uppercase tracking-[0.25em] text-red-500 font-bold mb-3">Tactical preview</p>
                                <p className="text-lg font-bold text-white mb-2">Interactive map runs on RaiderForge</p>
                                <p className="text-sm text-white/50 mb-6 leading-relaxed">
                                    Open the native tactical map for pan, zoom, curated POIs, and RaiderForge-owned layer controls.
                                </p>
                                <Link
                                    href={`/maps/${selected.id}`}
                                    className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold px-8 py-3.5 border border-red-400/30 shadow-xl shadow-black/50"
                                >
                                    Open RaiderForge interactive map
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <MapsHubLegend defaultOpen variant="inline" />

            {filtered.length === 0 && (
                <p className="text-center text-sm text-white/45 py-6">No zones match your filters.</p>
            )}
        </div>
    )
}
