'use client'

import { useMemo, useState } from 'react'
import type { GameQuest } from '@/lib/game-data/types'

// ── Trader colour map ──────────────────────────────────────────────────────────

const TRADER_COLORS: Record<string, { text: string; border: string; bg: string; dot: string }> = {
    'Celeste':  { text: 'text-purple-300',  border: 'border-purple-500/40',  bg: 'bg-purple-500/[0.08]',  dot: '#c084fc' },
    'Apollo':   { text: 'text-orange-300',  border: 'border-orange-500/40',  bg: 'bg-orange-500/[0.08]',  dot: '#fb923c' },
    'Lance':    { text: 'text-sky-300',     border: 'border-sky-500/40',     bg: 'bg-sky-500/[0.08]',     dot: '#38bdf8' },
    'Shani':    { text: 'text-emerald-300', border: 'border-emerald-500/40', bg: 'bg-emerald-500/[0.08]', dot: '#6ee7b7' },
    'Tian Wen': { text: 'text-rose-300',    border: 'border-rose-500/40',    bg: 'bg-rose-500/[0.08]',    dot: '#fda4af' },
}

const DEFAULT_COLOR = { text: 'text-white/50', border: 'border-white/15', bg: 'bg-white/[0.04]', dot: '#ffffff50' }

function traderColor(name: string | null) {
    return (name && TRADER_COLORS[name]) ?? DEFAULT_COLOR
}

// ── Format helpers ─────────────────────────────────────────────────────────────

