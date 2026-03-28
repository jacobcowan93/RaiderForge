'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'

import {
    fetchListings,
    createListing,
    updateListing,
    deleteListing,
    fetchCatalogItems,
    type ListingRow,
    type CatalogItemSummary,
    type ListingsError,
} from '@/lib/marketplace/listings-api'
import {
    deliverOrderCodes,
    fetchOrder,
    type MarketplaceResult,
    type MarketplaceRouteError,
} from '@/lib/marketplace/browse-api'

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'browse' | 'sell' | 'orders'

// ─── Shared design tokens ────────────────────────────────────────────────────

const inputCls =
    'w-full px-3 py-2.5 bg-black/50 border border-rf-border rounded-lg text-sm text-rf-text ' +
    'placeholder:text-rf-textSoft/40 focus-visible:border-rf-blue/45 focus-visible:ring-2 ' +
    'focus-visible:ring-rf-blue/[0.08] outline-none transition-colors ' +
    'disabled:opacity-40 disabled:cursor-not-allowed'

const selectCls = `${inputCls} cursor-pointer`

const btnPrimary =
    'inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold ' +
    'bg-rf-orange text-black hover:bg-amber-400 active:scale-[0.97] ' +
    'transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100'

const btnGhost =
    'inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium ' +
    'bg-transparent border border-rf-border text-rf-textSoft hover:text-rf-text hover:border-white/20 ' +
    'active:scale-[0.97] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed'

const btnDanger =
    'inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium ' +
    'bg-rf-red/10 border border-rf-red/25 text-rf-red/80 hover:bg-rf-red/20 hover:text-rf-red ' +
    'active:scale-[0.97] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed'

const sectionHeading = 'text-[10px] uppercase tracking-[0.2em] text-rf-textSoft font-semibold'

// ─── Shared UI atoms ──────────────────────────────────────────────────────────

function RarityBadge({ rarity }: { rarity: string | null }) {
    if (!rarity) return null
    const r = rarity.toLowerCase()
    const cls =
        r === 'legendary'
            ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
            : r === 'epic'
              ? 'border-purple-500/40 bg-purple-500/10 text-purple-300'
              : r === 'rare'
                ? 'border-sky-500/40 bg-sky-500/10 text-sky-300'
                : r === 'uncommon'
                  ? 'border-rf-green/40 bg-rf-green/10 text-rf-green'
                  : 'border-white/15 bg-white/[0.05] text-rf-textSoft'
    return (
        <span className={`text-[8px] uppercase tracking-[0.15em] px-1.5 py-0.5 rounded border font-bold ${cls}`}>
            {rarity}
        </span>
    )
}

function TypeBadge({ type }: { type: string | null }) {
    if (!type) return null
    return (
        <span className="text-[8px] uppercase tracking-[0.15em] px-1.5 py-0.5 rounded border border-white/10 bg-white/[0.04] text-rf-textSoft font-semibold">
            {type}
        </span>
    )
}

function StatusBadge({ status }: { status: string }) {
    const s = status.toLowerCase()
    const cls =
        s === 'active'
            ? 'bg-rf-green/12 text-rf-green border-rf-green/25'
            : s === 'sold'
              ? 'bg-rf-blue/10 text-rf-blue border-rf-blue/25'
              : s === 'cancelled'
                ? 'bg-white/[0.04] text-rf-textSoft border-white/10'
                : 'bg-rf-orange/10 text-rf-orange border-rf-orange/25'
    return (
        <span className={`text-[9px] uppercase tracking-[0.15em] px-2 py-0.5 rounded-full border font-bold ${cls}`}>
            {status}
        </span>
    )
}

function Spinner({ size = 16 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            className="animate-spin"
            aria-hidden
        >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
    )
}

function ErrorMsg({ msg }: { msg: string | null }) {
    if (!msg) return null
    return (
        <p className="text-xs text-rf-red/80 flex items-center gap-1.5">
            <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor" aria-hidden className="shrink-0">
                <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm0 4a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 5Zm0 6.5a.875.875 0 1 1 0-1.75.875.875 0 0 1 0 1.75Z" />
            </svg>
            {msg}
        </p>
    )
}

