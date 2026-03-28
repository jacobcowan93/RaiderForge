'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { useMarketplaceBrowse } from '@/hooks/useMarketplaceBrowse'
import { getG2GOfferExternalUrl } from '@/lib/marketplace/g2g-offer-url'
import {
    createSellerOffer,
    deleteSellerOffer,
    deliverOrderCodes,
    fetchOrder,
    fetchSellerOffers,
    type MarketplaceResult,
    type MarketplaceRouteError,
} from '@/lib/marketplace/browse-api'

// ─── Shared helpers ───────────────────────────────────────────────────────────

type Tab = 'browse' | 'sell' | 'orders'

function errMsg(r: MarketplaceResult<unknown>): string {
    if (r.ok) return ''
    const e = r as MarketplaceRouteError
    if (e.error === 'g2g_not_configured') return `G2G not configured (${e.missingKeys?.join(', ') ?? '?'})`
    if (e.error === 'missing_required_fields') return `Missing fields: ${e.fields?.join(', ') ?? '?'}`
    return e.error || 'Request failed'
}

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

const btnGreen =
    'inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold ' +
    'bg-rf-green/10 border border-rf-green/35 text-rf-green hover:bg-rf-green/20 ' +
    'active:scale-[0.97] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed'

const btnBlue =
    'inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold ' +
    'bg-rf-blue/10 border border-rf-blue/30 text-rf-blue hover:bg-rf-blue/20 ' +
    'active:scale-[0.97] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed'

const btnDanger =
    'inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium ' +
    'bg-rf-red/10 border border-rf-red/25 text-rf-red/80 hover:bg-rf-red/20 hover:text-rf-red ' +
    'active:scale-[0.97] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed'

const sectionHeading = 'text-[10px] uppercase tracking-[0.2em] text-rf-textSoft font-semibold'

// ─── Shared UI atoms ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
    const s = status.toLowerCase()
    const cls =
        s === 'live' || s === 'active' || s === 'completed'
            ? 'bg-rf-green/12 text-rf-green border-rf-green/25'
            : s === 'cancelled' || s === 'unpaid' || s === 'inactive'
              ? 'bg-white/[0.04] text-rf-textSoft border-white/10'
              : s === 'confirmed' || s === 'verifying_payment'
                ? 'bg-rf-blue/10 text-rf-blue border-rf-blue/25'
                : 'bg-rf-orange/10 text-rf-orange border-rf-orange/25'
    return (
        <span className={`text-[9px] uppercase tracking-[0.15em] px-2 py-0.5 rounded-full border font-bold ${cls}`}>
            {status}
        </span>
    )
}

function Divider({ label }: { label: string }) {
    return (
        <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className={sectionHeading}>{label}</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
        </div>
    )
}

function ErrorMsg({ msg }: { msg: string }) {
    return (
        <p className="flex items-center gap-1.5 text-xs text-rf-red/90">
            <span aria-hidden>⚠</span> {msg}
        </p>
    )
}

/** Auto-dismissing toast — call setToast(null) to hide manually. */
function Toast({ message, onDone }: { message: string; onDone: () => void }) {
    useEffect(() => {
        const t = setTimeout(onDone, 3200)
        return () => clearTimeout(t)
    }, [onDone])

    return (
        <div
            aria-live="polite"
            className="fixed top-5 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-2 px-4 py-2.5 rounded-xl border bg-rf-bgSoft/98 border-rf-green/30 text-rf-green text-sm font-medium shadow-2xl shadow-black/50 backdrop-blur-md"
            style={{ animation: 'rf-hero-enter 0.2s ease-out both' }}
        >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="none">
                <polyline points="2,8 6,12 14,4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {message}
        </div>
    )
}

// ─── Browse tab ───────────────────────────────────────────────────────────────

type OfferRow = {
    offer_id: string
    seller_id?: string
    title?: string
    currency?: string
    unit_price?: number
    available_qty?: number
    status?: string
}

