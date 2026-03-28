/**
 * Browser-side fetch helpers for RaiderForge → /api/marketplace/g2g/*
 *
 * No G2G credentials ever appear here — all secrets stay server-only.
 * These functions call internal Next.js API routes which proxy to G2G.
 */

const BASE = '/api/marketplace/g2g'

// ─── Shared result types ─────────────────────────────────────────────────────

export type MarketplaceRouteError = {
    ok: false
    error: string
    missingKeys?: string[]
    status?: number
    code?: string
    request_id?: string
    fields?: string[]
}

export type MarketplaceRouteOk<T> = {
    ok: true
    request_id: string
    code: string
    message: string
    warning: string
    payload: T
}

export type MarketplaceResult<T> = MarketplaceRouteOk<T> | MarketplaceRouteError

async function readJson<T>(res: Response): Promise<T> {
    return res.json() as Promise<T>
}

// ─── Browse / Buyer (read-only) ──────────────────────────────────────────────

export async function fetchMarketplaceServices(language?: string): Promise<MarketplaceResult<unknown>> {
    const qs = new URLSearchParams()
    if (language !== undefined && language !== '') qs.set('language', language)
    const q = qs.toString()
    const res = await fetch(`${BASE}/services${q ? `?${q}` : ''}`)
    return readJson(res)
}

export async function fetchMarketplaceBrands(
    serviceId: string,
    opts?: { language?: string; q?: string; after?: string }
): Promise<MarketplaceResult<unknown>> {
    const qs = new URLSearchParams()
    qs.set('service_id', serviceId)
    if (opts?.language !== undefined && opts.language !== '') qs.set('language', opts.language)
    if (opts?.q !== undefined && opts.q !== '') qs.set('q', opts.q)
    if (opts?.after !== undefined && opts.after !== '') qs.set('after', opts.after)
    const res = await fetch(`${BASE}/brands?${qs.toString()}`)
    return readJson(res)
}

export async function fetchMarketplaceProducts(query: {
    service_id?: string
    brand_id?: string
    category_id?: string
    q?: string
}): Promise<MarketplaceResult<unknown>> {
    const qs = new URLSearchParams()
    for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== '') qs.set(k, v)
    }
    const q = qs.toString()
    const res = await fetch(`${BASE}/products${q ? `?${q}` : ''}`)
    return readJson(res)
}

/** Search public offers — used in the buyer Browse tab. */
export async function searchMarketplaceOffers(body: {
    filter: Record<string, unknown>
    page_size?: number
    page?: number
}): Promise<MarketplaceResult<unknown>> {
    const res = await fetch(`${BASE}/offers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
    return readJson(res)
}

// ─── Seller / Inventory ──────────────────────────────────────────────────────

/**
 * Fetch the authenticated seller's own offers.
 * Maps to GET /api/marketplace/g2g/inventory → POST /v2/offers/search (server-side).
 */
export async function fetchSellerOffers(opts?: {
    page?: number
    page_size?: number
    status?: string
}): Promise<MarketplaceResult<unknown>> {
    const qs = new URLSearchParams()
    if (opts?.page !== undefined) qs.set('page', String(opts.page))
    if (opts?.page_size !== undefined) qs.set('page_size', String(opts.page_size))
    if (opts?.status !== undefined && opts.status !== '') qs.set('status', opts.status)
    const q = qs.toString()
    const res = await fetch(`${BASE}/inventory${q ? `?${q}` : ''}`)
    return readJson(res)
}

/**
 * Create a new offer on G2G.
 * Required fields: service_id, brand_id, product_id, unit_price, currency.
 * Maps to POST /api/marketplace/g2g/inventory → POST /v2/offers.
 */
export async function createSellerOffer(body: Record<string, unknown>): Promise<MarketplaceResult<unknown>> {
    const res = await fetch(`${BASE}/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
    return readJson(res)
}

/**
 * Partially update an existing offer.
 * Maps to PATCH /api/marketplace/g2g/inventory?offer_id={id} → PATCH /v2/offers/{id}.
 */
export async function updateSellerOffer(
    offerId: string,
    body: Record<string, unknown>
): Promise<MarketplaceResult<unknown>> {
    const res = await fetch(`${BASE}/inventory?offer_id=${encodeURIComponent(offerId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
    return readJson(res)
}

/**
 * Remove an offer from G2G.
 * Maps to DELETE /api/marketplace/g2g/inventory?offer_id={id} → DELETE /v2/offers/{id}.
 */
export async function deleteSellerOffer(offerId: string): Promise<MarketplaceResult<unknown>> {
    const res = await fetch(`${BASE}/inventory?offer_id=${encodeURIComponent(offerId)}`, {
        method: 'DELETE',
    })
    return readJson(res)
}

// ─── Orders ──────────────────────────────────────────────────────────────────

/**
 * Get order status by order ID.
 * Maps to GET /api/marketplace/g2g/orders?order_id={id} → GET /v2/orders/{id}.
 * Documented statuses include: unpaid, cancelled, confirmed, and delivery states.
 */
export async function fetchOrder(orderId: string): Promise<MarketplaceResult<unknown>> {
    const res = await fetch(`${BASE}/orders?order_id=${encodeURIComponent(orderId)}`)
    return readJson(res)
}

/**
 * Deliver codes for an order (Order Delivery Flow / Upload Code Flow).
 * Call this after receiving an `order.api_delivery` webhook event.
 * Maps to POST /api/marketplace/g2g/orders → POST /v2/orders/{id}/delivery.
 *
 * @param orderId  G2G order ID
 * @param codes    Array of delivery codes / digital items to upload
 */
export async function deliverOrderCodes(
    orderId: string,
    codes: string[]
): Promise<MarketplaceResult<unknown>> {
    const res = await fetch(`${BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, codes }),
    })
    return readJson(res)
}
