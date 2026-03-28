import { NextResponse } from 'next/server'

import type { MarketplaceCatalogItem } from '@/lib/marketplace/catalog-types'
import { ARDB_CATALOG_ATTRIBUTION } from '@/lib/marketplace/catalog-types'
import { fetchAllItems, fetchItemById } from '@/lib/marketplace/ardb/client'
import { normalizeArdbItemToCatalog } from '@/lib/marketplace/ardb/normalize'
import { readCatalogStore } from '@/lib/marketplace/ardb/catalog-store'
import type { ArdbItemListEntry } from '@/lib/marketplace/ardb/types'

export const dynamic = 'force-dynamic'

const BLUEPRINT_TYPE = 'blueprint'
const HYDRATE_BLUEPRINT_CONCURRENCY = 10

async function hydrateBlueprintItemsFromList(
    list: ArdbItemListEntry[],
    items: MarketplaceCatalogItem[],
    syncedAt: string
): Promise<void> {
    const blueprintEntries = list.filter((e) => String(e.type).toLowerCase().trim() === BLUEPRINT_TYPE)
    for (let i = 0; i < blueprintEntries.length; i += HYDRATE_BLUEPRINT_CONCURRENCY) {
        const batch = blueprintEntries.slice(i, i + HYDRATE_BLUEPRINT_CONCURRENCY)
        await Promise.all(
            batch.map(async (entry) => {
                try {
                    const detail = await fetchItemById(entry.id)
                    const row = normalizeArdbItemToCatalog(entry, detail, syncedAt)
                    const idx = items.findIndex((it) => it.ardbId === entry.id)
                    if (idx >= 0) items[idx] = row
                } catch (e) {
                    const msg = e instanceof Error ? e.message : String(e)
                    console.warn(`[marketplace/catalog] Blueprint detail hydrate failed (${entry.id}):`, msg)
                }
            })
        )
    }
}

export type CatalogGetPayload = {
    syncedAt: string | null
    count: number
    attribution: typeof ARDB_CATALOG_ATTRIBUTION
    items: MarketplaceCatalogItem[]
    /** `live` = empty persisted store; served from ARDB GET /items (list-only, no hydrate). */
    catalogSource?: 'persisted' | 'live'
}

export async function GET() {
    const store = await readCatalogStore()
    let items = store ? Object.values(store.itemsById) : []
    let syncedAt = store?.syncedAt ?? null
    let catalogSource: 'persisted' | 'live' = 'persisted'

    if (items.length === 0) {
        console.warn('[marketplace/catalog] Persisted catalog empty or missing; attempting live ARDB /items fallback')
        try {
            const list = await fetchAllItems()
            const now = new Date().toISOString()
            items = list.map((entry) => normalizeArdbItemToCatalog(entry, undefined, now))
            syncedAt = now
            catalogSource = 'live'
            await hydrateBlueprintItemsFromList(list, items, now)
            const bp = items.filter((i) => i.itemType?.trim().toLowerCase() === 'blueprint').length
            console.warn(
                `[marketplace/catalog] Live fallback OK: ${items.length} items total, ${bp} blueprint rows (itemType blueprint), blueprint rows detail-hydrated for images`
            )
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e)
            console.error('[marketplace/catalog] Live ARDB fallback failed (blueprint tracker will be empty):', msg)
            items = []
        }
    }

    items.sort((a, b) => a.name.localeCompare(b.name))

    const blueprintRows = items.filter((i) => i.itemType?.trim().toLowerCase() === 'blueprint').length
    if (items.length > 0 && blueprintRows === 0) {
        console.warn(
            '[marketplace/catalog] Persisted catalog has items but zero blueprint rows (itemType === "blueprint"). Check ARDB mapping.'
        )
    }

    const body: CatalogGetPayload = {
        syncedAt,
        count: items.length,
        attribution: ARDB_CATALOG_ATTRIBUTION,
        items,
        catalogSource,
    }

    return NextResponse.json(body)
}