function fmtItemId(id: string): string {
    return id.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

// ── Quest card ────────────────────────────────────────────────────────────────

function QuestCard({ quest }: { quest: GameQuest }) {
    const [expanded, setExpanded] = useState(false)
    const color = traderColor(quest.traderName)

    return (
        <div
            className={`rounded-2xl border flex flex-col gap-0 overflow-hidden transition-colors ${color.border}`}
            style={{ background: 'rgba(10,13,18,0.85)' }}
        >
            {/* ── Header ── */}
            <div className="px-4 pt-4 pb-3">
                {/* Trader badge + XP */}
                <div className="flex items-center justify-between gap-2 mb-2">
                    {quest.traderName ? (
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full px-2.5 py-0.5 border ${color.text} ${color.border} ${color.bg}`}>
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color.dot }} />
                            {quest.traderName}
                        </span>
                    ) : (
                        <span className="text-[10px] text-white/25">Unknown trader</span>
                    )}
                    {quest.xp != null && quest.xp > 0 && (
                        <span className="text-[10px] font-semibold text-yellow-400/80 tabular-nums shrink-0">
                            +{quest.xp.toLocaleString()} XP
                        </span>
                    )}
                </div>

                {/* Quest name */}
                <h3 className="text-sm font-bold text-white leading-snug">{quest.name}</h3>

                {/* Description — truncated */}
                {quest.description && (
                    <p className="mt-1.5 text-[11px] text-white/45 leading-relaxed line-clamp-2">
                        {quest.description}
                    </p>
                )}
            </div>

            {/* ── Objectives ── */}
            {quest.objectives.length > 0 && (
                <div className="px-4 pb-3 border-t border-white/[0.05] pt-3">
                    <p className="text-[9px] uppercase tracking-widest text-white/30 font-bold mb-1.5">Objectives</p>
                    <ul className="space-y-1">
                        {(expanded ? quest.objectives : quest.objectives.slice(0, 3)).map((obj, i) => (
                            <li key={i} className="flex items-start gap-2 text-[11px] text-white/60 leading-snug">
                                <span className="shrink-0 mt-1 w-1 h-1 rounded-full bg-white/20" />
                                {obj}
                            </li>
                        ))}
                        {!expanded && quest.objectives.length > 3 && (
                            <li>
                                <button
                                    type="button"
                                    onClick={() => setExpanded(true)}
                                    className="text-[10px] text-white/30 hover:text-white/50 transition-colors"
                                >
                                    +{quest.objectives.length - 3} more
                                </button>
                            </li>
                        )}
                    </ul>
                </div>
            )}

            {/* ── Rewards ── */}
            {quest.rewards.length > 0 && (
                <div className="px-4 pb-3 border-t border-white/[0.05] pt-3">
                    <p className="text-[9px] uppercase tracking-widest text-white/30 font-bold mb-1.5">Rewards</p>
                    <div className="flex flex-wrap gap-1.5">
                        {quest.rewards.map((r, i) => (
                            <span
                                key={i}
                                className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-medium border border-yellow-500/20 bg-yellow-500/[0.06] text-yellow-300/80"
                            >
                                {r.quantity > 1 && <span className="font-bold text-yellow-400/90">{r.quantity}×</span>}
                                {fmtItemId(r.itemId)}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Quest chain ── */}
            {(quest.previousQuestIds.length > 0 || quest.nextQuestIds.length > 0) && (
                <div className="px-4 pb-4 pt-3 border-t border-white/[0.05] flex flex-wrap gap-3 text-[10px]">
                    {quest.previousQuestIds.length > 0 && (
                        <span className="text-white/30 flex items-center gap-1">
                            <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                <polyline points="15 18 9 12 15 6"/>
                            </svg>
                            {quest.previousQuestIds.map(fmtQuestId).join(', ')}
                        </span>
                    )}
                    {quest.nextQuestIds.length > 0 && (
                        <span className="text-white/30 flex items-center gap-1">
                            <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                <polyline points="9 18 15 12 9 6"/>
                            </svg>
                            {quest.nextQuestIds.map(fmtQuestId).join(', ')}
                        </span>
                    )}
                </div>
            )}
        </div>
    )
}

function fmtQuestId(id: string): string {
    return id.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

// ── Main client section ────────────────────────────────────────────────────────

const ALL_TRADERS = ['Celeste', 'Apollo', 'Lance', 'Shani', 'Tian Wen'] as const

export function QuestsClientSection({ quests }: { quests: GameQuest[] }) {
    const [activeTrader, setActiveTrader] = useState<string | null>(null)
    const [search, setSearch]             = useState('')

    const filtered = useMemo(() => {
        let q = quests
        if (activeTrader) q = q.filter((x) => x.traderName === activeTrader)
        if (search.trim()) {
            const s = search.trim().toLowerCase()
            q = q.filter((x) =>
                x.name.toLowerCase().includes(s) ||
                x.description?.toLowerCase().includes(s) ||
                x.objectives.some((o) => o.toLowerCase().includes(s))
            )
        }
        return q
    }, [quests, activeTrader, search])

    // Count per trader for the filter chips
    const traderCounts = useMemo(() => {
        const counts: Record<string, number> = {}
        for (const q of quests) {
            const t = q.traderName ?? 'Unknown'
            counts[t] = (counts[t] ?? 0) + 1
        }
        return counts
    }, [quests])

    if (quests.length === 0) {
        return (
            <div className="text-center py-20 text-white/35 text-sm">
                Quest data unavailable. Check back shortly.
            </div>
        )
    }

    return (
        <div className="space-y-6">

            {/* ── Filter bar ─────────────────────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative">
                    <svg
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
                        width={13} height={13} viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden
                    >
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search quests…"
                        className="pl-8 pr-3 py-1.5 rounded-lg text-[12px] text-white/70 placeholder-white/25
                                   border border-white/[0.10] focus:border-white/25 focus:outline-none transition-colors"
                        style={{ background: 'rgba(7,9,13,0.85)', minWidth: '180px' }}
                    />
                </div>

                {/* Trader filter chips */}
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => setActiveTrader(null)}
                        className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold border transition-all duration-150
                            ${activeTrader === null
                                ? 'bg-white/[0.10] border-white/25 text-white'
                                : 'bg-white/[0.03] border-white/[0.08] text-white/45 hover:border-white/15 hover:text-white/65'
                            }`}
                    >
                        All ({quests.length})
                    </button>
                    {ALL_TRADERS.map((trader) => {
                        const color   = traderColor(trader)
                        const count   = traderCounts[trader] ?? 0
                        const isActive = activeTrader === trader
                        return (
                            <button
                                key={trader}
                                type="button"
                                onClick={() => setActiveTrader(isActive ? null : trader)}
                                className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold border transition-all duration-150
                                    ${isActive
                                        ? `${color.text} ${color.border} ${color.bg}`
                                        : 'bg-white/[0.03] border-white/[0.08] text-white/45 hover:border-white/15 hover:text-white/65'
                                    }`}
                            >
                                {trader} ({count})
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* ── Results count ──────────────────────────────────────────────── */}
            <p className="text-[11px] text-white/30">
                Showing {filtered.length} quest{filtered.length !== 1 ? 's' : ''}
                {activeTrader ? ` from ${activeTrader}` : ''}
                {search.trim() ? ` matching "${search.trim()}"` : ''}
            </p>

            {/* ── Quest grid ─────────────────────────────────────────────────── */}
            {filtered.length === 0 ? (
                <div className="py-16 text-center text-white/30 text-sm">
                    No quests match your filters.
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((q) => (
                        <QuestCard key={q.id} quest={q} />
                    ))}
                </div>
            )}
        </div>
    )
}
