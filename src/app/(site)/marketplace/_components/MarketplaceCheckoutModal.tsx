'use client'

import { useEffect, useRef, useState } from 'react'

import { createOrder, type OrderRow, type OrdersError } from '@/lib/marketplace/orders-api'
import type { ListingRow } from '@/lib/marketplace/listings-api'

import { btnGhost, btnPrimary, inputCls, sectionHeading } from '../_lib/marketplace-constants'
import { formatListingPrice } from '../_lib/marketplace-formatters'
import { ErrorMsg, ItemIcon, RarityBadge, Spinner, TypeBadge } from './MarketplaceShared'

type Phase = 'confirm' | 'success' | 'error'

export function MarketplaceCheckoutModal({
    listing,
    onClose,
    onOrderPlaced,
}: {
    listing: ListingRow | null
    onClose: () => void
    onOrderPlaced: (order: OrderRow) => void
}) {
    const [phase, setPhase] = useState<Phase>('confirm')
    const [quantity, setQuantity] = useState(1)
    const [buyerNote, setBuyerNote] = useState('')
    const [placing, setPlacing] = useState(false)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)
    const [placedOrder, setPlacedOrder] = useState<OrderRow | null>(null)
    const overlayRef = useRef<HTMLDivElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)

    // Reset state when listing changes
    useEffect(() => {
        if (listing) {
            setPhase('confirm')
            setQuantity(1)
            setBuyerNote('')
            setErrorMsg(null)
            setPlacedOrder(null)
            setPlacing(false)
        }
    }, [listing?.id])

    // Close on Escape
    useEffect(() => {
        function handler(e: KeyboardEvent) {
            if (e.key === 'Escape') onClose()
        }
        document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [onClose])

    // Lock body scroll while open
    useEffect(() => {
        if (!listing) return
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => { document.body.style.overflow = prev }
    }, [listing])

    if (!listing) return null

    const maxQty = Math.max(1, listing.availableQuantity)
    const safeQty = Math.min(Math.max(1, quantity), maxQty)
    const total = listing.price * safeQty
    const totalStr = formatListingPrice(total, listing.currency)
    const unitStr = formatListingPrice(listing.price, listing.currency)

    async function handlePlace() {
        if (!listing) return
        setPlacing(true)
        setErrorMsg(null)
        const r = await createOrder({
            listingId: listing.id,
            quantity: safeQty,
            buyerNote: buyerNote.trim() || undefined,
        })
        setPlacing(false)
        if (!r.ok) {
            const e = r as OrdersError
            setErrorMsg(e.message ?? e.error ?? 'Failed to place order')
            setPhase('error')
            return
        }
        setPlacedOrder(r.order)
        setPhase('success')
        onOrderPlaced(r.order)
    }

    return (
        // Overlay
        <div
            ref={overlayRef}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={(e) => {
                if (e.target === overlayRef.current) onClose()
            }}
        >
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                className="relative w-full max-w-md rf-card rounded-2xl border border-white/[0.12] shadow-2xl shadow-black/60 overflow-hidden"
            >
                {/* Top accent */}
                <div className="h-0.5 w-full bg-gradient-to-r from-rf-orange/80 via-rf-orange/40 to-transparent" />

                {/* Close */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 p-1.5 rounded-md text-rf-textSoft/50 hover:text-rf-textSoft hover:bg-white/[0.06] transition-colors"
                    aria-label="Close"
                >
                    <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden>
                        <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
                    </svg>
                </button>

                <div className="p-5 space-y-4">
                    {/* ── Success ── */}
                    {phase === 'success' && placedOrder && (
                        <>
                            <div className="flex flex-col items-center text-center gap-3 py-4">
                                <div className="w-12 h-12 rounded-full bg-rf-green/15 border border-rf-green/30 flex items-center justify-center">
                                    <svg viewBox="0 0 16 16" width="22" height="22" fill="currentColor" className="text-rf-green" aria-hidden>
                                        <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm3.25 4.72a.75.75 0 0 1 0 1.06l-3.5 3.5a.75.75 0 0 1-1.06 0l-1.5-1.5a.75.75 0 1 1 1.06-1.06l.97.97 2.97-2.97a.75.75 0 0 1 1.06 0Z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-base font-bold text-rf-text">Order Placed!</p>
                                    <p className="text-xs text-rf-textSoft/70 mt-1">
                                        Your order is pending seller confirmation.
                                    </p>
                                </div>
                            </div>

                            {/* Order summary */}
                            <div className="bg-black/30 rounded-lg border border-white/[0.06] p-3 space-y-2">
                                <div className="flex items-center gap-2.5">
                                    <ItemIcon url={listing.itemIconUrl} name={listing.itemName} size={32} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-rf-text truncate">{listing.itemName}</p>
                                        <p className="text-xs text-rf-textSoft/60">Qty: {safeQty} · {totalStr}</p>
                                    </div>
                                </div>
                                <div className="pt-2 border-t border-white/[0.05]">
                                    <p className="text-[9px] uppercase tracking-wider text-rf-textSoft/40 font-semibold">Order ID</p>
                                    <p className="text-xs font-mono text-rf-textSoft/80 mt-0.5 break-all">{placedOrder.id}</p>
                                </div>
                            </div>

                            <p className="text-[10px] text-rf-textSoft/50 text-center">
                                Track this order in the <strong className="text-rf-textSoft">My Orders</strong> tab.
                            </p>

                            <button onClick={onClose} className={btnPrimary + ' w-full'}>
                                Done
                            </button>
                        </>
                    )}

                    {/* ── Confirm / Error ── */}
                    {(phase === 'confirm' || phase === 'error') && (
                        <>
                            <div>
                                <p className="text-[11px] uppercase tracking-widest text-rf-textSoft/50 font-semibold mb-2">
                                    Place Order
                                </p>
                                {/* Item preview */}
                                <div className="flex gap-3 items-start p-3 bg-black/30 rounded-lg border border-white/[0.06]">
                                    <ItemIcon url={listing.itemIconUrl} name={listing.itemName} size={48} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-rf-text leading-tight line-clamp-2">{listing.itemName}</p>
                                        <div className="flex gap-1 mt-1 flex-wrap">
                                            <TypeBadge type={listing.itemType} />
                                            <RarityBadge rarity={listing.itemRarity} />
                                        </div>
                                        {listing.itemDescription && (
                                            <p className="text-[10px] text-rf-textSoft/60 mt-1.5 line-clamp-2 leading-relaxed">
                                                {listing.itemDescription}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Seller */}
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-rf-textSoft/50">Seller</span>
                                <span className="text-rf-textSoft font-medium">{listing.sellerName ?? 'Anonymous'}</span>
                            </div>

                            {/* Quantity */}
                            {listing.availableQuantity > 1 && (
                                <div className="space-y-1.5">
                                    <label className={sectionHeading}>Quantity</label>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            className={btnGhost + ' w-9 h-9 p-0 text-lg'}
                                            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                            disabled={quantity <= 1 || placing}
                                        >−</button>
                                        <span className="flex-1 text-center text-sm font-bold text-rf-text">{safeQty}</span>
                                        <button
                                            type="button"
                                            className={btnGhost + ' w-9 h-9 p-0 text-lg'}
                                            onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                                            disabled={quantity >= maxQty || placing}
                                        >+</button>
                                    </div>
                                    <p className="text-[10px] text-rf-textSoft/40 text-right">
                                        {listing.availableQuantity} available
                                    </p>
                                </div>
                            )}

                            {/* Note to seller */}
                            <div className="space-y-1.5">
                                <label className={sectionHeading + ' flex gap-1'}>
                                    Note to seller
                                    <span className="opacity-50 normal-case tracking-normal text-[9px]">(optional)</span>
                                </label>
                                <textarea
                                    className={inputCls + ' resize-none h-16 text-xs'}
                                    placeholder="Any special instructions or questions…"
                                    value={buyerNote}
                                    onChange={(e) => setBuyerNote(e.target.value)}
                                    maxLength={500}
                                    disabled={placing}
                                />
                            </div>

                            {/* Price summary */}
                            <div className="bg-black/30 rounded-lg border border-white/[0.06] p-3 space-y-1.5">
                                <div className="flex justify-between text-xs text-rf-textSoft/70">
                                    <span>Unit price</span>
                                    <span>{unitStr}</span>
                                </div>
                                {safeQty > 1 && (
                                    <div className="flex justify-between text-xs text-rf-textSoft/70">
                                        <span>Quantity</span>
                                        <span>× {safeQty}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center pt-1.5 border-t border-white/[0.06]">
                                    <span className="text-sm font-bold text-rf-text">Total</span>
                                    <span className="text-lg font-bold text-rf-orange">{totalStr}</span>
                                </div>
                            </div>

                            {errorMsg && <ErrorMsg msg={errorMsg} />}

                            <p className="text-[9px] text-rf-textSoft/35 text-center leading-relaxed">
                                Placing an order notifies the seller. The seller will confirm and arrange payment.
                                Price is locked at time of order — verified server-side.
                            </p>

                            <div className="flex gap-2">
                                <button type="button" className={btnGhost + ' flex-1'} onClick={onClose} disabled={placing}>
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className={btnPrimary + ' flex-1'}
                                    onClick={handlePlace}
                                    disabled={placing}
                                >
                                    {placing ? <><Spinner size={14} /> Placing…</> : `Place Order · ${totalStr}`}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
