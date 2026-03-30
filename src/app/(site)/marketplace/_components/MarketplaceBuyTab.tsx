'use client'

import { useEffect, useMemo, useState } from 'react'

import { fetchListings, type ListingRow } from '@/lib/marketplace/listings-api'
import type { OrderRow } from '@/lib/marketplace/orders-api'

import { BROWSE_LISTINGS_LIMIT, inputCls } from '../_lib/marketplace-constants'
import { ErrorMsg, Spinner } from './MarketplaceShared'
import { MarketplaceEmptyState } from './MarketplaceEmptyState'
import { MarketplaceListingCard } from './MarketplaceListingCard'
import { MarketplaceCheckoutModal } from './MarketplaceCheckoutModal'

function uniqueItemTypes(listings: ListingRow[]): string[] {
    const set = new Set<string>()
    for (const l of listings) {
        const t = (l.itemType ?? '').trim()
        if (t) set.add(t)
    }
    return [...set].sort((a, b) => a.localeCompare(b))
}

const btnReset =
    'inline-flex items-center justify-center rounded-lg border border-white/15 bg-rf-bg/80 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-rf-text hover:border-rf-red/40 hover:bg-white/5 hover:text-white transition-colors'

export function MarketplaceBuyTab() {
    const [listings, setListings] = useState<ListingRow[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState<string>('__all__')
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
        return () => { cancelled = true }
    }, [])

    const typeOptions = useMemo(() => uniqueItemTypes(listings), [listings])

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase()
        let list = listings
        if (typeFilter !== '__all__') {
            list = list.filter((l) => (l.itemType ?? '').trim() === typeFilter)
        }
        if (q) list = list.filter((l) => l.itemName.toLowerCase().includes(q))
        return list
    }, [listings, search, typeFilter])

    function handleOrderPlaced(_order: OrderRow) {
        setBuyTarget(null)
    }

    return (
        <div className="space-y-4 md:space-y-5">
            {/* Search + Type filter */}
            <div className="flex flex-col lg:flex-row lg:items-end gap-3 lg:justify-between">
                <div className="flex-1 min-w-0">
                    <label htmlFor="mp-buy-search" className="text-xs uppercase tracking-wider text-rf-textSoft block mb-1.5">
                        Search
                    </label>
                    <div className="relative">
                        <svg
                            viewBox="0 0 16 16"
                            width="14"
                            height="14"
                            fill="currentColor"
                            aria-hidden
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-rf-textSoft/40 pointer-events-none"
                        >
                            <path d="M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215ZM11.5 7a4.499 4.499 0 1 0-8.997 0A4.499 4.499 0 0 0 11.5 7Z" />
                        </svg>
                        <input
                            id="mp-buy-search"
                            type="search"
                            className={`${inputCls} pl-9 focus-visible:border-rf-red/40 focus-visible:ring-2 focus-visible:ring-rf-red/[0.12]`}
                            placeholder="Filter by item name…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                {typeOptions.length > 0 && (
                    <div className="sm:w-56">
                        <label htmlFor="mp-buy-type" className="text-xs uppercase tracking-wider text-rf-textSoft block mb-1.5">
                            Type
                        </label>
                        <select
                            id="mp-buy-type"
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className={`${inputCls} cursor-pointer focus-visible:border-rf-red/40 focus-visible:ring-2 focus-visible:ring-rf-red/[0.12]`}
                        >
                            <option value="__all__">All types</option>
                            {typeOptions.map((t) => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="rf-card rounded-xl px-4 py-10 flex items-center justify-center gap-2.5 text-rf-textSoft/60 border border-white/[0.06]" aria-busy="true">
                    <Spinner size={18} />
                    <span className="text-sm">Loading listings…</span>
                </div>
            ) : error ? (
                <div className="rf-card rounded-xl px-6 py-10 text-center border border-rf-red/25">
                    <ErrorMsg msg={error} />
                </div>
            ) : filtered.length === 0 ? (
                <div className="rf-card rounded-xl px-6 py-8 text-center border border-white/[0.06] border-l-rf-red/20">
                    <MarketplaceEmptyState
                        compact
                        title={listings.length === 0 ? 'No listings yet' : 'No matches'}
                        description={
                            listings.length === 0
                                ? 'No items are listed for sale yet. Be the first to list one!'
                                : 'Try adjusting your search or type filter.'
                        }
                    />
                    {listings.length > 0 && (search || typeFilter !== '__all__') && (
                        <div className="mt-2 flex flex-wrap justify-center gap-2">
                            <button
                                type="button"
                                className={btnReset}
                                onClick={() => { setSearch(''); setTypeFilter('__all__') }}
                            >
                                Reset filters
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-rf-textSoft/80">
                            <span className="text-xl sm:text-2xl font-black tabular-nums text-rf-red tracking-tight mr-2 align-middle">
                                {filtered.length}
                            </span>
                            <span className="align-middle">listings</span>
                        </p>
                        {filtered.length < listings.length && (
                            <p className="text-[11px] text-rf-textSoft/55 tabular-nums font-medium">
                                {listings.length} total
                            </p>
                        )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-3.5">
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
