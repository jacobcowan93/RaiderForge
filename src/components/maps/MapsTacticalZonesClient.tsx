'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

export type MapZoneHubDTO = {
    id: string
    displayName: string
    subtitle: string
    description: string
    features: string[]
    thumb: string
    risk: 'Low' | 'Medium' | 'High' | 'Extreme'
    hasEvents: boolean
    conditionBadges: { name: string; bg: string; border: string; text: string }[]
    questCount: number
    containerCount: number
    featuresLine: string
}

/** Curated cover art under /public/images/ARC Raiders Maps/ */
const MAP_COVERS: Record<string, string> = {
    'dam-battlegrounds': '/images/ARC%20Raiders%20Maps/dam-battleground_cover.png',
    'burial-city': '/images/ARC%20Raiders%20Maps/Buried_City_Cover.png',
    'blue-gate': '/images/ARC%20Raiders%20Maps/BlueGate_Cover.png',
    spaceport: '/images/ARC%20Raiders%20Maps/Spaceport_Cover.png',
    'stella-montis': '/images/ARC%20Raiders%20Maps/Stella_Cover.png',
}

function coverForZone(id: string, thumbFallback: string): string {
    return MAP_COVERS[id] ?? thumbFallback
}

const riskStyle: Record<MapZoneHubDTO['risk'], { badge: string; dot: string }> = {
    Low: { badge: 'bg-emerald-500/10 text-emerald-400/90 border-emerald-500/25', dot: 'bg-emerald-400' },
    Medium: { badge: 'bg-amber-500/10 text-amber-400/90 border-amber-500/25', dot: 'bg-amber-400' },
    High: { badge: 'bg-orange-500/10 text-orange-400/90 border-orange-500/25', dot: 'bg-orange-400' },
    Extreme: { badge: 'bg-red-500/12 text-red-400/95 border-red-500/30', dot: 'bg-red-400' },
}

type Props = {
    zones: MapZoneHubDTO[]
}

