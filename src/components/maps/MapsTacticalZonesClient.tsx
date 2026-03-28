'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { getEventDescription } from '@/lib/events/eventsConfig'

// ── DTO ────────────────────────────────────────────────────────────────────────
// Server component (page.tsx) serialises MapMeta + live event data into this
// flat shape; the client component only renders, never fetches.

export type MapZoneHubDTO = {
    id: string
    displayName: string
    subtitle: string
    description: string
    thumb: string          // best-available cover: upstream CDN → local static
    risk: 'Low' | 'Medium' | 'High' | 'Extreme'
    hasEvents: boolean
    conditionBadges: { name: string; bg: string; border: string; text: string }[]
    questCount: number
    containerCount: number
    features: string[]     // up to 3 feature tags
}

// ── Risk badge styles ──────────────────────────────────────────────────────────

const RISK_STYLE: Record<MapZoneHubDTO['risk'], { badge: string; dot: string }> = {
    Low:     { badge: 'bg-rf-green/15   text-rf-green   border-rf-green/25',   dot: 'bg-rf-green'   },
    Medium:  { badge: 'bg-rf-yellow/15  text-rf-yellow  border-rf-yellow/25',  dot: 'bg-rf-yellow'  },
    High:    { badge: 'bg-rf-orange/15  text-rf-orange  border-rf-orange/25',  dot: 'bg-rf-orange'  },
    Extreme: { badge: 'bg-rf-red/15     text-rf-red     border-rf-red/25',     dot: 'bg-rf-red'     },
}

// ── SVG paths (inline to avoid extra imports) ─────────────────────────────────

const QUEST_ICON   = 'M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c-.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z'
const BOX_ICON     = 'm20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z'
const ARROW_RIGHT  = 'M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3'

// ── Component ─────────────────────────────────────────────────────────────────

type Props = { zones: MapZoneHubDTO[] }

