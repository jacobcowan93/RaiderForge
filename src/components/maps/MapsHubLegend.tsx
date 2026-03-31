'use client'

import { useState } from 'react'
import { POI_CATEGORY_META } from '@/components/maps/MapPoiMarker'
import type { PoiCategory } from '@/lib/maps/poi-types'

const LEGEND_GROUPS: { title: string; subtitle?: string; categories: PoiCategory[] }[] = [
    {
        title: 'Extracts & exits',
        subtitle: 'Safe extract markers on RaiderForge tactical layers.',
        categories: ['extract'],
    },
    {
        title: 'Keys & areas',
        subtitle: 'Key spawns, doors, and named zones.',
        categories: ['key', 'area'],
    },
    {
        title: 'Quests & objectives',
        subtitle: 'Objective and mission-related pins.',
        categories: ['quest'],
    },
    {
        title: 'Loot',
        subtitle: 'Containers, loot zones, and high-value areas.',
        categories: ['container', 'loot'],
    },
    {
        title: 'Enemies & ARC',
        subtitle: 'Hostile machines and hazard callouts.',
        categories: ['arc', 'noise'],
    },
    {
        title: 'Resources & interactions',
        subtitle: 'Nature, traversal, and interactable world points.',
        categories: ['nature', 'interaction'],
    },
]

const RF_CATEGORY_BLURB: Partial<Record<PoiCategory, string>> = {
    extract: 'Green-tinted exit — plan rotation before committing.',
    key: 'Gold access — often tied to locked rooms or shortcuts.',
    quest: 'Mission flow — links to trader objectives when available.',
    area: 'Named location or region label.',
    container: 'Physical loot box or searchable object.',
    loot: 'Loot concentration or spawn band.',
    arc: 'Machine / ARC presence or encounter.',
    nature: 'Flora, cover, or environmental landmark.',
    interaction: 'Buttons, ziplines, switches, or traversal.',
    noise: 'Sound trap or hazard that can draw ARC.',
}

type Props = {
    /** Start expanded (command center default). */
    defaultOpen?: boolean
    /** Wider layout + stronger border for dedicated zone page. */
    variant?: 'inline' | 'featured'
    className?: string
}

export function MapsHubLegend({ defaultOpen = true, variant = 'inline', className = '' }: Props) {
    const [open, setOpen] = useState(defaultOpen)

    const shell =
        variant === 'featured'
            ? 'rounded-2xl border border-red-500/25 bg-gradient-to-b from-black/70 via-[#06080d] to-black/80 shadow-[0_0_40px_-12px_rgba(220,38,38,0.25)]'
            : 'rounded-2xl border border-red-500/15 bg-gradient-to-b from-black/50 to-black/30'

    return (
        <section
            className={`${shell} overflow-hidden ${className}`}
            aria-labelledby="maps-hub-legend-title"
        >
            <div className="flex w-full items-stretch gap-2 px-4 sm:px-5 py-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex-1 min-w-0">
                    <h2
                        id="maps-hub-legend-title"
                        className="text-xs font-black uppercase tracking-[0.2em] text-red-500/90"
                    >
                        Map icons &amp; legend
                    </h2>
                    <p className="text-[11px] text-white/50 mt-1 leading-relaxed">
                        Map icons explained — RaiderForge now uses sourced ARC map icon assets for the tactical pin language.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    className="shrink-0 self-start rounded-lg border border-white/10 px-3 py-1.5 text-white/50 hover:text-white/85 hover:bg-white/5 text-lg leading-none"
                    aria-expanded={open}
                    aria-controls="maps-hub-legend-panel"
                >
                    {open ? '−' : '+'}
                </button>
            </div>

            {open && (
                <div id="maps-hub-legend-panel" className="px-4 sm:px-5 pb-5 pt-0 border-t border-white/[0.08] space-y-6">
                    <div className="mt-5 space-y-5">
                        {LEGEND_GROUPS.map((group) => (
                            <div key={group.title}>
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-red-500/75 mb-1">
                                    {group.title}
                                </h3>
                                {group.subtitle && (
                                    <p className="text-[10px] text-white/35 mb-2.5 leading-relaxed">{group.subtitle}</p>
                                )}
                                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {group.categories.map((cat) => {
                                        const m = POI_CATEGORY_META[cat]
                                        const blurb = RF_CATEGORY_BLURB[cat]
                                        return (
                                            <li
                                                key={cat}
                                                title={blurb}
                                                className="flex items-start gap-3 rounded-xl border border-white/[0.08] bg-black/40 px-3 py-2.5 cursor-default"
                                            >
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={m.iconSrc}
                                                    alt=""
                                                    className="mt-0.5 h-4 w-4 shrink-0 object-contain"
                                                />
                                                <div className="min-w-0">
                                                    <span className="text-sm font-semibold text-white/90 block">{m.label}</span>
                                                    {blurb && (
                                                        <span className="text-[11px] text-white/45 leading-snug block mt-0.5">
                                                            {blurb}
                                                        </span>
                                                    )}
                                                </div>
                                            </li>
                                        )
                                    })}
                                </ul>
                            </div>
                        ))}
                    </div>

                    <p className="text-[10px] text-white/30 leading-relaxed">
                        On the tactical explorer: quest steps (circles), containers (diamonds), and loot radii appear when those layers
                        are enabled in Filters.
                    </p>
                </div>
            )}
        </section>
    )
}
