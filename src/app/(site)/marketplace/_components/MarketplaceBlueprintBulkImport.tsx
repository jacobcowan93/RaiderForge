'use client'

/**
 * MarketplaceBlueprintBulkImport
 *
 * Reads the user's owned blueprints from localStorage (Blueprint Tracker data)
 * and generates ready-to-paste community listing posts for each one.
 *
 * No API calls are made for AI — all listing text is template-generated client-side
 * so this is instant and works fully offline / without auth.
 */

import { useCallback, useEffect, useState } from 'react'

import type { MarketplaceCatalogItem } from '@/lib/marketplace/catalog-types'
import { loadBlueprintStates } from '@/lib/blueprints/blueprintTrackingStorage'
import {
    blueprintsFromCatalogItems,
    type NormalizedBlueprint,
} from '@/lib/blueprints/normalizeBlueprints'

import { btnGhost, sectionHeading } from '../_lib/marketplace-constants'
import { ErrorMsg, Spinner } from './MarketplaceShared'

// ─── Rarity helpers ───────────────────────────────────────────────────────────

type RarityTier = 'legendary' | 'epic' | 'rare' | 'uncommon' | 'common' | null

function parseRarity(r: string | null): RarityTier {
    if (!r) return null
    const k = r.trim().toLowerCase()
    if (k === 'legendary' || k === 'epic' || k === 'rare' || k === 'uncommon' || k === 'common')
        return k
    return null
}

const RARITY_EMOJI: Record<NonNullable<RarityTier>, string> = {
    legendary: '🟡',
    epic: '🟣',
    rare: '🔷',
    uncommon: '🟢',
    common: '⬜',
}

const RARITY_PRICE_HINT: Record<NonNullable<RarityTier>, string> = {
    legendary: 'Rare drop — premium offers only. Will negotiate for the right deal.',
    epic: 'High-demand blueprint. Open to serious offers.',
    rare: 'Moderate value. Happy to discuss pricing.',
    uncommon: 'Budget-friendly. DM for a quick deal.',
    common: 'Easy to trade. Message me — fast response.',
}

const RARITY_BADGE_CLS: Record<NonNullable<RarityTier>, string> = {
    legendary: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
    epic: 'border-purple-500/40 bg-purple-500/10 text-purple-300',
    rare: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
    uncommon: 'border-green-500/40 bg-green-500/10 text-green-300',
    common: 'border-white/15 bg-white/[0.05] text-white/55',
}

// ─── Listing text generator ───────────────────────────────────────────────────

function generateListingText(bp: NormalizedBlueprint): string {
    const tier = parseRarity(bp.rarity)
    const emoji = tier ? RARITY_EMOJI[tier] : '📄'
    const rarityLabel = bp.rarity ? bp.rarity.charAt(0).toUpperCase() + bp.rarity.slice(1).toLowerCase() : null
    const priceHint = tier ? RARITY_PRICE_HINT[tier] : 'Open to offers — DM me.'

    const lines: string[] = []

    // ── Title line
    lines.push(`${emoji} [${rarityLabel ?? 'Blueprint'}] ${bp.name} — ARC Raiders`)
    lines.push('')

    // ── Body
    if (bp.description && bp.description.trim()) {
        lines.push(bp.description.trim())
    } else {
        lines.push(`Selling my extra ${bp.name} blueprint — ideal for crafting or trading.`)
    }
    lines.push('')

    // ── Source locations
    if (bp.foundIn.length > 0) {
        lines.push(`📍 Found in: ${bp.foundIn.join(' · ')}`)
    }

    // ── Crafting ingredients summary (top 3 to keep it short)
    if (bp.craftingIngredients.length > 0) {
        const mats = bp.craftingIngredients
            .slice(0, 3)
            .map((c) => c.name ?? c.itemId)
            .filter(Boolean)
            .join(', ')
        if (mats) lines.push(`🔧 Crafting materials: ${mats}${bp.craftingIngredients.length > 3 ? ' + more' : ''}`)
    }

    lines.push('')

    // ── Pricing & CTA
    lines.push(`💰 ${priceHint}`)
    lines.push('💬 DM me on Discord or Steam to arrange the trade.')
    lines.push('')

    // ── Tags
    const tags = ['#ARCRaiders', '#Blueprint', '#Community']
    if (rarityLabel) tags.push(`#${rarityLabel}`)
    tags.push('#ForSale')
    lines.push(tags.join(' '))

    return lines.join('\n')
}

