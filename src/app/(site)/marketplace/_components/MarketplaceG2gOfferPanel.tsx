'use client'

/**
 * MarketplaceG2gOfferPanel
 *
 * Full G2G offer creation panel for the Sell tab.
 *
 * Flow:
 *   1. On mount — checks G2G health via /api/marketplace/g2g/health
 *   2. Loads G2G services (game categories) — user selects one
 *   3. Loads brands for that service — user selects one
 *   4. Loads products for service+brand — user selects one
 *   5. User fills price / quantity / currency
 *   6. Optionally copies AI Optimizer output as offer title + description
 *   7. Clicks "Post Offer to G2G" → postG2gOffer() server action
 *   8. Shows offer ID + link on success
 *
 * Security: All writes go through postG2gOffer() server action.
 *           G2G API keys are NEVER sent to the browser.
 *           RaiderForge does not hold or process any funds.
 */

import { useState, useEffect, useCallback } from 'react'
import {
    postG2gOffer,
    deleteG2gOffer,
    type PostG2gOfferResult,
} from '../actions'
import { LISTING_CURRENCIES } from '../_lib/marketplace-constants'

// ── G2G API response types ────────────────────────────────────────────────────
type G2GItem = { id: string; name: string; slug?: string }

type G2GEnvelope<T> = {
    code?:    string
    payload?: { results?: T[] } | T
}

// ── Panel status ──────────────────────────────────────────────────────────────
type PanelStatus = 'loading' | 'ready' | 'not_configured' | 'api_error'

// ── Helper: fetch a G2G API route and unwrap results array ───────────────────
async function fetchG2gList<T>(url: string): Promise<T[]> {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json() as G2GEnvelope<T>
    const p = json.payload
    if (!p) return []
    if (typeof p === 'object' && 'results' in p && Array.isArray(p.results)) return p.results
    return []
}