function Divider({ label }: { label?: string }) {
    if (!label) return <hr className="border-white/[0.06] my-5" />
    return (
        <div className="flex items-center gap-3 my-5">
            <hr className="flex-1 border-white/[0.06]" />
            <span className={sectionHeading}>{label}</span>
            <hr className="flex-1 border-white/[0.06]" />
        </div>
    )
}

function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
    useEffect(() => {
        const t = setTimeout(onDone, 3200)
        return () => clearTimeout(t)
    }, [onDone])
    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-rf-bgSoft border border-rf-green/35 shadow-xl shadow-black/40 text-sm text-rf-green font-medium pointer-events-none">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden>
                <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm3.25 4.72a.75.75 0 0 1 0 1.06l-3.5 3.5a.75.75 0 0 1-1.06 0l-1.5-1.5a.75.75 0 1 1 1.06-1.06l.97.97 2.97-2.97a.75.75 0 0 1 1.06 0Z" />
            </svg>
            {msg}
        </div>
    )
}

// ─── Item image with ARDB fallback ────────────────────────────────────────────

function ItemIcon({ url, name, size = 48 }: { url: string | null; name: string; size?: number }) {
    const [err, setErr] = useState(false)
    if (!url || err) {
        return (
            <div
                style={{ width: size, height: size }}
                className="shrink-0 rounded-md bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-rf-textSoft/40"
            >
                <svg viewBox="0 0 24 24" width={size * 0.5} height={size * 0.5} fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                    <rect x="3" y="3" width="18" height="18" rx="3" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="m21 15-5-5L5 21" />
                </svg>
            </div>
        )
    }
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={url}
            alt={name}
            width={size}
            height={size}
            onError={() => setErr(true)}
            className="shrink-0 rounded-md object-contain bg-black/40"
            style={{ width: size, height: size }}
        />
    )
}

// ─── Listing Card (Browse tab) ────────────────────────────────────────────────

