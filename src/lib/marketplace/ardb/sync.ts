import 'server-only'

import type { MarketplaceCatalogItem } from '@/lib/marketplace/catalog-types'

import { fetchAllItems, fetchItemById } from './client'
import { replaceCatalogItems } from './catalog-store'
import { normalizeArdbItemToCatalog } from './normalize'
import type { ArdbItemDetail, ArdbItemListEntry } from './types'

export type ArdbCatalogSyncOptions = {
    /** When true (default), calls GET /items/{id} per item to enrich image/sources/etc. */
    hydrateDetails?: boolean
    /** Parallel detail fetches per batch. */
    concurrency?: number
}

/**
 * Fetches ARDB, normalizes items, then persists via replaceCatalogItems.
 * In production, persistence is in-memory only (no disk); locally, JSON file.
 */
export async function syncMarketplaceCatalogFromArdb(
    opts: ArdbCatalogSyncOptions = {}
): Promise<{ count: number; syncedAt: string }> {
    const hydrateDetails = opts.hydrateDetails !== false
    const concurrency = typeof opts.concurrency === 'number' && opts.concurrency > 0 ? opts.concurrency : 10

    const list = await fetchAllItems()
    const syncedAt = new Date().toISOString()
    const out: MarketplaceCatalogItem[] = []

    async function one(entry: ArdbItemListEntry): Promise<MarketplaceCatalogItem> {
        let detail: ArdbItemDetail | undefined
        if (hydrateDetails) {
            try {
                detail = await fetchItemById(entry.id)
            } catch {
                detail = undefined
            }
        }
        return normalizeArdbItemToCatalog(entry, detail, syncedAt)
    }

    for (let i = 0; i < list.length; i += concurrency) {
        const batch = list.slice(i, i + concurrency)
        const done = await Promise.all(batch.map((e) => one(e)))
        out.push(...done)
    }

    const file = await replaceCatalogItems(out)
    return { count: out.length, syncedAt: file.syncedAt }
}
