'use client'

import { useState } from 'react'

import { deleteListing, updateListing, type ListingRow } from '@/lib/marketplace/listings-api'

import type { ListingStatus } from '../_lib/marketplace-types'
import { btnDanger, btnGhost } from '../_lib/marketplace-constants'
import { formatListingPrice } from '../_lib/marketplace-formatters'
import { ItemIcon, Spinner, StatusBadge, TypeBadge } from './MarketplaceShared'

export function MarketplaceMyListingCard({
    listing,
    onDelete,
    onStatusChange,
}: {
    listing: ListingRow
    onDelete: (id: string) => void
    onStatusChange: (id: string, status: ListingStatus) => void
}) {
    const [deleting, setDeleting] = useState(false)
    const [updating, setUpdating] = useState(false)

    const priceStr = formatListingPrice(listing.price, listing.currency)

    async function handleDelete() {
        if (!confirm(`Remove listing for "${listing.itemName}"?`)) return
        setDeleting(true)
        const r = await deleteListing(listing.id)
        setDeleting(false)
        if (r.ok) onDelete(listing.id)
    }

    async function handleMark(status: ListingStatus) {
        setUpdating(true)
        const r = await updateListing(listing.id, { status })
        setUpdating(false)
        if (r.ok) onStatusChange(listing.id, status)
    }

    return (
        <div className="rf-card rounded-lg border border-white/[0.08] p-3 flex gap-3 items-center transition-all duration-200 hover:border-white/[0.14]">
            <ItemIcon url={listing.itemIconUrl} name={listing.itemName} size={36} />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-rf-text truncate">{listing.itemName}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-rf-orange font-bold">{priceStr}</span>
                    {listing.quantity > 1 && (
                        <span className="text-[10px] text-rf-textSoft/60">× {listing.quantity}</span>
                    )}
                    <StatusBadge status={listing.status} />
                    <TypeBadge type={listing.itemType} />
                </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
                {listing.status === 'active' && (
                    <button
                        className={btnGhost + ' text-xs py-1.5 px-2.5'}
                        onClick={() => handleMark('sold')}
                        disabled={updating || deleting}
                        title="Mark as sold"
                    >
                        {updating ? <Spinner size={12} /> : 'Sold'}
                    </button>
                )}
                {listing.status !== 'active' && (
                    <button
                        className={btnGhost + ' text-xs py-1.5 px-2.5'}
                        onClick={() => handleMark('active')}
                        disabled={updating || deleting}
                        title="Reactivate"
                    >
                        {updating ? <Spinner size={12} /> : 'Relist'}
                    </button>
                )}
                <button
                    className={btnDanger + ' py-1.5 px-2'}
                    onClick={handleDelete}
                    disabled={deleting || updating}
                    title="Delete listing"
                >
                    {deleting ? <Spinner size={12} /> : (
                        <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor" aria-hidden>
                            <path d="M6.5 1.75a.25.25 0 0 1 .25-.25h2.5a.25.25 0 0 1 .25.25V3h-3Zm4.5 0V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.675l.66 6.6a.25.25 0 0 0 .249.225h5.19a.25.25 0 0 0 .249-.225l.66-6.6a.75.75 0 0 1 1.492.149l-.66 6.6A1.748 1.748 0 0 1 10.595 15H5.405a1.748 1.748 0 0 1-1.741-1.575l-.66-6.6a.75.75 0 1 1 1.492-.15Z" />
                        </svg>
                    )}
                </button>
            </div>
        </div>
    )
}