function ListingCard({ listing }: { listing: ListingRow }) {
    const priceStr = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: listing.currency,
        minimumFractionDigits: 2,
    }).format(listing.price)

    return (
        <div className="group relative rf-card rounded-xl border border-white/[0.08] overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-500/25 hover:shadow-[0_0_28px_-6px_rgba(56,189,248,0.16)]">
            {/* Top accent line */}
            <div className="h-0.5 w-full bg-gradient-to-r from-rf-blue/60 via-rf-blue/25 to-transparent shrink-0" />

            <div className="flex flex-col flex-1 p-3.5 gap-3">
                {/* Header: icon + name + badges */}
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
                    <p className="text-[11px] text-rf-textSoft/60 italic leading-relaxed line-clamp-2">
                        &ldquo;{listing.notes}&rdquo;
                    </p>
                )}

                {/* Price row */}
                <div className="mt-auto pt-2 border-t border-white/[0.06] flex items-end justify-between gap-2">
                    <div>
                        <p className="text-xl font-bold text-rf-orange leading-none">{priceStr}</p>
                        {listing.quantity > 1 && (
                            <p className="text-[10px] text-rf-textSoft/60 mt-0.5">Qty: {listing.quantity}</p>
                        )}
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-rf-textSoft/50">Seller</p>
                        <p className="text-[11px] text-rf-textSoft font-medium truncate max-w-[120px]">
                            {listing.sellerName ?? 'Anonymous'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── My Listing Row (Sell tab) ────────────────────────────────────────────────

function MyListingCard({
    listing,
    onDelete,
    onStatusChange,
}: {
    listing: ListingRow
    onDelete: (id: string) => void
    onStatusChange: (id: string, status: 'active' | 'sold' | 'cancelled') => void
}) {
    const [deleting, setDeleting] = useState(false)
    const [updating, setUpdating] = useState(false)

    const priceStr = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: listing.currency,
        minimumFractionDigits: 2,
    }).format(listing.price)

    async function handleDelete() {
        if (!confirm(`Remove listing for "${listing.itemName}"?`)) return
        setDeleting(true)
        const r = await deleteListing(listing.id)
        setDeleting(false)
        if (r.ok) onDelete(listing.id)
    }

    async function handleMark(status: 'active' | 'sold' | 'cancelled') {
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

// ─── Item Picker (Sell tab) ───────────────────────────────────────────────────

function ItemPicker({
    items,
    value,
    onChange,
    disabled,
}: {
    items: CatalogItemSummary[]
    value: CatalogItemSummary | null
    onChange: (item: CatalogItemSummary | null) => void
    disabled?: boolean
}) {
    const [q, setQ] = useState('')
    const [open, setOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const results = useMemo(() => {
        if (!q.trim()) return items.slice(0, 80)
        const lower = q.toLowerCase()
        return items.filter((it) =>
            it.name.toLowerCase().includes(lower) ||
            (it.itemType ?? '').toLowerCase().includes(lower)
        ).slice(0, 60)
    }, [q, items])

    // Close on outside click
    useEffect(() => {
        function handler(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    function selectItem(item: CatalogItemSummary) {
        onChange(item)
        setQ('')
        setOpen(false)
    }

    function clearItem() {
        onChange(null)
        setQ('')
    }

    if (value) {
        return (
            <div className="flex gap-3 items-center p-3 bg-black/40 border border-rf-border rounded-lg">
                <ItemIcon url={value.iconUrl} name={value.name} size={40} />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-rf-text truncate">{value.name}</p>
                    <div className="flex gap-1.5 mt-0.5 flex-wrap">
                        <TypeBadge type={value.itemType} />
                        <RarityBadge rarity={value.rarity} />
                    </div>
                    {value.description && (
                        <p className="text-[10px] text-rf-textSoft/60 mt-1 line-clamp-2">{value.description}</p>
                    )}
                </div>
                <button
                    onClick={clearItem}
                    disabled={disabled}
                    className="shrink-0 p-1.5 rounded-md text-rf-textSoft/50 hover:text-rf-textSoft hover:bg-white/[0.06] transition-colors"
                    title="Change item"
                >
                    <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor" aria-hidden>
                        <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
                    </svg>
                </button>
            </div>
        )
    }

    return (
        <div ref={containerRef} className="relative">
            <input
                className={inputCls}
                placeholder="Search items by name or type…"
                value={q}
                onChange={(e) => {
                    setQ(e.target.value)
                    setOpen(true)
                }}
                onFocus={() => setOpen(true)}
                disabled={disabled}
            />
            {open && results.length > 0 && (
                <div className="absolute z-50 top-full mt-1 w-full max-h-64 overflow-y-auto rounded-lg border border-white/[0.12] bg-[#0b0f19] shadow-2xl shadow-black/60">
                    {results.map((item) => (
                        <button
                            key={item.ardbId}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => selectItem(item)}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-white/[0.05] transition-colors border-b border-white/[0.04] last:border-0"
                        >
                            <ItemIcon url={item.iconUrl} name={item.name} size={28} />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-rf-text font-medium truncate">{item.name}</p>
                                {item.itemType && (
                                    <p className="text-[9px] uppercase tracking-wide text-rf-textSoft/60 mt-0.5">{item.itemType}</p>
                                )}
                            </div>
                            {item.rarity && (
                                <RarityBadge rarity={item.rarity} />
                            )}
                        </button>
                    ))}
                </div>
            )}
            {open && q.trim() && results.length === 0 && (
                <div className="absolute z-50 top-full mt-1 w-full rounded-lg border border-white/[0.08] bg-[#0b0f19] px-4 py-3 text-sm text-rf-textSoft/60 shadow-xl shadow-black/40">
                    No items match &ldquo;{q}&rdquo;
                </div>
            )}
        </div>
    )
}

// ─── Browse Tab ───────────────────────────────────────────────────────────────

function BrowseTab() {
    const [listings, setListings] = useState<ListingRow[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState<string>('all')

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            setLoading(true)
            setError(null)
            const r = await fetchListings({ status: 'active', limit: 200 })
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

    // Collect unique item types for filter chips
    const itemTypes = useMemo(() => {
        const types = new Set<string>()
        for (const l of listings) {
            if (l.itemType) types.add(l.itemType.toLowerCase())
        }
        return Array.from(types).sort()
    }, [listings])

    const filtered = useMemo(() => {
        let list = listings
        if (search.trim()) {
            const q = search.toLowerCase()
            list = list.filter(
                (l) =>
                    l.itemName.toLowerCase().includes(q) ||
                    (l.itemDescription ?? '').toLowerCase().includes(q) ||
                    (l.sellerName ?? '').toLowerCase().includes(q)
            )
        }
        if (typeFilter !== 'all') {
            list = list.filter((l) => (l.itemType ?? '').toLowerCase() === typeFilter)
        }
        return list
    }, [listings, search, typeFilter])

    return (
        <div className="space-y-5">
            {/* Search + filter */}
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

            {/* Type filter chips */}
            {itemTypes.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {(['all', ...itemTypes] as string[]).map((t) => (
                        <button
                            key={t}
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

            {/* Listings grid */}
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
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-rf-textSoft/50">
                    <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden>
                        <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-8 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
                    </svg>
                    <p className="text-sm font-medium">No listings yet</p>
                    <p className="text-xs text-center max-w-xs">
                        {search || typeFilter !== 'all'
                            ? 'No listings match your current filters.'
                            : 'Be the first to post an item for sale in the Sell tab.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((l) => (
                        <ListingCard key={l.id} listing={l} />
                    ))}
                </div>
            )}

            {/* Attribution */}
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

// ─── Sell Tab ─────────────────────────────────────────────────────────────────

function SellTab({ userId }: { userId: string | undefined }) {
    const [myListings, setMyListings] = useState<ListingRow[]>([])
    const [loadingMyListings, setLoadingMyListings] = useState(false)
    const [myListingsError, setMyListingsError] = useState<string | null>(null)

    const [catalogItems, setCatalogItems] = useState<CatalogItemSummary[]>([])
    const [catalogLoading, setCatalogLoading] = useState(false)
    const [catalogError, setCatalogError] = useState<string | null>(null)
    const [catalogSyncedAt, setCatalogSyncedAt] = useState<string | null>(null)

    const [selectedItem, setSelectedItem] = useState<CatalogItemSummary | null>(null)
    const [price, setPrice] = useState('')
    const [currency, setCurrency] = useState('USD')
    const [quantity, setQuantity] = useState('1')
    const [notes, setNotes] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)
    const [toast, setToast] = useState<string | null>(null)

    // Load my listings
    useEffect(() => {
        if (!userId) return
        let cancelled = false
        ;(async () => {
            setLoadingMyListings(true)
            setMyListingsError(null)
            const r = await fetchListings({ sellerId: userId, status: 'all', limit: 200 })
            if (cancelled) return
            if (!r.ok) setMyListingsError((r as ListingsError).message ?? (r as ListingsError).error)
            else setMyListings(r.listings)
            setLoadingMyListings(false)
        })()
        return () => { cancelled = true }
    }, [userId])

    // Load catalog on mount (needed for item picker)
    useEffect(() => {
        if (!userId) return
        let cancelled = false
        ;(async () => {
            setCatalogLoading(true)
            setCatalogError(null)
            const r = await fetchCatalogItems()
            if (cancelled) return
            if (!r.ok) {
                setCatalogError('Could not load item catalog. Ensure a catalog sync has been run.')
            } else {
                setCatalogItems(r.items)
                setCatalogSyncedAt(r.syncedAt)
            }
            setCatalogLoading(false)
        })()
        return () => { cancelled = true }
    }, [userId])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!selectedItem) { setSubmitError('Select an item first.'); return }
        const priceVal = parseFloat(price)
        if (!Number.isFinite(priceVal) || priceVal <= 0) { setSubmitError('Enter a valid price.'); return }
        const qtyVal = Math.max(1, parseInt(quantity, 10) || 1)

        setSubmitting(true)
        setSubmitError(null)
        const r = await createListing({
            ardbItemId: selectedItem.ardbId,
            price: priceVal,
            currency,
            quantity: qtyVal,
            notes: notes.trim() || undefined,
        })
        setSubmitting(false)
        if (!r.ok) {
            const e = r as ListingsError
            setSubmitError(e.message ?? e.error)
            return
        }
        setMyListings((prev) => [r.listing, ...prev])
        setSelectedItem(null)
        setPrice('')
        setQuantity('1')
        setNotes('')
        setToast('Listing posted!')
    }

    function handleDelete(id: string) {
        setMyListings((prev) => prev.filter((l) => l.id !== id))
    }

    function handleStatusChange(id: string, status: 'active' | 'sold' | 'cancelled') {
        setMyListings((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)))
    }

    if (!userId) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-rf-textSoft/60">
                <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden>
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
                </svg>
                <p className="text-sm font-medium text-rf-textSoft">Sign in to post listings</p>
                <p className="text-xs text-center max-w-xs text-rf-textSoft/50">
                    Create a RaiderForge account to list ARC Raiders items for sale.
                </p>
                <a href="/auth/signin" className={btnPrimary}>
                    Sign in
                </a>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {toast && <Toast msg={toast} onDone={() => setToast(null)} />}

            {/* My Listings */}
            <section>
                <p className={sectionHeading + ' mb-3'}>My Listings</p>
                {loadingMyListings ? (
                    <div className="flex items-center gap-2 py-6 text-rf-textSoft/60">
                        <Spinner size={16} />
                        <span className="text-sm">Loading…</span>
                    </div>
                ) : myListingsError ? (
                    <ErrorMsg msg={myListingsError} />
                ) : myListings.length === 0 ? (
                    <p className="text-sm text-rf-textSoft/50 py-4">You have no listings yet.</p>
                ) : (
                    <div className="space-y-2">
                        {myListings.map((l) => (
                            <MyListingCard
                                key={l.id}
                                listing={l}
                                onDelete={handleDelete}
                                onStatusChange={handleStatusChange}
                            />
                        ))}
                    </div>
                )}
            </section>

            <Divider label="Create Listing" />

            {/* Create form */}
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Item picker */}
                <div className="space-y-1.5">
                    <label className={sectionHeading}>Item</label>
                    {catalogLoading ? (
                        <div className="flex items-center gap-2 py-3 text-rf-textSoft/50">
                            <Spinner size={14} />
                            <span className="text-xs">Loading item catalog…</span>
                        </div>
                    ) : catalogError ? (
                        <div className="space-y-1">
                            <ErrorMsg msg={catalogError} />
                            <p className="text-[10px] text-rf-textSoft/40">
                                An admin may need to run a catalog sync at{' '}
                                <code className="bg-white/[0.06] px-1 rounded">/api/marketplace/catalog/sync</code>
                            </p>
                        </div>
                    ) : (
                        <>
                            <ItemPicker
                                items={catalogItems}
                                value={selectedItem}
                                onChange={setSelectedItem}
                                disabled={submitting}
                            />
                            {catalogSyncedAt && (
                                <p className="text-[9px] text-rf-textSoft/35">
                                    Catalog synced {new Date(catalogSyncedAt).toLocaleDateString()}
                                    {' · '}
                                    <a
                                        href="https://ardb.app"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline underline-offset-1 hover:text-rf-textSoft/60"
                                    >
                                        ardb.app
                                    </a>
                                </p>
                            )}
                        </>
                    )}
                </div>

                <Divider />

                {/* Pricing */}
                <div className="space-y-1.5">
                    <label className={sectionHeading}>Pricing</label>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs text-rf-textSoft/70">Price</label>
                            <input
                                className={inputCls}
                                type="number"
                                min="0.01"
                                step="0.01"
                                placeholder="0.00"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                disabled={submitting}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-rf-textSoft/70">Currency</label>
                            <select
                                className={selectCls}
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                                disabled={submitting}
                            >
                                {['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD'].map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Details */}
                <div className="space-y-3">
                    <div className="space-y-1">
                        <label className="text-xs text-rf-textSoft/70">Quantity</label>
                        <input
                            className={inputCls}
                            type="number"
                            min="1"
                            step="1"
                            placeholder="1"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            disabled={submitting}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-rf-textSoft/70">Notes <span className="opacity-50">(optional)</span></label>
                        <textarea
                            className={inputCls + ' resize-none h-20'}
                            placeholder="Condition, trade details, or other notes…"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            disabled={submitting}
                            maxLength={500}
                        />
                    </div>
                </div>

                {submitError && <ErrorMsg msg={submitError} />}

                <button type="submit" className={btnPrimary + ' w-full py-2.5'} disabled={submitting || !selectedItem}>
                    {submitting ? <><Spinner size={14} /> Posting…</> : 'Post Listing'}
                </button>
            </form>
        </div>
    )
}

// ─── Orders Tab (G2G seller tooling) ─────────────────────────────────────────

function errMsg(r: MarketplaceResult<unknown>): string {
    if (r.ok) return ''
    const e = r as MarketplaceRouteError
    if (e.error === 'g2g_not_configured') return `G2G not configured`
    return e.error || 'Request failed'
}

function OrdersTab() {
    const [orderId, setOrderId] = useState('')
    const [orderData, setOrderData] = useState<unknown>(null)
    const [orderLoading, setOrderLoading] = useState(false)
    const [orderError, setOrderError] = useState<string | null>(null)

    const [codesInput, setCodesInput] = useState('')
    const [delivering, setDelivering] = useState(false)
    const [deliverError, setDeliverError] = useState<string | null>(null)
    const [deliverSuccess, setDeliverSuccess] = useState(false)
    const [showDeliver, setShowDeliver] = useState(false)

    async function handleLookup(e: React.FormEvent) {
        e.preventDefault()
        if (!orderId.trim()) return
        setOrderLoading(true)
        setOrderError(null)
        setOrderData(null)
        setDeliverSuccess(false)
        const r = await fetchOrder(orderId.trim())
        setOrderLoading(false)
        if (!r.ok) { setOrderError(errMsg(r)); return }
        setOrderData(r.payload)
    }

    async function handleDeliver(e: React.FormEvent) {
        e.preventDefault()
        const codes = codesInput.split('\n').map((c) => c.trim()).filter(Boolean)
        if (codes.length === 0) { setDeliverError('Enter at least one code.'); return }
        setDelivering(true)
        setDeliverError(null)
        const r = await deliverOrderCodes(orderId.trim(), codes)
        setDelivering(false)
        if (!r.ok) { setDeliverError(errMsg(r)); return }
        setDeliverSuccess(true)
        setCodesInput('')
    }

    type OrderField = { label: string; value: string }

    function parseOrderDisplay(payload: unknown): OrderField[] {
        if (!payload || typeof payload !== 'object') return []
        const p = payload as Record<string, unknown>
        const known: OrderField[] = []
        const add = (label: string, key: string) => {
            const v = p[key]
            if (v !== undefined && v !== null && v !== '') known.push({ label, value: String(v) })
        }
        add('Order ID', 'order_id')
        add('Status', 'status')
        add('Amount', 'amount')
        add('Currency', 'currency')
        add('Buyer ID', 'buyer_id')
        add('Seller ID', 'seller_id')
        add('Created', 'created_at')
        add('Updated', 'updated_at')
        const usedKeys = new Set(['order_id', 'status', 'amount', 'currency', 'buyer_id', 'seller_id', 'created_at', 'updated_at'])
        for (const [k, v] of Object.entries(p)) {
            if (!usedKeys.has(k) && v !== undefined && v !== null && v !== '') {
                known.push({ label: k.replace(/_/g, ' '), value: typeof v === 'object' ? JSON.stringify(v) : String(v) })
            }
        }
        return known
    }

    return (
        <div className="space-y-5">
            <p className="text-xs text-rf-textSoft/60 leading-relaxed">
                G2G order management tools for sellers. Look up orders and deliver digital codes.
            </p>

            {/* Order lookup */}
            <form onSubmit={handleLookup} className="flex gap-2">
                <input
                    className={inputCls}
                    placeholder="G2G Order ID"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    disabled={orderLoading}
                />
                <button type="submit" className={btnGhost + ' shrink-0'} disabled={orderLoading || !orderId.trim()}>
                    {orderLoading ? <Spinner size={14} /> : 'Look up'}
                </button>
            </form>

            <ErrorMsg msg={orderError} />

            {orderData && (
                <div className="rf-card rounded-lg border border-white/[0.08] p-4 space-y-3">
                    <p className={sectionHeading}>Order Details</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        {parseOrderDisplay(orderData).map(({ label, value }) => (
                            <div key={label} className="min-w-0">
                                <p className="text-[9px] uppercase tracking-wider text-rf-textSoft/50 font-semibold">{label}</p>
                                <p className="text-xs text-rf-text font-medium truncate mt-0.5">{value}</p>
                            </div>
                        ))}
                    </div>

                    <div className="pt-2 border-t border-white/[0.06]">
                        <button
                            className={btnGhost + ' text-xs'}
                            onClick={() => setShowDeliver((v) => !v)}
                        >
                            {showDeliver ? '▲ Hide' : '▼ Deliver Codes'}
                        </button>
                    </div>

                    {showDeliver && (
                        <form onSubmit={handleDeliver} className="space-y-3 pt-1">
                            <textarea
                                className={inputCls + ' resize-none h-28 font-mono text-xs'}
                                placeholder="One code per line…"
                                value={codesInput}
                                onChange={(e) => setCodesInput(e.target.value)}
                                disabled={delivering}
                            />
                            <p className="text-[10px] text-rf-textSoft/40">
                                {codesInput.split('\n').filter((c) => c.trim()).length} code(s) to deliver
                            </p>
                            <ErrorMsg msg={deliverError} />
                            {deliverSuccess && (
                                <p className="text-xs text-rf-green font-medium">Codes delivered successfully.</p>
                            )}
                            <button type="submit" className={btnPrimary} disabled={delivering}>
                                {delivering ? <><Spinner size={14} /> Delivering…</> : 'Deliver Codes'}
                            </button>
                        </form>
                    )}
                </div>
            )}
        </div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string }[] = [
    { id: 'browse', label: 'Browse' },
    { id: 'sell', label: 'Sell' },
    { id: 'orders', label: 'G2G Orders' },
]

export default function MarketplacePage() {
    const [tab, setTab] = useState<Tab>('browse')
    const { data: session, status: sessionStatus } = useSession()
    const userId = (session?.user as { id?: string } | undefined)?.id

    return (
        <main className="min-h-screen bg-rf-bg text-rf-text px-4 pt-8 pb-20">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div className="space-y-1">
                    <h1 className="text-3xl font-extrabold tracking-tight">
                        Market<span className="text-rf-orange">place</span>
                    </h1>
                    <p className="text-sm text-rf-textSoft/70">
                        Player-to-player listings for ARC Raiders items
                    </p>
                </div>

                {/* Tab navigation */}
                <div className="flex border-b border-white/[0.08] gap-1">
                    {TABS.map(({ id, label }) => (
                        <button
                            key={id}
                            onClick={() => setTab(id)}
                            className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
                                tab === id
                                    ? 'text-rf-text'
                                    : 'text-rf-textSoft/60 hover:text-rf-textSoft'
                            }`}
                        >
                            {label}
                            {tab === id && (
                                <span className="absolute bottom-0 inset-x-0 h-[2px] bg-rf-orange rounded-t-full" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab content */}
                <div>
                    {tab === 'browse' && <BrowseTab />}
                    {tab === 'sell' && (
                        sessionStatus === 'loading' ? (
                            <div className="flex items-center justify-center py-20 gap-2.5 text-rf-textSoft/60">
                                <Spinner size={20} />
                                <span className="text-sm">Loading…</span>
                            </div>
                        ) : (
                            <SellTab userId={userId} />
                        )
                    )}
                    {tab === 'orders' && <OrdersTab />}
                </div>
            </div>
        </main>
    )
}