export function MapsTacticalZonesClient({ zones }: Props) {
    const [query, setQuery] = useState('')

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return zones
        return zones.filter(
            (z) =>
                z.displayName.toLowerCase().includes(q) ||
                z.subtitle.toLowerCase().includes(q) ||
                z.id.replace(/-/g, ' ').includes(q),
        )
    }, [zones, query])

    return (
        <div className="space-y-5">

            {/* ── Search ──────────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <label className="flex-1 min-w-0 max-w-md">
                    <span className="sr-only">Search maps</span>
                    <input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search zones (e.g. Dam, Buried, Spaceport)…"
                        className="w-full rounded-xl bg-rf-bg/80 border border-white/10 px-4 py-2.5 text-sm
                                   text-rf-text placeholder:text-rf-textSoft/50
                                   focus:outline-none focus:ring-2 focus:ring-rf-red/30
                                   focus:border-rf-red/25 transition-colors"
                    />
                </label>
                <p className="text-[11px] text-white/30 shrink-0 tabular-nums">
                    {filtered.length} / {zones.length} zones
                </p>
            </div>

            {/* ── Row list ────────────────────────────────────────────────────── */}
            <div className="flex flex-col gap-3">
                {filtered.map((map) => {
                    const risk = RISK_STYLE[map.risk]
                    const hasConditions = map.conditionBadges.length > 0

                    return (
                        <Link
                            key={map.id}
                            href={`/maps/${map.id}`}
                            className="group flex flex-col sm:flex-row rf-card rounded-2xl overflow-hidden
                                       border border-white/[0.07]
                                       hover:border-rf-red/20 hover:shadow-2xl hover:shadow-black/70
                                       transition-all duration-300 w-full"
                        >
                            {/* ── Cover image (left on sm+, full-width on mobile) ── */}
                            <div className="relative h-44 sm:h-auto sm:w-64 lg:w-72 shrink-0 overflow-hidden bg-rf-bgSoft">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={map.thumb}
                                    alt={map.displayName}
                                    className="w-full h-full object-cover
                                               group-hover:scale-[1.04] transition-transform duration-700 ease-out"
                                />
                                {/* Right-edge fade into content panel on desktop */}
                                <div
                                    className="absolute inset-0 hidden sm:block"
                                    style={{
                                        background: 'linear-gradient(to right, transparent 50%, rgba(15,20,27,0.55) 100%)',
                                    }}
                                />
                                {/* Bottom fade on mobile */}
                                <div className="absolute inset-0 sm:hidden bg-gradient-to-b from-transparent to-black/55" />

                                {/* Live badge */}
                                {map.hasEvents && (
                                    <div className="absolute top-3 left-3 flex items-center gap-1
                                                    text-[10px] font-semibold text-white/85
                                                    bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-1
                                                    border border-white/10">
                                        <span className="h-1.5 w-1.5 rounded-full bg-rf-red animate-pulse" />
                                        Live
                                    </div>
                                )}
                            </div>

                            {/* ── Content ──────────────────────────────────────── */}
                            <div className="flex flex-col flex-1 min-w-0 px-5 py-4 gap-2.5">

                                {/* Title + risk badge */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0 border-l-2 border-rf-red pl-2.5">
                                        <h2 className="text-[17px] font-bold text-white tracking-tight leading-tight">
                                            {map.displayName}
                                        </h2>
                                        <p className="text-[11px] text-white/42 mt-0.5 tracking-wide font-medium">
                                            {map.subtitle}
                                        </p>
                                    </div>
                                    <div
                                        className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider
                                                    border rounded-full px-2.5 py-1 shrink-0 ${risk.badge}`}
                                    >
                                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${risk.dot}`} />
                                        {map.risk}
                                    </div>
                                </div>

                                {/* Description */}
                                <p className="text-[12px] text-white/48 leading-relaxed line-clamp-2">
                                    {map.description}
                                </p>

                                {/* Feature tags */}
                                {map.features.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {map.features.map((f) => (
                                            <span
                                                key={f}
                                                className="text-[9px] uppercase tracking-wider font-semibold
                                                           text-white/35 border border-white/[0.09]
                                                           rounded-full px-2 py-0.5"
                                            >
                                                {f}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Live condition badges (only when active) */}
                                {hasConditions && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {map.conditionBadges.map((c) => (
                                            <span
                                                key={c.name}
                                                title={getEventDescription(c.name)}
                                                className="inline-flex items-center gap-1.5 cursor-help
                                                           text-[11px] font-semibold rounded-full px-2.5 py-1 border"
                                                style={{
                                                    backgroundColor: c.bg,
                                                    borderColor:     c.border,
                                                    color:           c.text,
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
                                )}

                                {/* Footer: data chips + CTA ────────────────────── */}
                                <div className="mt-auto flex items-center justify-between gap-3 pt-2.5 border-t border-white/[0.06]">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        {/* Nominal indicator when no active conditions */}
                                        {!hasConditions && (
                                            <span className="inline-flex items-center gap-1 text-[10px] text-rf-green/55 font-medium">
                                                <span className="h-1.5 w-1.5 rounded-full bg-rf-green/55 shrink-0" />
                                                Nominal
                                            </span>
                                        )}
                                        {map.questCount > 0 && (
                                            <span
                                                className="inline-flex items-center gap-1 text-[10px] font-semibold
                                                           text-rf-blue/65 border border-rf-blue/18
                                                           bg-rf-blue/[0.07] rounded-full px-2 py-0.5"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                                     strokeWidth={2} stroke="currentColor" className="w-2.5 h-2.5 shrink-0">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d={QUEST_ICON} />
                                                </svg>
                                                {map.questCount} quests
                                            </span>
                                        )}
                                        {map.containerCount > 0 && (
                                            <span
                                                className="inline-flex items-center gap-1 text-[10px] font-semibold
                                                           text-rf-yellow/65 border border-rf-yellow/18
                                                           bg-rf-yellow/[0.07] rounded-full px-2 py-0.5"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                                     strokeWidth={2} stroke="currentColor" className="w-2.5 h-2.5 shrink-0">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d={BOX_ICON} />
                                                </svg>
                                                {map.containerCount} containers
                                            </span>
                                        )}
                                    </div>

                                    <span
                                        className="text-xs font-semibold text-rf-red
                                                   inline-flex items-center gap-1
                                                   group-hover:gap-2 transition-all shrink-0"
                                    >
                                        Open map
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                             strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                                            <path strokeLinecap="round" strokeLinejoin="round" d={ARROW_RIGHT} />
                                        </svg>
                                    </span>
                                </div>
                            </div>
                        </Link>
                    )
                })}
            </div>

            {filtered.length === 0 && (
                <p className="text-center text-sm text-rf-textSoft py-8">No zones match that search.</p>
            )}
        </div>
    )
}