function OfferCard({ offer: o }: { offer: OfferRow }) {
    const priceStr =
        o.unit_price !== undefined
            ? `${o.unit_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${o.currency ? ` ${o.currency}` : ''}`
            : null

    return (
        <div className="group relative rf-card rounded-xl border border-white/[0.08] overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-500/25 hover:shadow-[0_0_28px_-6px_rgba(56,189,248,0.18)]">
            {/* Top accent */}
            <div className="h-0.5 w-full bg-gradient-to-r from-rf-blue/70 via-rf-blue/30 to-transparent shrink-0" />

            <div className="flex flex-col flex-1 p-4 gap-3">
                {/* Title row */}
                <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-rf-text leading-snug line-clamp-2 group-hover:text-white transition-colors">
                        {o.title ?? o.offer_id}
                    </h3>
                    {o.status && <StatusBadge status={o.status} />}
                </div>

                {/* Price */}
                {priceStr && (
                    <p className="text-xl font-bold text-rf-orange leading-none">
                        {priceStr}
                    </p>
                )}

                {/* Meta */}
                <div className="text-[11px] text-rf-textSoft space-y-0.5 mt-auto">
                    {o.seller_id && <p>Seller · {o.seller_id}</p>}
                    {o.available_qty !== undefined && <p>Stock · {o.available_qty}</p>}
                </div>
            </div>

            {/* CTA */}
            <div className="px-4 pb-4">
                <a
                    href={getG2GOfferExternalUrl(o.offer_id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg bg-rf-orange text-black text-xs font-bold uppercase tracking-wide hover:bg-amber-400 active:scale-[0.97] transition-all duration-150"
                >
                    Buy on G2G
                    <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
                        <path d="M6 4h6v6M12 4L4 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </a>
            </div>
        </div>
    )
}

function BrowseTab() {
    const b = useMarketplaceBrowse()

    return (
        <div className="space-y-4">
            {/* Filter bar */}
            <div className="rf-card rounded-xl p-4 border border-white/[0.06]">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <label className={sectionHeading}>Service</label>
                        <select
                            value={b.serviceId}
                            onChange={(e) => b.setServiceId(e.target.value)}
                            className={selectCls}
                            disabled={b.loadingServices}
                        >
                            <option value="">Select service…</option>
                            {b.services.map((s) => (
                                <option key={s.service_id} value={s.service_id}>
                                    {s.service_name}
                                </option>
                            ))}
                        </select>
                        {b.loadingServices && <p className="text-[10px] text-rf-textSoft">Loading…</p>}
                        {b.servicesError && <ErrorMsg msg={b.servicesError} />}
                    </div>

                    <div className="space-y-1">
                        <label className={sectionHeading}>Brand</label>
                        <select
                            value={b.brandId}
                            onChange={(e) => b.setBrandId(e.target.value)}
                            className={selectCls}
                            disabled={!b.serviceId || b.loadingBrands}
                        >
                            <option value="">{b.serviceId ? 'All brands…' : 'Select service first'}</option>
                            {b.brands.map((x) => (
                                <option key={x.brand_id} value={x.brand_id}>
                                    {x.brand_name}
                                </option>
                            ))}
                        </select>
                        {b.loadingBrands && <p className="text-[10px] text-rf-textSoft">Loading…</p>}
                        {b.brandsError && <ErrorMsg msg={b.brandsError} />}
                    </div>

                    <div className="space-y-1">
                        <label className={sectionHeading}>Product</label>
                        <select
                            value={b.productId}
                            onChange={(e) => b.setProductId(e.target.value)}
                            className={selectCls}
                            disabled={!b.serviceId || b.loadingProducts}
                        >
                            <option value="">All products</option>
                            {b.products.map((p) => (
                                <option key={p.product_id} value={p.product_id}>
                                    {p.product_name}
                                </option>
                            ))}
                        </select>
                        {b.loadingProducts && <p className="text-[10px] text-rf-textSoft">Loading…</p>}
                        {b.productsError && <ErrorMsg msg={b.productsError} />}
                    </div>
                </div>
            </div>

            {/* Offers */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <span className={sectionHeading}>
                        {b.loadingOffers
                            ? 'Loading offers…'
                            : b.offers.length > 0
                              ? `${b.offers.length} offer${b.offers.length !== 1 ? 's' : ''}`
                              : b.brandId
                                ? 'No offers found'
                                : 'Live offers'}
                    </span>
                    {b.brandId && (
                        <button
                            type="button"
                            onClick={() => void b.refreshOffers()}
                            disabled={b.loadingOffers}
                            className={btnGhost}
                        >
                            Refresh
                        </button>
                    )}
                </div>

                {b.offersError && <ErrorMsg msg={b.offersError} />}

                {!b.brandId && !b.loadingOffers && (
                    <div className="rf-card rounded-xl border border-white/[0.06] p-10 flex flex-col items-center text-center gap-3">
                        <svg className="w-8 h-8 text-rf-textSoft/30" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                            <path d="M9 9h.01M15 9h.01M9 13s1 2 3 2 3-2 3-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        <p className="text-sm text-rf-textSoft">Select a brand to load live G2G listings.</p>
                        <p className="text-xs text-rf-textSoft/60">Purchases complete on G2G — no checkout data passes through RaiderForge.</p>
                    </div>
                )}

                {b.brandId && !b.loadingOffers && !b.offersError && b.offers.length === 0 && (
                    <p className="text-sm text-rf-textSoft py-4 text-center">No live offers for this selection.</p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {(b.offers as OfferRow[]).map((o) => (
                        <OfferCard key={o.offer_id} offer={o} />
                    ))}
                </div>
            </div>
        </div>
    )
}

// ─── Sell tab ─────────────────────────────────────────────────────────────────

type SellerOffer = {
    offer_id: string
    title?: string
    status?: string
    unit_price?: number
    currency?: string
    available_qty?: number
    product_id?: string
}

function pickSellerOffers(payload: unknown): SellerOffer[] {
    if (!payload || typeof payload !== 'object') return []
    const list = (payload as { results?: unknown }).results
    if (!Array.isArray(list)) return []
    return list.filter(
        (x): x is SellerOffer => !!x && typeof x === 'object' && typeof (x as SellerOffer).offer_id === 'string'
    )
}

const BLANK_FORM = {
    service_id: '',
    brand_id: '',
    product_id: '',
    title: '',
    description: '',
    unit_price: '',
    currency: 'USD',
    available_qty: '',
    status: 'live',
}

const CURRENCIES = ['USD', 'EUR', 'GBP', 'SGD', 'MYR', 'AUD', 'CAD']
const OFFER_STATUSES = ['live', 'inactive']

function SellerOfferRow({
    offer: o,
    deleting,
    onDelete,
}: {
    offer: SellerOffer
    deleting: boolean
    onDelete: () => void
}) {
    const priceStr =
        o.unit_price !== undefined
            ? `${o.unit_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${o.currency ?? ''}`
            : null

    return (
        <div className="group flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-lg bg-black/25 border border-white/[0.06] hover:border-white/10 transition-colors">
            <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-rf-text truncate">{o.title ?? o.offer_id}</p>
                    {o.status && <StatusBadge status={o.status} />}
                </div>
                <p className="text-[11px] text-rf-textSoft font-mono truncate">{o.offer_id}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-rf-textSoft">
                    {priceStr && <span className="text-rf-orange font-semibold">{priceStr}</span>}
                    {o.available_qty !== undefined && <span>Stock · {o.available_qty}</span>}
                </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <a
                    href={getG2GOfferExternalUrl(o.offer_id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={btnGhost}
                >
                    View ↗
                </a>
                <button
                    type="button"
                    onClick={onDelete}
                    disabled={deleting}
                    className={btnDanger}
                >
                    {deleting ? 'Removing…' : 'Remove'}
                </button>
            </div>
        </div>
    )
}

function SellTab() {
    const [offers, setOffers] = useState<SellerOffer[]>([])
    const [loading, setLoading] = useState(false)
    const [loadError, setLoadError] = useState<string | null>(null)

    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState(BLANK_FORM)
    const [submitBusy, setSubmitBusy] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)
    const [toast, setToast] = useState<string | null>(null)

    const [deletingId, setDeletingId] = useState<string | null>(null)

    const loadOffers = useCallback(async () => {
        setLoading(true)
        setLoadError(null)
        const r = await fetchSellerOffers({ page_size: 50 })
        if (!r.ok) setLoadError(errMsg(r))
        else setOffers(pickSellerOffers(r.payload))
        setLoading(false)
    }, [])

    useEffect(() => {
        void loadOffers()
    }, [loadOffers])

    function setField(key: keyof typeof BLANK_FORM, value: string) {
        setForm((f) => ({ ...f, [key]: value }))
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault()
        setSubmitBusy(true)
        setSubmitError(null)

        const body: Record<string, unknown> = {
            service_id: form.service_id,
            brand_id: form.brand_id,
            product_id: form.product_id,
            unit_price: parseFloat(form.unit_price),
            currency: form.currency,
            status: form.status,
        }
        if (form.title) body.title = form.title
        if (form.description) body.description = form.description
        if (form.available_qty) body.available_qty = parseInt(form.available_qty, 10)

        const r = await createSellerOffer(body)
        if (!r.ok) {
            setSubmitError(errMsg(r))
        } else {
            setForm(BLANK_FORM)
            setShowForm(false)
            setToast('Offer created successfully.')
            await loadOffers()
        }
        setSubmitBusy(false)
    }

    async function handleDelete(offerId: string) {
        if (!confirm(`Remove offer ${offerId}? This cannot be undone.`)) return
        setDeletingId(offerId)
        await deleteSellerOffer(offerId)
        setDeletingId(null)
        await loadOffers()
    }

    return (
        <div className="space-y-4">
            {toast && <Toast message={toast} onDone={() => setToast(null)} />}

            {/* My offers panel */}
            <div className="rf-card rounded-xl border border-white/[0.06] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                    <div>
                        <h3 className="text-sm font-semibold text-rf-text">My listings</h3>
                        {!loading && !loadError && (
                            <p className="text-[11px] text-rf-textSoft mt-0.5">
                                {offers.length} active offer{offers.length !== 1 ? 's' : ''}
                            </p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => void loadOffers()}
                            disabled={loading}
                            className={btnGhost}
                        >
                            Refresh
                        </button>
                        <button
                            type="button"
                            onClick={() => { setShowForm((v) => !v); setSubmitError(null) }}
                            className={showForm ? btnGhost : btnGreen}
                        >
                            {showForm ? 'Cancel' : '+ New offer'}
                        </button>
                    </div>
                </div>

                <div className="p-4 space-y-2">
                    {loading && <p className="text-sm text-rf-textSoft py-2">Loading your listings…</p>}
                    {loadError && <ErrorMsg msg={loadError} />}
                    {!loading && !loadError && offers.length === 0 && (
                        <p className="text-sm text-rf-textSoft text-center py-6">No offers found for your account.</p>
                    )}
                    {offers.map((o) => (
                        <SellerOfferRow
                            key={o.offer_id}
                            offer={o}
                            deleting={deletingId === o.offer_id}
                            onDelete={() => void handleDelete(o.offer_id)}
                        />
                    ))}
                </div>
            </div>

            {/* Create offer form */}
            {showForm && (
                <div className="rf-card rounded-xl border border-white/[0.06] overflow-hidden">
                    <div className="px-5 py-4 border-b border-white/[0.06]">
                        <h3 className="text-sm font-semibold text-rf-text">Create new offer</h3>
                        <p className="text-[11px] text-rf-textSoft mt-0.5">
                            Copy Service, Brand, and Product IDs from the Browse tab or your G2G seller dashboard.
                            Delivery methods are configured in G2G directly.
                        </p>
                    </div>

                    <form onSubmit={(e) => void handleCreate(e)} className="p-5 space-y-5">
                        {/* Section: Listing */}
                        <div className="space-y-3">
                            <Divider label="Listing" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {(
                                    [
                                        ['service_id', 'Service ID', true],
                                        ['brand_id', 'Brand ID', true],
                                        ['product_id', 'Product ID', true],
                                        ['title', 'Title (optional)', false],
                                    ] as const
                                ).map(([key, label, required]) => (
                                    <div key={key} className="space-y-1">
                                        <label className={sectionHeading}>
                                            {label}
                                            {required && <span className="text-rf-orange ml-0.5">*</span>}
                                        </label>
                                        <input
                                            type="text"
                                            value={form[key]}
                                            onChange={(e) => setField(key, e.target.value)}
                                            className={inputCls}
                                            required={required}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Section: Pricing */}
                        <div className="space-y-3">
                            <Divider label="Pricing" />
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="col-span-2 space-y-1">
                                    <label className={sectionHeading}>
                                        Unit price <span className="text-rf-orange">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={form.unit_price}
                                        onChange={(e) => setField('unit_price', e.target.value)}
                                        className={inputCls}
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className={sectionHeading}>Currency</label>
                                    <select
                                        value={form.currency}
                                        onChange={(e) => setField('currency', e.target.value)}
                                        className={selectCls}
                                    >
                                        {CURRENCIES.map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className={sectionHeading}>Qty available</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={form.available_qty}
                                        onChange={(e) => setField('available_qty', e.target.value)}
                                        className={inputCls}
                                        placeholder="∞"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section: Details */}
                        <div className="space-y-3">
                            <Divider label="Details" />
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="sm:col-span-2 space-y-1">
                                    <label className={sectionHeading}>Description</label>
                                    <textarea
                                        value={form.description}
                                        onChange={(e) => setField('description', e.target.value)}
                                        rows={3}
                                        className={`${inputCls} resize-none`}
                                        placeholder="Describe what the buyer will receive…"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className={sectionHeading}>Status</label>
                                    <select
                                        value={form.status}
                                        onChange={(e) => setField('status', e.target.value)}
                                        className={selectCls}
                                    >
                                        {OFFER_STATUSES.map((s) => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {submitError && <ErrorMsg msg={submitError} />}

                        <div className="flex items-center justify-end gap-3 pt-1">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className={btnGhost}
                            >
                                Cancel
                            </button>
                            <button type="submit" disabled={submitBusy} className={btnGreen}>
                                {submitBusy && (
                                    <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                    </svg>
                                )}
                                {submitBusy ? 'Creating…' : 'Create offer'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    )
}

// ─── Orders tab ───────────────────────────────────────────────────────────────

type OrderPayload = Record<string, unknown>

/** Extracts known G2G order fields and returns the rest as generic entries. */
function parseOrderDisplay(data: OrderPayload): {
    orderId: string
    status: string | null
    amount: string | null
    buyerId: string | null
    sellerId: string | null
    rest: [string, string][]
} {
    const known = ['order_id', 'status', 'amount', 'buyer_id', 'seller_id']
    const orderId = typeof data.order_id === 'string' ? data.order_id : '—'
    const status = typeof data.status === 'string' ? data.status : null
    const amount = data.amount != null ? String(data.amount) : null
    const buyerId = typeof data.buyer_id === 'string' ? data.buyer_id : null
    const sellerId = typeof data.seller_id === 'string' ? data.seller_id : null
    const rest = Object.entries(data)
        .filter(([k]) => !known.includes(k))
        .map(([k, v]): [string, string] => [k, typeof v === 'object' ? JSON.stringify(v) : String(v)])
    return { orderId, status, amount, buyerId, sellerId, rest }
}

function OrderDetailCard({ data, onDeliver }: { data: OrderPayload; onDeliver: () => void }) {
    const { orderId, status, amount, buyerId, sellerId, rest } = parseOrderDisplay(data)
    const needsDelivery = status?.toLowerCase().includes('delivery') ?? false

    return (
        <div className="rf-card rounded-xl border border-white/[0.08] overflow-hidden">
            <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-white/[0.06]">
                <div>
                    <p className={sectionHeading}>Order ID</p>
                    <p className="mt-1 text-sm font-mono text-rf-text">{orderId}</p>
                </div>
                {status && <StatusBadge status={status} />}
            </div>

            <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
                {amount && (
                    <div>
                        <p className={sectionHeading}>Amount</p>
                        <p className="mt-1 text-sm font-semibold text-rf-orange">{amount}</p>
                    </div>
                )}
                {buyerId && (
                    <div>
                        <p className={sectionHeading}>Buyer</p>
                        <p className="mt-1 text-sm text-rf-text font-mono">{buyerId}</p>
                    </div>
                )}
                {sellerId && (
                    <div>
                        <p className={sectionHeading}>Seller</p>
                        <p className="mt-1 text-sm text-rf-text font-mono">{sellerId}</p>
                    </div>
                )}
                {rest.map(([k, v]) => (
                    <div key={k}>
                        <p className={sectionHeading}>{k.replace(/_/g, ' ')}</p>
                        <p className="mt-1 text-xs text-rf-textSoft font-mono truncate">{v}</p>
                    </div>
                ))}
            </div>

            {needsDelivery && (
                <div className="px-5 pb-5">
                    <button type="button" onClick={onDeliver} className={btnPrimary}>
                        Deliver codes for this order
                    </button>
                </div>
            )}
        </div>
    )
}

function OrdersTab() {
    const [orderIdInput, setOrderIdInput] = useState('')
    const [orderData, setOrderData] = useState<OrderPayload | null>(null)
    const [orderLoading, setOrderLoading] = useState(false)
    const [orderError, setOrderError] = useState<string | null>(null)

    const [showDelivery, setShowDelivery] = useState(false)
    const [codesInput, setCodesInput] = useState('')
    const [deliveryBusy, setDeliveryBusy] = useState(false)
    const [deliveryError, setDeliveryError] = useState<string | null>(null)
    const [deliveryToast, setDeliveryToast] = useState<string | null>(null)

    const inputRef = useRef<HTMLInputElement>(null)

    async function handleLookup(e: React.FormEvent) {
        e.preventDefault()
        const id = orderIdInput.trim()
        if (!id) return
        setOrderLoading(true)
        setOrderError(null)
        setOrderData(null)
        setShowDelivery(false)
        setDeliveryError(null)
        const r = await fetchOrder(id)
        if (!r.ok) setOrderError(errMsg(r))
        else setOrderData(r.payload as OrderPayload)
        setOrderLoading(false)
    }

    async function handleDeliver(e: React.FormEvent) {
        e.preventDefault()
        const codes = codesInput
            .split('\n')
            .map((l) => l.trim())
            .filter(Boolean)
        if (!codes.length) {
            setDeliveryError('Enter at least one code.')
            return
        }
        setDeliveryBusy(true)
        setDeliveryError(null)
        const r = await deliverOrderCodes(orderIdInput.trim(), codes)
        if (!r.ok) setDeliveryError(errMsg(r))
        else {
            setDeliveryToast('Codes delivered successfully.')
            setCodesInput('')
            setShowDelivery(false)
        }
        setDeliveryBusy(false)
    }

    return (
        <div className="space-y-4">
            {deliveryToast && <Toast message={deliveryToast} onDone={() => setDeliveryToast(null)} />}

            {/* Lookup */}
            <div className="rf-card rounded-xl border border-white/[0.06] overflow-hidden">
                <div className="px-5 py-4 border-b border-white/[0.06]">
                    <h3 className="text-sm font-semibold text-rf-text">Order lookup</h3>
                    <p className="text-[11px] text-rf-textSoft mt-0.5">Enter a G2G order ID to view status and delivery options.</p>
                </div>
                <div className="p-5">
                    <form onSubmit={(e) => void handleLookup(e)} className="flex gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="e.g. 1659694996896NH0Y-1"
                            value={orderIdInput}
                            onChange={(e) => setOrderIdInput(e.target.value)}
                            className={`${inputCls} flex-1`}
                        />
                        <button
                            type="submit"
                            disabled={!orderIdInput.trim() || orderLoading}
                            className={btnBlue}
                        >
                            {orderLoading ? (
                                <>
                                    <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                    </svg>
                                    Looking up…
                                </>
                            ) : (
                                'Look up'
                            )}
                        </button>
                    </form>
                    {orderError && <div className="mt-3"><ErrorMsg msg={orderError} /></div>}
                </div>
            </div>

            {/* Order detail */}
            {orderData && (
                <OrderDetailCard
                    data={orderData}
                    onDeliver={() => setShowDelivery(true)}
                />
            )}

            {/* Deliver codes */}
            <div className="rf-card rounded-xl border border-white/[0.06] overflow-hidden">
                <button
                    type="button"
                    onClick={() => setShowDelivery((v) => !v)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
                >
                    <div>
                        <h3 className="text-sm font-semibold text-rf-text">Deliver codes</h3>
                        <p className="text-[11px] text-rf-textSoft mt-0.5">
                            Upload codes for an order after receiving{' '}
                            <code className="text-rf-blue">order.api_delivery</code>
                        </p>
                    </div>
                    <svg
                        className={`w-4 h-4 text-rf-textSoft transition-transform ${showDelivery ? 'rotate-180' : ''}`}
                        viewBox="0 0 16 16"
                        fill="none"
                    >
                        <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>

                {showDelivery && (
                    <form onSubmit={(e) => void handleDeliver(e)} className="border-t border-white/[0.06] p-5 space-y-4">
                        <div className="space-y-1">
                            <label className={sectionHeading}>
                                Target order ID
                            </label>
                            <p className="text-sm font-mono text-rf-text py-1.5 px-3 bg-black/30 rounded-lg border border-white/[0.06]">
                                {orderIdInput.trim() || <span className="text-rf-textSoft/50 italic">—</span>}
                            </p>
                            {!orderIdInput.trim() && (
                                <p className="text-[10px] text-rf-textSoft">Look up an order above first.</p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <label className={sectionHeading}>Codes — one per line</label>
                            <textarea
                                value={codesInput}
                                onChange={(e) => setCodesInput(e.target.value)}
                                placeholder={'CODE-AAAA-1234\nCODE-BBBB-5678'}
                                rows={6}
                                className={`${inputCls} resize-none font-mono text-[12px]`}
                            />
                            <p className="text-[10px] text-rf-textSoft">
                                {codesInput.split('\n').filter((l) => l.trim()).length} code(s) entered
                            </p>
                        </div>

                        {deliveryError && <ErrorMsg msg={deliveryError} />}

                        <button
                            type="submit"
                            disabled={!orderIdInput.trim() || !codesInput.trim() || deliveryBusy}
                            className={btnPrimary}
                        >
                            {deliveryBusy && (
                                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                </svg>
                            )}
                            {deliveryBusy ? 'Delivering…' : 'Deliver codes'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string }[] = [
    { id: 'browse', label: 'Browse' },
    { id: 'sell', label: 'Sell' },
    { id: 'orders', label: 'Orders' },
]

export default function MarketplacePage() {
    const [tab, setTab] = useState<Tab>('browse')

    return (
        <div className="py-8 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                    Market<span className="text-rf-orange">place</span>
                </h1>
                <p className="mt-2 text-xs text-rf-textSoft max-w-2xl leading-relaxed">
                    Browse G2G listings for ARC Raiders items. Purchases complete on G2G — no checkout
                    data passes through RaiderForge. Seller flows run through server-side G2G API routes only.
                </p>
            </div>

            {/* Tab nav — underline style */}
            <div className="flex border-b border-white/[0.07]">
                {TABS.map(({ id, label }) => (
                    <button
                        key={id}
                        type="button"
                        onClick={() => setTab(id)}
                        className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
                            tab === id ? 'text-rf-text' : 'text-rf-textSoft hover:text-rf-text'
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
            {tab === 'browse' && <BrowseTab />}
            {tab === 'sell' && <SellTab />}
            {tab === 'orders' && <OrdersTab />}
        </div>
    )
}
