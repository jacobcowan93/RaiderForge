'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

export type MapZoneHubDTO = {
    id: string
    displayName: string
    subtitle: string
    thumb: string
    risk: 'Low' | 'Medium' | 'High' | 'Extreme'
    hasEvents: boolean
    conditionBadges: { name: string; bg: string; border: string; text: string }[]
    questCount: number
    containerCount: number
    featuresLine: string
}

const riskStyle: Record<MapZoneHubDTO['risk'], { badge: string; dot: string }> = {
    Low: { badge: 'bg-rf-green/15 text-rf-green border-rf-green/25', dot: 'bg-rf-green' },
    Medium: { badge: 'bg-rf-yellow/15 text-rf-yellow border-rf-yellow/25', dot: 'bg-rf-yellow' },
    High: { badge: 'bg-rf-orange/15 text-rf-orange border-rf-orange/25', dot: 'bg-rf-orange' },
    Extreme: { badge: 'bg-rf-red/15 text-rf-red border-rf-red/25', dot: 'bg-rf-red' },
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
                z.id.replace(/-/g, ' ').includes(q)
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
                        className="w-full rounded-xl bg-rf-bg/80 border border-white/10 px-4 py-2.5 text-sm text-rf-text
                                   placeholder:text-rf-textSoft/50 focus:outline-none focus:ring-2 focus:ring-rf-red/35"
                    />
                </label>
                <p className="text-[11px] text-white/35 shrink-0 tabular-nums">
                    {filtered.length} / {zones.length} zones
                </p>
            </div>

            <div className="flex flex-wrap justify-center gap-6">
                {filtered.map((map) => {
                    const risk = riskStyle[map.risk]
                    return (
                        <Link
                            key={map.id}
                            href={`/maps/${map.id}`}
                            className="group flex flex-col rf-card rounded-2xl overflow-hidden
                                       hover:border-white/20 hover:shadow-2xl hover:shadow-black/60
                                       transition-all duration-300 hover:-translate-y-1
                                       w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]"
                        >
                            <div className="relative h-52 overflow-hidden bg-rf-bgSoft shrink-0">
                                <img
                                    src={map.thumb}
                                    alt={map.displayName}
                                    className="w-full h-full object-cover
                                               group-hover:scale-[1.05] transition-transform duration-700 ease-out"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/12 to-transparent" />
                                <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/35 to-transparent" />

                                <div
                                    className={`absolute top-3 right-3 flex items-center gap-1.5
                                                text-[10px] font-bold uppercase tracking-wider
                                                border rounded-full px-2.5 py-1 backdrop-blur-md ${risk.badge}`}
                                >
                                    <span className={`h-1.5 w-1.5 rounded-full ${risk.dot}`} />
                                    {map.risk}
                                </div>

                                {map.hasEvents && (
                                    <div
                                        className="absolute top-3 left-3 flex items-center gap-1
                                                    text-[10px] font-semibold text-white/85
                                                    bg-black/55 backdrop-blur-sm rounded-full px-2.5 py-1
                                                    border border-white/10"
                                    >
                                        <span className="h-1.5 w-1.5 rounded-full bg-rf-red animate-pulse" />
                                        Live
                                    </div>
                                )}

                                <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-10 bg-gradient-to-t from-black/65 via-black/22 to-transparent">
                                    <div className="border-l-2 border-rf-red pl-2.5">
                                        <h2 className="font-bold text-white text-[17px] leading-tight tracking-tight drop-shadow-md">
                                            {map.displayName}
                                        </h2>
                                        <p className="text-[11px] text-white font-medium mt-1 tracking-wide leading-snug">
                                            {map.subtitle}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col flex-1 px-4 pt-4 pb-3.5">
                                <div className="min-h-[2.25rem] mb-2.5">
                                    {map.conditionBadges.length > 0 ? (
                                        <div className="flex flex-wrap gap-1.5">
                                            {map.conditionBadges.map((c) => (
                                                <span
                                                    key={c.name}
                                                    className="inline-flex items-center gap-1.5
                                                               text-[11px] font-semibold
                                                               rounded-full px-2.5 py-1 border"
                                                    style={{
                                                        backgroundColor: c.bg,
                                                        borderColor: c.border,
                                                        color: c.text,
                                                    }}
                                                >
                                                    <span
                                                        className="h-1.5 w-1.5 rounded-full flex-shrink-0 animate-pulse"
                                                        style={{ backgroundColor: c.text }}
                                                    />
                                                    {c.name}
                                                </span>
                                            ))}
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

                                {(map.questCount > 0 || map.containerCount > 0) && (
                                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                        {map.questCount > 0 && (
                                            <span
                                                className="inline-flex items-center gap-1
                                                             text-[10px] font-semibold
                                                             text-rf-blue/65 border border-rf-blue/18
                                                             bg-rf-blue/[0.07] rounded-full px-2 py-0.5"
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    strokeWidth={2}
                                                    stroke="currentColor"
                                                    className="w-2.5 h-2.5 shrink-0"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z"
                                                    />
                                                </svg>
                                                {map.questCount} quests
                                            </span>
                                        )}
                                        {map.containerCount > 0 && (
                                            <span
                                                className="inline-flex items-center gap-1
                                                             text-[10px] font-semibold
                                                             text-rf-yellow/65 border border-rf-yellow/18
                                                             bg-rf-yellow/[0.07] rounded-full px-2 py-0.5"
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    strokeWidth={2}
                                                    stroke="currentColor"
                                                    className="w-2.5 h-2.5 shrink-0"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
                                                    />
                                                </svg>
                                                {map.containerCount} containers
                                            </span>
                                        )}
                                    </div>
                                )}

                                <div className="mt-auto flex items-center justify-between pt-3 border-t border-white/[0.06]">
                                    <span className="text-[10px] text-white/55 truncate pr-3 leading-snug">
                                        {map.featuresLine}
                                    </span>
                                    <span
                                        className="text-xs font-medium text-rf-red
                                                     inline-flex items-center gap-1
                                                     group-hover:gap-2 transition-all shrink-0"
                                    >
                                        Open map
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={2.5}
                                            stroke="currentColor"
                                            className="w-3 h-3"
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
                    )
                })}
            </div>

            {filtered.length === 0 ? (
                <p className="text-center text-sm text-rf-textSoft py-8">No zones match that search.</p>
            ) : null}
        </div>
    )
}
