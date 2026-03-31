'use client'

import { useEffect, useMemo, useState } from 'react'
import type { GameTrade } from '@/lib/game-data/types'
import { PageMaturityBadge } from '@/components/PageMaturityBadge'

// ── Trader colour map ──────────────────────────────────────────────────────────

const TRADER_META: Record<string, { color: string; border: string; bg: string; dot: string; tagline: string }> = {
    'Celeste':  { color: 'text-purple-300',  border: 'border-purple-500/40',  bg: 'bg-purple-500/[0.08]',  dot: '#c084fc', tagline: 'Technology & electronics' },
    'Apollo':   { color: 'text-orange-300',  border: 'border-orange-500/40',  bg: 'bg-orange-500/[0.08]',  dot: '#fb923c', tagline: 'Medical & survival gear' },
    'Lance':    { color: 'text-sky-300',     border: 'border-sky-500/40',     bg: 'bg-sky-500/[0.08]',     dot: '#38bdf8', tagline: 'Weapons & ammunition' },
    'Shani':    { color: 'text-emerald-300', border: 'border-emerald-500/40', bg: 'bg-emerald-500/[0.08]', dot: '#6ee7b7', tagline: 'Crafting materials' },
    'Tian Wen': { color: 'text-rose-300',    border: 'border-rose-500/40',    bg: 'bg-rose-500/[0.08]',    dot: '#fda4af', tagline: 'Intelligence & loot' },
}

const DEFAULT_META = { color: 'text-white/50', border: 'border-white/15', bg: 'bg-white/[0.04]', dot: '#ffffff50', tagline: '' }

function traderMeta(name: string) { return TRADER_META[name] ?? DEFAULT_META }

function fmtId(id: string): string {
    return id.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

// ── Trade row ─────────────────────────────────────────────────────────────────

function TradeRow({ trade }: { trade: GameTrade }) {
    return (
        <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl border border-white/[0.05] hover:border-white/[0.09] transition-colors"
             style={{ background: 'rgba(10,13,18,0.5)' }}>
            {/* Give */}
            <div className="flex-1 min-w-0">
                <p className="text-[11px] text-white/35 uppercase tracking-widest mb-0.5">Give</p>
                <p className="text-sm font-semibold text-white/80 leading-tight">
                    {trade.costQuantity > 1 && (
                        <span className="text-yellow-400/80 font-bold mr-1">{trade.costQuantity}×</span>
                    )}
                    {fmtId(trade.costItemId)}
                </p>
            </div>

            {/* Arrow */}
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)"
                 strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
            </svg>

            {/* Receive */}
            <div className="flex-1 min-w-0 text-right">
                <p className="text-[11px] text-white/35 uppercase tracking-widest mb-0.5">Receive</p>
                <p className="text-sm font-semibold text-yellow-300/90 leading-tight">
                    {trade.quantity > 1 && (
                        <span className="text-yellow-400 font-bold mr-1">{trade.quantity}×</span>
                    )}
                    {fmtId(trade.itemId)}
                </p>
            </div>

            {/* Daily limit */}
            {trade.dailyLimit != null && (
                <span className="shrink-0 text-[9px] text-white/25 border border-white/[0.07] rounded px-1.5 py-0.5">
                    {trade.dailyLimit}/day
                </span>
            )}
        </div>
    )
}

// ── Trader section ─────────────────────────────────────────────────────────────

function TraderSection({ trader, trades }: { trader: string; trades: GameTrade[] }) {
    const meta = traderMeta(trader)
    return (
        <section>
            <div className={`flex items-center gap-3 mb-4 pb-3 border-b ${meta.border}`}>
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: meta.dot }} />
                <div className="flex-1 min-w-0">
                    <h2 className={`text-base font-bold ${meta.color}`}>{trader}</h2>
                    {meta.tagline && <p className="text-[11px] text-white/35">{meta.tagline}</p>}
                </div>
                <span className="text-[10px] text-white/30 tabular-nums">{trades.length} trade{trades.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="space-y-1.5">
                {trades.map((t, i) => <TradeRow key={i} trade={t} />)}
            </div>
        </section>
    )
}

// ── Main page ─────────────────────────────────────────────────────────────────

const TRADER_ORDER = ['Celeste', 'Apollo', 'Lance', 'Shani', 'Tian Wen']

