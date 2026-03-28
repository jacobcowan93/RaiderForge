/**
 * Browser-side fetch helpers for RaiderForge native marketplace listings.
 * Listings are stored in the RaiderForge DB; item metadata comes from the
 * ARDB-synced catalog (enriched server-side on GET).
 */

const BASE = '/api/marketplace/listings'

// ─── Shared types ─────────────────────────────────────────────────────────────

export type ListingRow = {
    id: string
    sellerId: string
    sellerName: string | null
    sellerImage: string | null
    ardbItemId: string
    itemName: string
    itemIconUrl: string | null
    /** Populated from catalog on GET — null if catalog not yet synced. */
    itemType: string | null
    itemDescription: string | null
    itemRarity: string | null
    price: number
    currency: string
    quantity: number
    /** quantity minus units held by in-progress orders — computed server-side */
    availableQuantity: number
    status: string
    notes: string | null
    createdAt: string
    updatedAt: string
}

export type ListingsError = { ok: false; error: string; message?: string; status?: number }

async function parseError(res: Response): Promise<ListingsError> {
    let json: unknown
    try { json = await res.json() } catch { /* ignore */ }
    const e = json as { error?: string; message?: string } | undefined
    return { ok: false, error: e?.error ?? 'request_failed', message: e?.message, status: res.status }
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export type FetchListingsOpts = {
    status?: 'active' | 'sold' | 'cancelled' | 'all'
    q?: string
    sellerId?: string
    limit?: number
}

export type FetchListingsResult = { ok: true; listings: ListingRow[] } | ListingsError

export async function fetchListings(opts?: FetchListingsOpts): Promise<FetchListingsResult> {
    const qs = new URLSearchParams()
    if (opts?.status) qs.set('status', opts.status)
    if (opts?.q) qs.set('q', opts.q)
    if (opts?.sellerId) qs.set('sellerId', opts.sellerId)
    if (opts?.limit !== undefined) qs.set('limit', String(opts.limit))
    const q = qs.toString()
    const res = await fetch(`${BASE}${q ? `?${q}` : ''}`)
    if (!res.ok) return parseError(res)
    const json = await res.json() as { listings?: ListingRow[] }
    return { ok: true, listings: json.listings ?? [] }
}

// ─── Create ───────────────────────────────────────────────────────────────────

export type CreateListingBody = {
    ardbItemId: string
    price: number
    currency?: string
    quantity?: number
    notes?: string
}

export type CreateListingResult = { ok: true; listing: ListingRow } | ListingsError

export async function createListing(body: CreateListingBody): Promise<CreateListingResult> {
    const res = await fetch(BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
    if (!res.ok) return parseError(res)
    const json = await res.json() as { listing: ListingRow }
    return { ok: true, listing: json.listing }
}

// ─── Update ───────────────────────────────────────────────────────────────────

export type UpdateListingBody = {
    price?: number
    currency?: string
    quantity?: number
    notes?: string
    status?: 'active' | 'sold' | 'cancelled'
}

export type UpdateListingResult = { ok: true; listing: ListingRow } | ListingsError

export async function updateListing(id: string, body: UpdateListingBody): Promise<UpdateListingResult> {
    const res = await fetch(`${BASE}/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
    if (!res.ok) return parseError(res)
    const json = await res.json() as { listing: ListingRow }
    return { ok: true, listing: json.listing }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export type DeleteListingResult = { ok: true } | ListingsError

export async function deleteListing(id: string): Promise<DeleteListingResult> {
    const res = await fetch(`${BASE}/${encodeURIComponent(id)}`, { method: 'DELETE' })
    if (!res.ok) return parseError(res)
    return { ok: true }
}

// ─── ARDB Catalog (for the item picker) ──────────────────────────────────────

export type CatalogItemSummary = {
    ardbId: string
    name: string
    iconUrl: string | null
    imageUrl: string | null
    description: string | null
    rarity: string | null
    itemType: string | null
    foundIn: string[]
}

export type FetchCatalogResult =
    | { ok: true; items: CatalogItemSummary[]; syncedAt: string | null }
    | ListingsError

export async function fetchCatalogItems(): Promise<FetchCatalogResult> {
    const res = await fetch('/api/marketplace/catalog')
    if (!res.ok) return parseError(res)
    const payload = await res.json() as {
        items?: Array<{
            ardbId: string
            name: string
            iconUrl?: string | null
            imageUrl?: string | null
            description?: string | null
            rarity?: string | null
            itemType?: string | null
            foundIn?: string[]
        }>
        syncedAt?: string | null
    }
    const items: CatalogItemSummary[] = (payload.items ?? []).map((it) => ({
        ardbId: it.ardbId,
        name: it.name,
        iconUrl: it.iconUrl ?? null,
        imageUrl: it.imageUrl ?? null,
        description: it.description ?? null,
        rarity: it.rarity ?? null,
        itemType: it.itemType ?? null,
        foundIn: it.foundIn ?? [],
    }))
    return { ok: true, items, syncedAt: payload.syncedAt ?? null }
}
