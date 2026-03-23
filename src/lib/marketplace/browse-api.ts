/**
 * Browser-side fetch helpers for RaiderForge → /api/marketplace/g2g/* (no G2G secrets).
 */

const BASE = '/api/marketplace/g2g'

export type MarketplaceRouteError = {
    ok: false
    error: string
    missingKeys?: string[]
    status?: number
    code?: string
    request_id?: string
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

export async function searchMarketplaceOffers(body: {
    filter: Record<string, unknown>
    page_size?: number
    page?: number
}): Promise<MarketplaceResult<unknown>> {
    const res = await fetch(`${BASE}/offers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    })
    return readJson(res)
}
