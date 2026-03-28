import { NextResponse } from 'next/server'

import type { MarketplaceCatalogItem } from '@/lib/marketplace/catalog-types'
import { ARDB_CATALOG_ATTRIBUTION } from '@/lib/marketplace/catalog-types'
import { fetchAllItems } from '@/lib/marketplace/ardb/client'
import { normalizeArdbItemToCatalog } from '@/lib/marketplace/ardb/normalize'
import { readCatalogStore } from '@/lib/marketplace/ardb/catalog-store'

export const dynamic = 'force-dynamic'

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
            const bp = items.filter((i) => i.itemType?.trim().toLowerCase() === 'blueprint').length
            console.warn(
                `[marketplace/catalog] Live fallback OK: ${items.length} items total, ${bp} blueprint rows (itemType blueprint)`
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