// ── Small UI helpers ──────────────────────────────────────────────────────────
function SelectRow({
    label,
    value,
    onChange,
    options,
    loading,
    disabled,
    placeholder,
}: {
    label: string
    value: string
    onChange: (v: string) => void
    options: G2GItem[]
    loading: boolean
    disabled: boolean
    placeholder: string
}) {
    return (
        <div className="space-y-1">
            <label className="block text-[10px] uppercase tracking-wider font-bold text-white/50">
                {label}
            </label>
            <div className="relative">
                <select
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    disabled={disabled || loading || options.length === 0}
                    className="w-full rounded-lg border border-white/[0.10] bg-black/35 px-3 py-2 text-sm text-white appearance-none pr-8 disabled:opacity-45 disabled:cursor-not-allowed focus:outline-none focus:border-orange-500/50 transition-colors"
                >
                    <option value="">
                        {loading ? 'Loading…' : options.length === 0 ? 'None available' : placeholder}
                    </option>
                    {options.map(o => (
                        <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                </select>
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/35 text-xs" aria-hidden>▾</span>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export type MarketplaceG2gOfferPanelProps = {
    /** Generated copy from the AI Listing Optimizer (optional integration) */
    optimizerTitle?:       string
    optimizerDescription?: string
}

export function MarketplaceG2gOfferPanel({
    optimizerTitle,
    optimizerDescription,
}: MarketplaceG2gOfferPanelProps) {
    // ── Panel status ──────────────────────────────────────────────────────────
    const [status, setStatus] = useState<PanelStatus>('loading')
    const [healthError, setHealthError] = useState<string | null>(null)

    // ── G2G cascade selectors ─────────────────────────────────────────────────
    const [services,         setServices]         = useState<G2GItem[]>([])
    const [brands,           setBrands]           = useState<G2GItem[]>([])
    const [products,         setProducts]         = useState<G2GItem[]>([])
    const [selectedService,  setSelectedService]  = useState('')
    const [selectedBrand,    setSelectedBrand]    = useState('')
    const [selectedProduct,  setSelectedProduct]  = useState('')
    const [loadingBrands,    setLoadingBrands]    = useState(false)
    const [loadingProducts,  setLoadingProducts]  = useState(false)

    // ── Offer fields ──────────────────────────────────────────────────────────
    const [unitPrice,        setUnitPrice]        = useState('')
    const [currency,         setCurrency]         = useState<string>(LISTING_CURRENCIES[0])
    const [stock,            setStock]            = useState('1')
    const [minUnits,         setMinUnits]         = useState('1')
    const [useOptimizerCopy, setUseOptimizerCopy] = useState(false)

    // ── Submission state ──────────────────────────────────────────────────────
    const [posting,          setPosting]          = useState(false)
    const [postResult,       setPostResult]       = useState<PostG2gOfferResult | null>(null)

    // ── Offer management (after success) ─────────────────────────────────────
    const [deletingOffer,    setDeletingOffer]    = useState(false)
    const [deleteMsg,        setDeleteMsg]        = useState<string | null>(null)

    // ── 1. Check G2G health on mount ─────────────────────────────────────────
    useEffect(() => {
        let cancelled = false
        void (async () => {
            try {
                const res  = await fetch('/api/marketplace/g2g/health')
                const json = await res.json() as {
                    configured?: boolean
                    g2gHealthy?:  boolean
                    error?:       string
                }
                if (cancelled) return
                if (!json.configured) {
                    setStatus('not_configured')
                    return
                }
                setStatus('ready')
            } catch {
                if (!cancelled) {
                    setHealthError('Could not reach G2G health endpoint.')
                    setStatus('api_error')
                }
            }
        })()
        return () => { cancelled = true }
    }, [])

    // ── 2. Load services once panel is ready ─────────────────────────────────
    useEffect(() => {
        if (status !== 'ready') return
        void fetchG2gList<G2GItem>('/api/marketplace/g2g/services')
            .then(s => setServices(s))
            .catch(() => setServices([]))
    }, [status])

    // ── 3. Load brands when service changes ──────────────────────────────────
    useEffect(() => {
        if (!selectedService) { setBrands([]); setSelectedBrand(''); return }
        setLoadingBrands(true)
        setSelectedBrand('')
        setProducts([])
        setSelectedProduct('')
        void fetchG2gList<G2GItem>(`/api/marketplace/g2g/brands?service_id=${encodeURIComponent(selectedService)}`)
            .then(b => setBrands(b))
            .catch(() => setBrands([]))
            .finally(() => setLoadingBrands(false))
    }, [selectedService])

    // ── 4. Load products when brand changes ──────────────────────────────────
    useEffect(() => {
        if (!selectedService || !selectedBrand) { setProducts([]); setSelectedProduct(''); return }
        setLoadingProducts(true)
        setSelectedProduct('')
        void fetchG2gList<G2GItem>(
            `/api/marketplace/g2g/products?service_id=${encodeURIComponent(selectedService)}&brand_id=${encodeURIComponent(selectedBrand)}`
        )
            .then(p => setProducts(p))
            .catch(() => setProducts([]))
            .finally(() => setLoadingProducts(false))
    }, [selectedService, selectedBrand])

    // Auto-enable optimizer copy when output arrives
    useEffect(() => {
        if (optimizerTitle || optimizerDescription) setUseOptimizerCopy(true)
    }, [optimizerTitle, optimizerDescription])

    // ── 5. Submit offer ───────────────────────────────────────────────────────
    const handlePost = useCallback(async () => {
        if (!selectedService || !selectedBrand || !selectedProduct) return
        const price = parseFloat(unitPrice)
        if (!Number.isFinite(price) || price <= 0) return
        const qty = Math.max(1, parseInt(stock, 10) || 1)
        const min = Math.max(1, parseInt(minUnits, 10) || 1)

        setPosting(true)
        setPostResult(null)
        setDeleteMsg(null)

        const result = await postG2gOffer({
            service_id:          selectedService,
            brand_id:            selectedBrand,
            product_id:          selectedProduct,
            unit_price:          price,
            currency,
            stock:               qty,
            min_unit_per_order:  min,
            ...(useOptimizerCopy && optimizerTitle       && { offer_title:       optimizerTitle }),
            ...(useOptimizerCopy && optimizerDescription && { offer_description: optimizerDescription }),
        })

        setPosting(false)
        setPostResult(result)
    }, [selectedService, selectedBrand, selectedProduct, unitPrice, currency, stock, minUnits, useOptimizerCopy, optimizerTitle, optimizerDescription])

    // ── 6. Delete offer ───────────────────────────────────────────────────────
    const handleDelete = useCallback(async (offerId: string) => {
        setDeletingOffer(true)
        setDeleteMsg(null)
        const r = await deleteG2gOffer(offerId)
        setDeletingOffer(false)
        if (r.ok) {
            setPostResult(null)
            setDeleteMsg('Offer removed from G2G.')
        } else if ('message' in r) {
            setDeleteMsg(`Could not remove: ${r.message}`)
        }
    }, [])

    // ── Render: loading ───────────────────────────────────────────────────────
    if (status === 'loading') {
        return (
            <div className="rounded-2xl border border-orange-500/20 bg-orange-950/30 p-5 animate-pulse">
                <div className="h-4 w-40 bg-white/10 rounded mb-3" />
                <div className="h-3 w-64 bg-white/5 rounded" />
            </div>
        )
    }

    // ── Render: not configured ────────────────────────────────────────────────
    if (status === 'not_configured') {
        return (
            <div className="rounded-2xl border border-white/[0.08] bg-black/25 p-5">
                <div className="flex items-center gap-2.5 mb-2">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-white/30 shrink-0" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
                    </svg>
                    <p className="text-sm font-semibold text-white/45">G2G Escrow — Not Connected</p>
                </div>
                <p className="text-xs text-white/35 leading-relaxed">
                    Add <code className="bg-white/[0.06] px-1 rounded font-mono">G2G_API_KEY</code>,{' '}
                    <code className="bg-white/[0.06] px-1 rounded font-mono">G2G_SECRET_KEY</code>, and{' '}
                    <code className="bg-white/[0.06] px-1 rounded font-mono">G2G_USERNAME</code> to your server
                    environment to enable G2G escrow listings.
                </p>
            </div>
        )
    }

    // ── Render: api error ─────────────────────────────────────────────────────
    if (status === 'api_error') {
        return (
            <div className="rounded-2xl border border-red-500/20 bg-red-950/20 p-4 text-xs text-red-300/80">
                {healthError ?? 'G2G health check failed. Please try again later.'}
            </div>
        )
    }

    // ── Render: ready — full panel ────────────────────────────────────────────
    const canSubmit =
        !posting &&
        Boolean(selectedService) &&
        Boolean(selectedBrand) &&
        Boolean(selectedProduct) &&
        Number.isFinite(parseFloat(unitPrice)) &&
        parseFloat(unitPrice) > 0

    const successResult = postResult?.ok ? postResult : null

    return (
        <div
            className="relative overflow-hidden rounded-2xl border border-orange-500/30 bg-gradient-to-br from-[#180e04]/95 to-[#08060a]/95 p-5"
            style={{ boxShadow: '0 0 0 1px rgba(249,115,22,0.12), 0 0 40px -8px rgba(249,115,22,0.18), 0 8px 32px rgba(0,0,0,0.55)' }}
        >
            {/* Ambient orange glow */}
            <div className="pointer-events-none absolute -top-8 -left-8 h-48 w-48 rounded-full bg-orange-500/[0.05] blur-3xl" aria-hidden />

            {/* ── Header ───────────────────────────────────────────────────── */}
            <div className="flex flex-wrap items-start gap-3 mb-5">
                <div
                    className="shrink-0 h-10 w-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center"
                    style={{ boxShadow: '0 0 12px -2px rgba(249,115,22,0.30)' }}
                >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
                        strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                        className="text-orange-400" aria-hidden>
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-orange-400/85">
                            G2G Secure Escrow
                        </p>
                        <span
                            className="inline-flex items-center gap-1 rounded-md border border-emerald-400/45 bg-emerald-500/[0.10] px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-emerald-300"
                            style={{ boxShadow: '0 0 6px rgba(52,211,153,0.20)' }}
                        >
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" aria-hidden />
                            Connected
                        </span>
                    </div>
                    <h3 className="text-sm font-bold text-white leading-snug">
                        Post Offer to G2G — Official Escrow &amp; Buyer Protection
                    </h3>
                </div>
            </div>

            <p className="text-sm text-white/65 leading-relaxed mb-5">
                List your item directly on G2G. Buyers pay through G2G&apos;s{' '}
                <strong className="text-white/85 font-semibold">secure checkout and escrow system</strong>{' '}
                — funds are held safely and released to you after delivery confirmation.
            </p>

            {/* ── Success state ─────────────────────────────────────────── */}
            {successResult && (
                <div
                    className="mb-5 rounded-xl border border-emerald-400/35 bg-emerald-500/[0.08] px-4 py-3.5"
                    style={{ boxShadow: '0 0 16px -4px rgba(52,211,153,0.20)' }}
                    role="status"
                >
                    <p className="font-bold text-emerald-300 flex items-center gap-1.5 mb-1.5 text-sm">
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                        Offer posted to G2G successfully!
                    </p>
                    <p className="text-xs text-emerald-300/70 leading-relaxed mb-3">
                        Offer ID: <code className="font-mono bg-black/25 px-1.5 py-0.5 rounded text-emerald-200">{successResult.offer_id}</code>
                        {successResult.offer_hash && (
                            <> · Hash: <code className="font-mono bg-black/25 px-1.5 py-0.5 rounded text-emerald-200/70">{successResult.offer_hash.slice(0, 12)}…</code></>
                        )}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <a
                            href="https://www.g2g.com/seller/offers"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/35 bg-emerald-500/[0.10] px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:text-emerald-100 transition-colors"
                        >
                            View on G2G
                            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-3 h-3" aria-hidden>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 9.5l7-7M4 2.5h5.5V8" />
                            </svg>
                        </a>
                        <button
                            type="button"
                            onClick={() => !deletingOffer && void handleDelete(successResult.offer_id)}
                            disabled={deletingOffer}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/[0.08] px-3 py-1.5 text-xs font-semibold text-red-400/80 hover:text-red-300 transition-colors disabled:opacity-50"
                        >
                            {deletingOffer ? 'Removing…' : 'Remove Offer'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setPostResult(null)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/45 hover:text-white/70 transition-colors"
                        >
                            Post Another
                        </button>
                    </div>
                    {deleteMsg && (
                        <p className="mt-2 text-xs text-white/50">{deleteMsg}</p>
                    )}
                </div>
            )}

            {!successResult && (
                <>
                    {/* ── Step 1: G2G Catalog Cascade ──────────────────────── */}
                    <div className="mb-5 space-y-3">
                        <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-white/40 mb-2">
                            Step 1 — Select G2G Category
                        </p>
                        <SelectRow
                            label="Service (Game / Category)"
                            value={selectedService}
                            onChange={setSelectedService}
                            options={services}
                            loading={false}
                            disabled={false}
                            placeholder="Select a service…"
                        />
                        <SelectRow
                            label="Brand / Sub-category"
                            value={selectedBrand}
                            onChange={setSelectedBrand}
                            options={brands}
                            loading={loadingBrands}
                            disabled={!selectedService}
                            placeholder={selectedService ? 'Select a brand…' : 'Select service first'}
                        />
                        <SelectRow
                            label="Product"
                            value={selectedProduct}
                            onChange={setSelectedProduct}
                            options={products}
                            loading={loadingProducts}
                            disabled={!selectedBrand}
                            placeholder={selectedBrand ? 'Select a product…' : 'Select brand first'}
                        />
                    </div>

                    {/* ── Step 2: Pricing ───────────────────────────────────── */}
                    <div className="mb-5 space-y-3">
                        <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-white/40 mb-2">
                            Step 2 — Pricing &amp; Stock
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="block text-[10px] uppercase tracking-wider font-bold text-white/50">
                                    Unit Price
                                </label>
                                <input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    placeholder="e.g. 4.99"
                                    value={unitPrice}
                                    onChange={e => setUnitPrice(e.target.value)}
                                    className="w-full rounded-lg border border-white/[0.10] bg-black/35 px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-orange-500/50 transition-colors"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-[10px] uppercase tracking-wider font-bold text-white/50">
                                    Currency
                                </label>
                                <select
                                    value={currency}
                                    onChange={e => setCurrency(e.target.value)}
                                    className="w-full rounded-lg border border-white/[0.10] bg-black/35 px-3 py-2 text-sm text-white appearance-none focus:outline-none focus:border-orange-500/50 transition-colors"
                                >
                                    {LISTING_CURRENCIES.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="block text-[10px] uppercase tracking-wider font-bold text-white/50">
                                    Stock / Quantity
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    placeholder="1"
                                    value={stock}
                                    onChange={e => setStock(e.target.value)}
                                    className="w-full rounded-lg border border-white/[0.10] bg-black/35 px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-orange-500/50 transition-colors"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-[10px] uppercase tracking-wider font-bold text-white/50">
                                    Min Units / Order
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    placeholder="1"
                                    value={minUnits}
                                    onChange={e => setMinUnits(e.target.value)}
                                    className="w-full rounded-lg border border-white/[0.10] bg-black/35 px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-orange-500/50 transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    {/* ── Step 3: Optional AI copy ──────────────────────────── */}
                    {(optimizerTitle || optimizerDescription) && (
                        <div className="mb-5">
                            <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-white/40 mb-2">
                                Step 3 — Listing Copy (Optional)
                            </p>
                            <label className="flex items-start gap-2.5 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={useOptimizerCopy}
                                    onChange={e => setUseOptimizerCopy(e.target.checked)}
                                    className="mt-0.5 h-4 w-4 rounded border border-orange-500/40 bg-black/40 checked:bg-orange-500 checked:border-orange-500 transition-colors cursor-pointer shrink-0"
                                />
                                <span className="text-xs text-white/65 group-hover:text-white/85 transition-colors leading-relaxed">
                                    Use AI Listing Optimizer output as G2G offer title &amp; description
                                    {optimizerTitle && (
                                        <span className="block mt-0.5 text-orange-400/70 truncate max-w-xs">
                                            &ldquo;{optimizerTitle.slice(0, 60)}{optimizerTitle.length > 60 ? '…' : ''}&rdquo;
                                        </span>
                                    )}
                                </span>
                            </label>
                        </div>
                    )}

                    {/* ── Error state ───────────────────────────────────────── */}
                    {postResult && !postResult.ok && (
                        <div
                            className="mb-4 rounded-xl border border-red-500/30 bg-red-500/[0.07] px-4 py-3 text-xs text-red-300/90 leading-relaxed"
                            role="alert"
                        >
                            <strong className="font-semibold">
                                {(postResult as { ok: false; status: string }).status === 'not_configured'
                                    ? 'G2G API keys not configured on the server.'
                                    : 'Could not post offer:'}
                            </strong>{' '}
                            {'message' in postResult ? (postResult as { message: string }).message : ''}
                        </div>
                    )}

                    {/* ── Escrow disclaimer ─────────────────────────────────── */}
                    <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-white/[0.07] bg-black/25 px-4 py-3">
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white/30 shrink-0 mt-0.5" aria-hidden>
                            <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
                        </svg>
                        <p className="text-[11px] text-white/40 leading-relaxed">
                            <strong className="text-white/55 font-semibold">RaiderForge does not hold, process, or touch any funds.</strong>{' '}
                            All payments and escrow are handled 100% by G2G. Funds are held by G2G and released to
                            you after delivery confirmation. By posting you agree to{' '}
                            <a href="https://www.g2g.com/terms" target="_blank" rel="noopener noreferrer"
                                className="underline underline-offset-2 hover:text-white/60 transition-colors">G2G&apos;s Terms of Service</a>.
                        </p>
                    </div>

                    {/* ── Submit button ─────────────────────────────────────── */}
                    <button
                        type="button"
                        onClick={() => void handlePost()}
                        disabled={!canSubmit}
                        className="w-full rf-btn-orange py-3 text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                        style={canSubmit ? { boxShadow: '0 0 0 1px rgba(249,115,22,0.20), 0 0 28px -3px rgba(249,115,22,0.65)' } : undefined}
                    >
                        {posting ? (
                            <>
                                <svg className="w-4 h-4 animate-spin shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                                    <path strokeLinecap="round" d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                                </svg>
                                Posting to G2G…
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                </svg>
                                Post Offer to G2G — Secure Escrow
                            </>
                        )}
                    </button>
                </>
            )}
        </div>
    )
}