// ─── Enriched item type ───────────────────────────────────────────────────────

type BulkBlueprintItem = NormalizedBlueprint & {
    listingText: string
    expanded: boolean
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MarketplaceBlueprintBulkImport() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [items, setItems] = useState<BulkBlueprintItem[]>([])
    const [selected, setSelected] = useState<Set<string>>(new Set())
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const [loaded, setLoaded] = useState(false)

    const loadBlueprints = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            // 1. Read owned blueprints from localStorage
            const trackMap = loadBlueprintStates()
            const ownedIds = new Set(
                Object.entries(trackMap)
                    .filter(([, state]) => state === 'owned')
                    .map(([id]) => id)
            )

            if (ownedIds.size === 0) {
                setItems([])
                setSelected(new Set())
                setLoaded(true)
                setLoading(false)
                return
            }

            // 2. Fetch catalog to get blueprint details
            const res = await fetch('/api/marketplace/catalog', { cache: 'no-store' })
            if (!res.ok) throw new Error(`Catalog API returned ${res.status}`)

            const json = await res.json() as { items?: MarketplaceCatalogItem[] }
            const allBlueprints = blueprintsFromCatalogItems(json.items ?? [])

            // 3. Filter to owned + generate listing text
            const owned = allBlueprints
                .filter((bp) => ownedIds.has(bp.id))
                .sort((a, b) => {
                    // Sort: legendary → epic → rare → uncommon → common → null, then alpha
                    const RANK: Record<string, number> = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 }
                    const ra = RANK[a.rarity?.toLowerCase() ?? ''] ?? 5
                    const rb = RANK[b.rarity?.toLowerCase() ?? ''] ?? 5
                    if (ra !== rb) return ra - rb
                    return a.name.localeCompare(b.name)
                })
                .map((bp) => ({
                    ...bp,
                    listingText: generateListingText(bp),
                    expanded: false,
                }))

            setItems(owned)
            setSelected(new Set(owned.map((b) => b.id)))
            setLoaded(true)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load blueprints.')
        } finally {
            setLoading(false)
        }
    }, [])

    // Load when panel first opens
    useEffect(() => {
        if (open && !loaded) {
            void loadBlueprints()
        }
    }, [open, loaded, loadBlueprints])

    function toggleSelect(id: string) {
        setSelected((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    function toggleAll() {
        if (selected.size === items.length) setSelected(new Set())
        else setSelected(new Set(items.map((i) => i.id)))
    }

    async function handleCopy() {
        const selectedItems = items.filter((b) => selected.has(b.id))
        if (selectedItems.length === 0) return

        const separator = '\n\n' + '─'.repeat(40) + '\n\n'
        const combined = selectedItems.map((b) => b.listingText).join(separator)

        try {
            await navigator.clipboard.writeText(combined)
            setCopied(true)
            setTimeout(() => setCopied(false), 2500)
        } catch {
            setError('Could not copy — select the text manually from the preview.')
        }
    }

    const selectedCount = selected.size

    // ── Collapsed trigger ─────────────────────────────────────────────────────
    if (!open) {
        return (
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="w-full flex items-center gap-3 rounded-xl border border-rf-blue/25 bg-rf-blue/[0.06] px-4 py-3.5 text-left hover:bg-rf-blue/[0.10] hover:border-rf-blue/40 transition-all group"
            >
                {/* Blueprint icon */}
                <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-rf-blue/30 bg-rf-blue/10"
                    style={{ boxShadow: '0 0 12px -2px rgba(56,189,248,0.25)' }}
                    aria-hidden
                >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-rf-blue">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" />
                        <path d="M14 2v6h6M9 13h6M9 17h4" />
                    </svg>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-rf-blue group-hover:text-sky-300 transition-colors">
                        Bulk Import My Owned Blueprints
                    </p>
                    <p className="text-xs text-white/50 mt-0.5">
                        Auto-generate community listing posts from your Blueprint Tracker
                    </p>
                </div>
                <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-rf-blue/60 shrink-0 group-hover:translate-x-0.5 transition-transform" aria-hidden>
                    <path d="M6 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>
        )
    }

    // ── Expanded panel ────────────────────────────────────────────────────────
    return (
        <section
            className="rounded-xl border border-rf-blue/25 bg-rf-blue/[0.04] overflow-hidden"
            style={{ boxShadow: '0 0 32px -8px rgba(56,189,248,0.08)' }}
        >
            {/* Panel header */}
            <div className="flex items-center gap-3 border-b border-rf-blue/15 px-4 py-3">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-rf-blue shrink-0" aria-hidden>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" />
                    <path d="M14 2v6h6M9 13h6M9 17h4" />
                </svg>
                <span className={`${sectionHeading} text-rf-blue/90`}>Bulk Import — Owned Blueprints</span>
                <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="ml-auto text-white/35 hover:text-white/70 transition-colors"
                    aria-label="Close bulk import"
                >
                    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                        <path d="M3 3l10 10M13 3L3 13" strokeLinecap="round" />
                    </svg>
                </button>
            </div>

            <div className="p-4 space-y-4">
                {/* Loading */}
                {loading && (
                    <div className="flex items-center gap-2.5 py-6 justify-center text-rf-blue/70">
                        <Spinner size={16} />
                        <span className="text-sm">Loading your blueprints…</span>
                    </div>
                )}

                {/* Error */}
                {!loading && error && (
                    <div className="space-y-3">
                        <ErrorMsg msg={error} />
                        <button type="button" className={btnGhost} onClick={() => { setError(null); setLoaded(false); void loadBlueprints() }}>
                            Retry
                        </button>
                    </div>
                )}

                {/* Empty — no owned blueprints */}
                {!loading && !error && loaded && items.length === 0 && (
                    <div className="py-8 text-center space-y-2">
                        <p className="text-sm font-medium text-white/70">No owned blueprints found</p>
                        <p className="text-xs text-white/40 leading-relaxed max-w-sm mx-auto">
                            Mark blueprints as <strong className="text-rf-blue/80">Owned</strong> in the{' '}
                            <a href="/blueprints" className="text-rf-blue underline underline-offset-2 hover:text-sky-300">
                                Blueprint Tracker
                            </a>{' '}
                            and come back here to generate listing posts.
                        </p>
                    </div>
                )}

                {/* Blueprint list */}
                {!loading && !error && items.length > 0 && (
                    <>
                        {/* Controls bar */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <button
                                type="button"
                                onClick={toggleAll}
                                className="text-xs font-medium text-rf-blue/80 hover:text-rf-blue underline underline-offset-2 transition-colors"
                            >
                                {selected.size === items.length ? 'Deselect All' : 'Select All'}
                            </button>
                            <span className="text-white/25 text-xs">·</span>
                            <span className="text-xs text-white/45">
                                {selectedCount} of {items.length} selected
                            </span>
                            <button
                                type="button"
                                onClick={() => { setLoaded(false); void loadBlueprints() }}
                                className="ml-auto text-xs text-white/35 hover:text-white/60 transition-colors"
                                title="Refresh from Blueprint Tracker"
                            >
                                ↺ Refresh
                            </button>
                        </div>

                        {/* Scrollable list */}
                        <div className="space-y-2 max-h-[28rem] overflow-y-auto pr-1 -mr-1">
                            {items.map((bp) => {
                                const isSelected = selected.has(bp.id)
                                const tier = parseRarity(bp.rarity)
                                const badgeCls = tier ? RARITY_BADGE_CLS[tier] : 'border-white/15 bg-white/[0.05] text-white/55'
                                const isExpanded = expandedId === bp.id

                                return (
                                    <div
                                        key={bp.id}
                                        className={`rounded-lg border transition-all ${
                                            isSelected
                                                ? 'border-rf-blue/25 bg-rf-blue/[0.05]'
                                                : 'border-white/[0.08] bg-white/[0.02]'
                                        }`}
                                    >
                                        {/* Row header */}
                                        <div className="flex items-center gap-3 px-3 py-2.5">
                                            {/* Checkbox */}
                                            <button
                                                type="button"
                                                role="checkbox"
                                                aria-checked={isSelected}
                                                onClick={() => toggleSelect(bp.id)}
                                                className={`h-4 w-4 shrink-0 rounded border flex items-center justify-center transition-colors ${
                                                    isSelected
                                                        ? 'border-rf-blue bg-rf-blue/20'
                                                        : 'border-white/25 bg-transparent hover:border-rf-blue/50'
                                                }`}
                                            >
                                                {isSelected && (
                                                    <svg viewBox="0 0 10 10" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-rf-blue" aria-hidden>
                                                        <path d="M1.5 5l2.5 2.5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                )}
                                            </button>

                                            {/* Name + rarity badge */}
                                            <span className="flex-1 text-sm font-medium text-white/90 truncate">
                                                {bp.name}
                                            </span>
                                            {bp.rarity && (
                                                <span className={`text-[8px] uppercase tracking-[0.12em] px-1.5 py-0.5 rounded border font-bold shrink-0 ${badgeCls}`}>
                                                    {bp.rarity}
                                                </span>
                                            )}

                                            {/* Preview toggle */}
                                            <button
                                                type="button"
                                                onClick={() => setExpandedId(isExpanded ? null : bp.id)}
                                                className="shrink-0 text-[10px] text-white/35 hover:text-white/65 transition-colors px-1 font-medium"
                                            >
                                                {isExpanded ? 'Hide' : 'Preview'}
                                            </button>
                                        </div>

                                        {/* Expanded preview */}
                                        {isExpanded && (
                                            <div className="border-t border-white/[0.06] px-3 pb-3 pt-2">
                                                <pre className="text-[11px] text-white/70 leading-relaxed font-sans whitespace-pre-wrap break-words">
                                                    {bp.listingText}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>

                        {/* Copy CTA */}
                        <div className="flex items-center gap-3 pt-1 flex-wrap">
                            <button
                                type="button"
                                onClick={handleCopy}
                                disabled={selectedCount === 0}
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed ${
                                    copied
                                        ? 'bg-emerald-500/15 border border-emerald-500/35 text-emerald-300'
                                        : 'bg-rf-blue/15 border border-rf-blue/35 text-rf-blue hover:bg-rf-blue/25 hover:border-rf-blue/55'
                                }`}
                                style={copied ? {} : { boxShadow: '0 0 16px -4px rgba(56,189,248,0.30)' }}
                            >
                                {copied ? (
                                    <>
                                        <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden>
                                            <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm3.25 4.72a.75.75 0 0 1 0 1.06l-3.5 3.5a.75.75 0 0 1-1.06 0l-1.5-1.5a.75.75 0 1 1 1.06-1.06l.97.97 2.97-2.97a.75.75 0 0 1 1.06 0Z" />
                                        </svg>
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                                            <rect x="5" y="5" width="9" height="9" rx="1.5" />
                                            <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2H3.5A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" />
                                        </svg>
                                        Copy {selectedCount} Listing{selectedCount !== 1 ? 's' : ''} to Clipboard
                                    </>
                                )}
                            </button>

                            <p className="text-[10px] text-white/35 leading-snug max-w-[18rem]">
                                Paste into Discord, Reddit, or Steam forums. Each listing is separated for easy posting.
                            </p>
                        </div>

                        {/* Footer note */}
                        <p className="text-[10px] text-white/30 leading-relaxed border-t border-white/[0.05] pt-3">
                            Listing text is generated from your Blueprint Tracker data. Community deals only — no payments on RaiderForge.
                        </p>
                    </>
                )}
            </div>
        </section>
    )
}
