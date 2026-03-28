'use client'

import type { ListingRow } from '@/lib/marketplace/listings-api'

import type { ListingStatus } from '../_lib/marketplace-types'
import { sectionHeading } from '../_lib/marketplace-constants'
import { ErrorMsg, Spinner } from './MarketplaceShared'
import { MarketplaceMyListingCard } from './MarketplaceMyListingCard'

export function MarketplaceMyListingsTab({
    listings,
    loading,
    error,
    onDelete,
    onStatusChange,
}: {
    listings: ListingRow[]
    loading: boolean
    error: string | null
    onDelete: (id: string) => void
    onStatusChange: (id: string, status: ListingStatus) => void
}) {
    return (
        <section>
            <p className={sectionHeading + ' mb-3'}>My Listings</p>
            {loading ? (
                <div className="flex items-center gap-2 py-6 text-rf-textSoft/60">
                    <Spinner size={16} />
                    <span className="text-sm">Loading…</span>
                </div>
            ) : error ? (
                <ErrorMsg msg={error} />
            ) : listings.length === 0 ? (
                <p className="text-sm text-rf-textSoft/50 py-4">You have no listings yet.</p>
            ) : (
                <div className="space-y-2">
                    {listings.map((l) => (
                        <MarketplaceMyListingCard
                            key={l.id}
                            listing={l}
                            onDelete={onDelete}
                            onStatusChange={onStatusChange}
                        />
                    ))}
                </div>
            )}
        </section>
    )
}
