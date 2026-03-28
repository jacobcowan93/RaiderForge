'use client'

import { useEffect, useMemo, useState } from 'react'

import { fetchListings, type ListingRow, type ListingsError } from '@/lib/marketplace/listings-api'
import type { OrderRow } from '@/lib/marketplace/orders-api'

import { BROWSE_LISTINGS_LIMIT, inputCls } from '../_lib/marketplace-constants'
import { filterBrowseListings, uniqueItemTypesFromListings } from '../_lib/marketplace-view-models'
import { ErrorMsg, Spinner } from './MarketplaceShared'
import { MarketplaceListingCard } from './MarketplaceListingCard'
import { MarketplaceEmptyState } from './MarketplaceEmptyState'
import { MarketplaceCheckoutModal } from './MarketplaceCheckoutModal'

export function MarketplaceBrowseTab({
    isLoggedIn,
    onOrderPlaced,
}: {
    isLoggedIn: boolean
    onOrderPlaced?: (order: OrderRow) => void
}) {
    const [listings, setListings] = useState<ListingRow[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState<string>('all')
    const [checkoutListing, setCheckoutListing] = useState<ListingRow | null>(null)

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            setLoading(true)
            setError(null)
            const r = await fetchListings({ status: 'active', limit: BROWSE_LISTINGS_LIMIT })
            if (cancelled) return
            if (!r.ok) {
                const e = r as ListingsError
                setError(e.message ?? e.error)
            } else {
                setListings(r.listings)
            }
            setLoading(false)
        })()
        return () => { cancelled = true }
    }, [])

    const itemTypes = useMemo(() => uniqueItemTypesFromListings(listings), [listings])

    const filtered = useMemo(
        () => filterBrowseListings(listings, search, typeFilter),
        [listings, search, typeFilter],
    )

    function handleOrderPlaced(order: OrderRow) {
        // Remove 1 unit from available count optimistically
        setListings((prev) =>
            prev.map((l) =>
                l.id === checkoutListing?.id
                    ? { ...l, availableQuantity: Math.max(0, l.availableQuantity - order.quantity) }
                    : l
            )
        )
        onOrderPlaced?.(order)
    }

    return (
        <div className="space-y-5">
            <MarketplaceCheckoutModal
                listing={checkoutListing}
                onClose={() => setCheckoutListing(null)}
                onOrderPlaced={handleOrderPlaced}
            />

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
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
                        className={inputCls + ' pl-9'}
                        placeholder="Search items, sellers…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {itemTypes.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {(['all', ...itemTypes] as string[]).map((t) => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => setTypeFilter(t)}
                            className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.15em] font-semibold border transition-all duration-150 ${
                                typeFilter === t
                                    ? 'bg-rf-orange/15 border-rf-orange/40 text-rf-orange'
                                    : 'bg-white/[0.03] border-white/[0.08] text-rf-textSoft/70 hover:border-white/15 hover:text-rf-textSoft'
                            }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-16 gap-2.5 text-rf-textSoft">
                    <Spinner size={20} />
                    <span className="text-sm">Loading listings…</span>
                </div>
            ) : error ? (
                <div className="text-center py-12">
                    <ErrorMsg msg={error} />
                </div>
            ) : filtered.length === 0 ? (
                <MarketplaceEmptyState
                    title="No listings yet"
                    description={
                        search || typeFilter !== 'all'
                            ? 'No listings match your current filters.'
                            : 'Be the first to post an item for sale in the Sell tab.'
                    }
                />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((l) => (
                        <MarketplaceListingCard
                            key={l.id}
                            listing={l}
                            onBuy={isLoggedIn ? () => setCheckoutListing(l) : undefined}
                        />
                    ))}
                </div>
            )}

            {!isLoggedIn && filtered.length > 0 && (
                <p className="text-[11px] text-rf-textSoft/50 text-center">
                    <a href="/auth/signin" className="underline underline-offset-2 hover:text-rf-textSoft/70 transition-colors">
                        Sign in
                    </a>
                    {' '}to purchase listings.
                </p>
            )}

            <p className="text-[10px] text-rf-textSoft/40 text-center pt-4 border-t border-white/[0.04]">
                Item data provided by{' '}
                <a
                    href="https://ardb.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 hover:text-rf-textSoft/70 transition-colors"
                >
                    ardb.app
                </a>
            </p>
        </div>
    )
}