export function MapsTacticalZonesClient({ zones }: Props) {
    const [query, setQuery] = useState('')

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return zones
        return zones.filter(
            (z) =>
                z.displayName.toLowerCase().includes(q) ||
                z.subtitle.toLowerCase().includes(q) ||
                z.description.toLowerCase().includes(q) ||
                z.features.some((f) => f.toLowerCase().includes(q)) ||
                z.id.replace(/-/g, ' ').includes(q),
        )
    }, [zones, query])

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <label className="flex-1 min-w-0 max-w-md">
                    <span className="sr-only">Search maps</span>
                    <input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search zones (e.g. Dam, Buried, Spaceport)…"
                        className="w-full rounded-xl border border-white/[0.12] bg-[#0f141b] px-4 py-2.5 text-sm text-white
                                   placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/30"
                    />
                </label>
                <p className="text-[11px] text-white/40 shrink-0 tabular-nums">
                    {filtered.length} / {zones.length} zones
                </p>
            </div>

            <ul className="flex flex-col gap-4 list-none p-0 m-0">
                {filtered.map((map) => {
                    const risk = riskStyle[map.risk]
                    const coverSrc = coverForZone(map.id, map.thumb)
                    return (
                        <li key={map.id}>
                            <Link
                                href={`/maps/${map.id}`}
                                className="group flex flex-col sm:flex-row overflow-hidden rounded-xl border border-white/[0.08] bg-[#0f141b]
                                           transition-all duration-300 ease-out
                                           hover:border-red-500/35 hover:shadow-[0_0_32px_-10px_rgba(239,68,68,0.5)]
                                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0d12]"
                            >
                                {/* Cover — full width on mobile, fixed width on sm+ */}
                                <div
                                    className="relative w-full sm:w-64 md:w-72 shrink-0 h-48 sm:h-auto sm:min-h-[220px] overflow-hidden
                                               sm:rounded-l-xl sm:rounded-r-none rounded-t-xl sm:rounded-t-none"
                                >
                                    <img
                                        src={coverSrc}
                                        alt=""
                                        className="absolute inset-0 w-full h-full object-cover
                                                   transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                                    />
                                    {/* Left → right: black into transparent (readability into content column) */}
                                    <div
                                        className="absolute inset-0 bg-gradient-to-r from-black from-[8%] via-black/55 via-45% to-transparent pointer-events-none"
                                        aria-hidden
                                    />

                                    <div
                                        className={`absolute top-3 right-3 flex items-center gap-1.5
                                                    text-[10px] font-bold uppercase tracking-wider
                                                    rounded-full px-2.5 py-1 border backdrop-blur-sm ${risk.badge}`}
                                    >
                                        <span className={`h-1.5 w-1.5 rounded-full ${risk.dot}`} />
                                        {map.risk}
                                    </div>

                                    {map.hasEvents && (
                                        <div
                                            className="absolute top-3 left-3 flex items-center gap-1
                                                        text-[10px] font-semibold text-white
                                                        bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-1
                                                        border border-white/12"
                                        >
                                            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                                            Live
                                        </div>
                                    )}
                                </div>

                                {/* Body */}
                                <div className="flex flex-col flex-1 min-w-0 p-5 sm:pl-6 gap-3 sm:rounded-r-xl">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-[0.2em] text-white/45 font-semibold mb-1">
                                            {map.subtitle}
                                        </p>
                                        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight group-hover:text-red-100 transition-colors">
                                            {map.displayName}
                                        </h2>
                                    </div>

                                    <p className="text-sm text-white/65 leading-relaxed line-clamp-3 sm:line-clamp-4">
                                        {map.description}
                                    </p>

                                    {map.features.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {map.features.map((f) => (
                                                <span
                                                    key={f}
                                                    className="text-[10px] font-medium uppercase tracking-wide
                                                               text-white/55 border border-white/[0.1] rounded-md px-2 py-0.5 bg-black/25"
                                                >
                                                    {f}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <div className="min-h-[2rem] flex flex-wrap items-center gap-2">
                                        {map.conditionBadges.length > 0 ? (
                                            map.conditionBadges.map((c) => (
                                                <span
                                                    key={c.name}
                                                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-full px-2.5 py-1 border"
                                                    style={{
                                                        backgroundColor: c.bg,
                                                        borderColor: c.border,
                                                        color: c.text,
                                                    }}
                                                >
                                                    <span
                                                        className="h-1.5 w-1.5 rounded-full shrink-0 animate-pulse"
                                                        style={{ backgroundColor: c.text }}
                                                    />
                                                    {c.name}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 text-[11px] text-white/40">
                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/50 shrink-0" />
                                                Conditions nominal
                                            </span>
                                        )}
                                    </div>

                                    {(map.questCount > 0 || map.containerCount > 0) && (
                                        <div className="flex flex-wrap gap-2 text-[10px] font-semibold text-white/50">
                                            {map.questCount > 0 && (
                                                <span className="border border-sky-500/20 bg-sky-500/5 text-sky-300/80 rounded-md px-2 py-0.5">
                                                    {map.questCount} quests
                                                </span>
                                            )}
                                            {map.containerCount > 0 && (
                                                <span className="border border-amber-500/20 bg-amber-500/5 text-amber-300/80 rounded-md px-2 py-0.5">
                                                    {map.containerCount} containers
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    <div className="mt-auto pt-2 flex flex-wrap items-center justify-end gap-3 border-t border-white/[0.06]">
                                        <span
                                            className="inline-flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10
                                                       px-4 py-2 text-xs font-semibold text-red-400
                                                       transition-all duration-200
                                                       group-hover:border-red-500/70 group-hover:bg-red-500/20 group-hover:text-red-300
                                                       group-hover:shadow-[0_0_16px_-4px_rgba(239,68,68,0.55)]"
                                        >
                                            Open tactical map
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={2.5}
                                                stroke="currentColor"
                                                className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                                                />
                                            </svg>
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        </li>
                    )
                })}
            </ul>

            {filtered.length === 0 ? (
                <p className="text-center text-sm text-white/45 py-10">No zones match that search.</p>
            ) : null}
        </div>
    )
}