export default function TradersPage() {
    const [trades,  setTrades]  = useState<GameTrade[]>([])
    const [loading, setLoading] = useState(true)
    const [error,   setError]   = useState<string | null>(null)
    const [search,  setSearch]  = useState('')

    useEffect(() => {
        void (async () => {
            try {
                const res  = await fetch('/api/game/trades')
                const json = await res.json() as { ok: boolean; data?: { trades: GameTrade[] }; error?: string }
                if (!json.ok) throw new Error(json.error ?? 'Failed to load')
                setTrades(json.data?.trades ?? [])
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Failed to load trader data')
            } finally {
                setLoading(false)
            }
        })()
    }, [])

    const grouped = useMemo(() => {
        const s = search.trim().toLowerCase()
        const map: Record<string, GameTrade[]> = {}
        for (const t of trades) {
            if (s && !t.itemId.includes(s) && !t.costItemId.includes(s) && !t.trader.toLowerCase().includes(s)) continue
            if (!map[t.trader]) map[t.trader] = []
            map[t.trader].push(t)
        }
        // Return in canonical order, then any extra traders alphabetically
        const ordered: Array<{ trader: string; trades: GameTrade[] }> = []
        for (const tr of TRADER_ORDER) {
            if (map[tr]) ordered.push({ trader: tr, trades: map[tr] })
        }
        for (const tr of Object.keys(map).sort()) {
            if (!TRADER_ORDER.includes(tr)) ordered.push({ trader: tr, trades: map[tr] })
        }
        return ordered
    }, [trades, search])

    return (
        <div className="py-14 px-6 max-w-5xl mx-auto">

            {/* ── Page header ─────────────────────────────────────────────── */}
            <div className="mb-10 pl-1">
                <div className="border-l-2 border-yellow-500 pl-5">
                    <span className="text-xs uppercase tracking-widest text-yellow-500 font-semibold">
                        Progression
                    </span>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                            Traders
                        </h1>
                        <PageMaturityBadge level="beta" />
                    </div>
                    <p className="mt-2 text-sm max-w-2xl text-white/75 leading-relaxed">
                        Barter catalog for all five ARC Raiders traders — what to give, what you receive,
                        and daily limits where they apply.
                    </p>
                </div>
            </div>

            {/* ── Search ──────────────────────────────────────────────────── */}
            {!loading && !error && (
                <div className="mb-8">
                    <div className="relative max-w-xs">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
                             width={13} height={13} viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search items…"
                            className="w-full pl-8 pr-3 py-2 rounded-lg text-[12px] text-white/70 placeholder-white/25
                                       border border-white/[0.10] focus:border-white/25 focus:outline-none transition-colors"
                            style={{ background: 'rgba(7,9,13,0.85)' }}
                        />
                    </div>
                </div>
            )}

            {/* ── States ──────────────────────────────────────────────────── */}
            {loading && (
                <div className="space-y-10 animate-pulse">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i}>
                            <div className="h-10 w-40 rounded-lg bg-white/[0.05] mb-4" />
                            <div className="space-y-2">
                                {Array.from({ length: 5 }).map((_, j) => (
                                    <div key={j} className="h-14 rounded-xl bg-white/[0.03]" />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {error && (
                <div className="py-16 text-center">
                    <p className="text-sm text-red-400/80">{error}</p>
                </div>
            )}

            {!loading && !error && (
                <div className="space-y-10">
                    {grouped.length === 0 ? (
                        <p className="text-white/30 text-sm text-center py-12">No trades match your search.</p>
                    ) : (
                        grouped.map(({ trader, trades: ts }) => (
                            <TraderSection key={trader} trader={trader} trades={ts} />
                        ))
                    )}
                </div>
            )}

            <p className="mt-12 text-[11px] text-white/18 leading-relaxed">
                Trade data sourced from the{' '}
                <a href="https://github.com/Mahcks/arcraiders-data-api" target="_blank" rel="noopener noreferrer"
                   className="hover:text-white/40 transition-colors underline underline-offset-2">
                    arcdata community API
                </a>{' '}
                (backed by{' '}
                <a href="https://github.com/RaidTheory/arcraiders-data" target="_blank" rel="noopener noreferrer"
                   className="hover:text-white/40 transition-colors underline underline-offset-2">
                    RaidTheory
                </a>
                ). Not affiliated with Embark Studios. Data may lag game patches.
            </p>
        </div>
    )
}
