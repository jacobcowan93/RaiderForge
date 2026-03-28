'use client'

import type { ListingRow } from '@/lib/marketplace/listings-api'

import { btnPrimary } from '../_lib/marketplace-constants'
import { formatListingPrice } from '../_lib/marketplace-formatters'
import { ItemIcon, RarityBadge, TypeBadge } from './MarketplaceShared'

export function MarketplaceListingCard({
    listing,
    onBuy,
}: {
    listing: ListingRow
    onBuy?: (listing: ListingRow) => void
}) {
    const priceStr = formatListingPrice(listing.price, listing.currency)
    const soldOut = listing.availableQuantity <= 0

    return (
        <div className="group relative rf-card rounded-xl border border-white/[0.08] overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-500/25 hover:shadow-[0_0_28px_-6px_rgba(56,189,248,0.16)]">
            <div className="h-0.5 w-full bg-gradient-to-r from-rf-blue/60 via-rf-blue/25 to-transparent shrink-0" />

            <div className="flex flex-col flex-1 p-3.5 gap-3">
                {/* Header */}
                <div className="flex gap-3 items-start min-w-0">
                    <ItemIcon url={listing.itemIconUrl} name={listing.itemName} size={44} />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-rf-text leading-tight line-clamp-2 group-hover:text-white transition-colors">
                            {listing.itemName}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                            <TypeBadge type={listing.itemType} />
                            <RarityBadge rarity={listing.itemRarity} />
                        </div>
                    </div>
                </div>

                {/* Description */}
                {listing.itemDescription && (
                    <p className="text-[11px] text-rf-textSoft/75 leading-relaxed line-clamp-2">
                        {listing.itemDescription}
                    </p>
                )}
                {listing.notes && (
                    <p className="text-[11px] text-rf-textSoft/60 italic leading-relaxed line-clamp-1">
                        &ldquo;{listing.notes}&rdquo;
                    </p>
                )}

                {/* Price + CTA */}
                <div className="mt-auto pt-2 border-t border-white/[0.06] space-y-2.5">
                    <div className="flex items-end justify-between gap-2">
                        <div>
                            <p className="text-xl font-bold text-rf-orange leading-none">{priceStr}</p>
                            <p className="text-[10px] text-rf-textSoft/50 mt-0.5">
                                {soldOut
                                    ? 'Sold out'
                                    : listing.availableQuantity < listing.quantity
                                        ? `${listing.availableQuantity} of ${listing.quantity} available`
                                        : listing.quantity > 1
                                            ? `${listing.quantity} available`
                                            : '1 available'
                                }
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] text-rf-textSoft/40 uppercase tracking-wider">Seller</p>
                            <p className="text-[11px] text-rf-textSoft font-medium truncate max-w-[100px]">
                                {listing.sellerName ?? 'Anonymous'}
                            </p>
                        </div>
                    </div>

                    {onBuy && (
                        <button
                            type="button"
                            className={btnPrimary + ' w-full py-2 text-xs'}
                            disabled={soldOut}
                            onClick={() => onBuy(listing)}
                        >
                            {soldOut ? 'Sold Out' : 'Buy Now'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
