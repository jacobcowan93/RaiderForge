'use client'

import { useEffect, useMemo, useState } from 'react'

import { fetchListings, type ListingRow } from '@/lib/marketplace/listings-api'
import type { OrderRow } from '@/lib/marketplace/orders-api'

import { inputCls, selectCls, BROWSE_LISTINGS_LIMIT } from '../_lib/marketplace-constants'
import { filterBrowseListings, uniqueItemTypesFromListings } from '../_lib/marketplace-view-models'
import { ErrorMsg, Spinner } from './MarketplaceShared'
import { MarketplaceEmptyState } from './MarketplaceEmptyState'
import { MarketplaceListingCard } from './MarketplaceListingCard'
import { MarketplaceCheckoutModal } from './MarketplaceCheckoutModal'

// ─── Rarity filter helpers ────────────────────────────────────────────────────

const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'exotic']

function uniqueRarities(listings: ListingRow[]): string[] {
    const set = new Set<string>()
    for (const l of listings) {
        if (l.itemRarity) set.add(l.itemRarity.toLowerCase())
    }
    return RARITY_ORDER.filter((r) => set.has(r))
}

const RARITY_LABEL: Record<string, string> = {
    common: 'Common',
    uncommon: 'Uncommon',
    rare: 'Rare',
    epic: 'Epic',
    legendary: 'Legendary',
    exotic: 'Exotic',
}

const btnReset =
    'inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/60 hover:border-white/25 hover:text-white transition-colors'

// ─── Component ────────────────────────────────────────────────────────────────

export function MarketplaceBuyTab({ onGoToSell }: { onGoToSell?: () => void }) {
    const [listings, setListings] = useState<ListingRow[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState('all')
    const [rarityFilter, setRarityFilter] = useState('all')

    const [buyTarget, setBuyTarget] = useState<ListingRow | null>(null)

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            setLoading(true)
            setError(null)
            const r = await fetchListings({ status: 'active', limit: BROWSE_LISTINGS_LIMIT })
            if (cancelled) return
            if (!r.ok) {
                setError('message' in r ? (r.message ?? r.error) : 'Failed to load listings')
            } else {
                setListings(r.listings)
            }
            setLoading(false)
        })()
        return () => {
            cancelled = true
        }
    }, [])

    const typeOptions = useMemo(() => uniqueItemTypesFromListings(listings), [listings])
    const rarityOptions = useMemo(() => uniqueRarities(listings), [listings])

    const filtered = useMemo(() => {
        let list = filterBrowseListings(listings, search, typeFilter)
        if (rarityFilter !== 'all') {
            list = list.filter((l) => (l.itemRarity ?? '').toLowerCase() === rarityFilter)
        }
        return list
    }, [listings, search, typeFilter, rarityFilter])

    const hasFilters = search.trim() || typeFilter !== 'all' || rarityFilter !== 'all'

    function handleReset() {
        setSearch('')
        setTypeFilter('all')
        setRarityFilter('all')
    }

    function handleOrderPlaced(_order: OrderRow) {
        setBuyTarget(null)
    }

    return (
        <div className="space-y-5">
            {/* ── Filter bar ─────────────────────────────────────────────── */}
            <div className="rf-card rounded-xl border border-white/[0.08] bg-black/30 backdrop-blur-sm px-4 py-4">
                <div className="flex flex-col lg:flex-row lg:items-end gap-3">
                    {/* Search */}
                    <div className="flex-1 min-w-0">
                        <label
                            htmlFor="mp-buy-search"
                            className="text-[10px] uppercase tracking-widest text-white/50 font-semibold block mb-1.5"
                        >
                            Search
                        </label>
                        <div className="relative">
                            <svg
                                viewBox="0 0 16 16"
                                width="14"
                                height="14"
                                fill="currentColor"
                                aria-hidden
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
                            >
                                <path d="M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215ZM11.5 7a4.499 4.499 0 1 0-8.997 0A4.499 4.499 0 0 0 11.5 7Z" />
                            </svg>
                            <input
                                id="mp-buy-search"
                                type="search"
                                className={`${inputCls} pl-9`}
                                placeholder="Search by item name or seller…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Type filter */}
                    {typeOptions.length > 0 && (
                        <div className="sm:w-48">
                            <label
                                htmlFor="mp-buy-type"
                                className="text-[10px] uppercase tracking-widest text-white/50 font-semibold block mb-1.5"
                            >
                                Category
                            </label>
                            <select
                                id="mp-buy-type"
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className={selectCls}
                            >
                                <option value="all">All categories</option>
                                {typeOptions.map((t) => (
                                    <option key={t} value={t}>
                                        {t.charAt(0).toUpperCase() + t.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Rarity filter */}
                    {rarityOptions.length > 0 && (
                        <div className="sm:w-44">
                            <label
                                htmlFor="mp-buy-rarity"
                                className="text-[10px] uppercase tracking-widest text-white/50 font-semibold block mb-1.5"
                            >
                                Rarity
                            </label>
                            <select
                                id="mp-buy-rarity"
                                value={rarityFilter}
                                onChange={(e) => setRarityFilter(e.target.value)}
                                className={selectCls}
                            >
                                <option value="all">All rarities</option>
                                {rarityOptions.map((r) => (
                                    <option key={r} value={r}>
                                        {RARITY_LABEL[r] ?? r}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Content ────────────────────────────────────────────────── */}
            {loading ? (
                <div className="flex items-center justify-center gap-2.5 py-24 text-white/50" aria-busy="true">
                    <Spinner size={18} />
                    <span className="text-sm">Loading listings…</span>
                </div>
            ) : error ? (
                <div className="rounded-xl px-6 py-10 text-center border border-red-500/20 bg-red-900/[0.06]">
                    <ErrorMsg msg={error} />
                </div>
            ) : filtered.length === 0 ? (
                <div className="rounded-xl border border-white/[0.08] bg-black/25 backdrop-blur-sm">
                    <MarketplaceEmptyState
                        compact
                        title={listings.length === 0 ? 'No listings yet' : 'No matches'}
                        description={
                            listings.length === 0
                                ? 'The marketplace is open — be the first to list an item for sale.'
                                : 'Try clearing your search or adjusting the filters.'
                        }
                        onSellClick={listings.length === 0 ? onGoToSell : undefined}
                    />
                    {hasFilters && listings.length > 0 && (
                        <div className="pb-6 flex justify-center">
                            <button type="button" className={btnReset} onClick={handleReset}>
                                Clear filters
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <>
                    {/* Result count */}
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black tabular-nums text-yellow-400 leading-none">
                            {filtered.length}
                        </span>
                        <span className="text-[10px] uppercase tracking-widest text-white/50 font-bold">
                            {filtered.length === 1 ? 'listing' : 'listings'}
                        </span>
                        {filtered.length < listings.length && (
                            <span className="text-[11px] text-white/30 tabular-nums ml-1">
                                of {listings.length}
                            </span>
                        )}
                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                        {filtered.map((l) => (
                            <MarketplaceListingCard key={l.id} listing={l} onBuy={setBuyTarget} />
                        ))}
                    </div>
                </>
            )}

            <MarketplaceCheckoutModal
                listing={buyTarget}
                onClose={() => setBuyTarget(null)}
                onOrderPlaced={handleOrderPlaced}
            />
        </div>
    )
}
