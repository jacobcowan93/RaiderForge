'use client'

import type { ListingRow } from '@/lib/marketplace/listings-api'

import { formatListingPrice } from '../_lib/marketplace-formatters'
import { ItemIcon, RarityBadge, TypeBadge } from './MarketplaceShared'

// ─── Rarity accent stripe ──────────────────────────────────────────────────────

const RARITY_STRIPE: Record<string, string> = {
    common:    'from-white/20    via-white/5     to-transparent',
    uncommon:  'from-green-400/60  via-green-400/15  to-transparent',
    rare:      'from-sky-400/65    via-sky-400/15    to-transparent',
    epic:      'from-purple-400/65 via-purple-400/15  to-transparent',
    legendary: 'from-amber-400/70  via-amber-400/15   to-transparent',
    exotic:    'from-yellow-300/70 via-yellow-300/15   to-transparent',
}

const RARITY_GLOW: Record<string, string> = {
    common:    '',
    uncommon:  'hover:shadow-[0_0_32px_-8px_rgba(74,222,128,0.18)]',
    rare:      'hover:shadow-[0_0_32px_-8px_rgba(56,189,248,0.20)]',
    epic:      'hover:shadow-[0_0_32px_-8px_rgba(192,132,252,0.22)]',
    legendary: 'hover:shadow-[0_0_32px_-8px_rgba(251,191,36,0.24)]',
    exotic:    'hover:shadow-[0_0_32px_-8px_rgba(253,224,71,0.26)]',
}

function rarityStripe(rarity: string | null): string {
    return RARITY_STRIPE[(rarity ?? '').toLowerCase()] ?? RARITY_STRIPE.common
}

function rarityGlow(rarity: string | null): string {
    return RARITY_GLOW[(rarity ?? '').toLowerCase()] ?? ''
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MarketplaceListingCard({
    listing,
    onBuy,
}: {
    listing: ListingRow
    onBuy?: (listing: ListingRow) => void
}) {
    const priceStr = formatListingPrice(listing.price, listing.currency)
    const soldOut = listing.availableQuantity <= 0

    const availText = soldOut
        ? 'Sold out'
        : listing.availableQuantity < listing.quantity
            ? `${listing.availableQuantity} / ${listing.quantity} left`
            : listing.quantity > 1
                ? `${listing.quantity} available`
                : 'In stock'

    return (
        <div
            className={`group relative rf-card rounded-xl border border-white/[0.08] overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.14] ${rarityGlow(listing.itemRarity)}`}
        >
            {/* Rarity accent stripe */}
            <div
                className={`h-[3px] w-full shrink-0 bg-gradient-to-r ${rarityStripe(listing.itemRarity)}`}
                aria-hidden
            />

            <div className="flex flex-col flex-1 p-4 gap-3.5">
                {/* Item header */}
                <div className="flex gap-3 items-start min-w-0">
                    <ItemIcon url={listing.itemIconUrl} name={listing.itemName} size={48} />
                    <div className="flex-1 min-w-0 space-y-1.5">
                        <p className="text-sm font-bold text-white leading-snug line-clamp-2 group-hover:text-yellow-50 transition-colors">
                            {listing.itemName}
                        </p>
                        <div className="flex flex-wrap gap-1">
                            <TypeBadge type={listing.itemType} />
                            <RarityBadge rarity={listing.itemRarity} />
                        </div>
                    </div>
                </div>

                {/* Description / seller note */}
                {(listing.itemDescription || listing.notes) && (
                    <div className="space-y-1">
                        {listing.itemDescription && (
                            <p className="text-[11px] text-white/50 leading-relaxed line-clamp-2">
                                {listing.itemDescription}
                            </p>
                        )}
                        {listing.notes && (
                            <p className="text-[11px] text-yellow-300/50 italic leading-relaxed line-clamp-1">
                                &ldquo;{listing.notes}&rdquo;
                            </p>
                        )}
                    </div>
                )}

                {/* Price + action */}
                <div className="mt-auto pt-3 border-t border-white/[0.06] space-y-3">
                    {/* Price row */}
                    <div className="flex items-end justify-between gap-2">
                        <div>
                            <p className="text-xl font-black text-yellow-400 leading-none tracking-tight">
                                {priceStr}
                            </p>
                            <p className={`text-[10px] mt-0.5 font-medium ${soldOut ? 'text-red-400/70' : 'text-white/40'}`}>
                                {availText}
                            </p>
                        </div>

                        {/* Seller */}
                        <div className="text-right shrink-0 max-w-[100px]">
                            <p className="text-[9px] uppercase tracking-widest text-white/30 font-semibold">Seller</p>
                            <p className="text-[11px] text-white/60 font-medium truncate mt-0.5">
                                {listing.sellerName ?? 'Anonymous'}
                            </p>
                        </div>
                    </div>

                    {/* CTA */}
                    {onBuy && (
                        <button
                            type="button"
                            disabled={soldOut}
                            onClick={() => onBuy(listing)}
                            className={`w-full py-2 rounded-lg text-xs font-bold tracking-wide transition-all duration-150 active:scale-[0.97] ${
                                soldOut
                                    ? 'bg-white/[0.04] border border-white/[0.08] text-white/30 cursor-not-allowed'
                                    : 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-md shadow-yellow-900/20'
                            }`}
                        >
                            {soldOut ? 'Sold Out' : 'Buy Now'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
