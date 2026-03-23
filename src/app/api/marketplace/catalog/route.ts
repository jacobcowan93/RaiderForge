import { NextResponse } from 'next/server'

import { ARDB_CATALOG_ATTRIBUTION } from '@/lib/marketplace/catalog-types'
import { readCatalogStore } from '@/lib/marketplace/ardb/catalog-store'

export const dynamic = 'force-dynamic'

export async function GET() {
    const store = await readCatalogStore()
    const items = store ? Object.values(store.itemsById) : []
    items.sort((a, b) => a.name.localeCompare(b.name))

    return NextResponse.json({
        syncedAt: store?.syncedAt ?? null,
        count: items.length,
        attribution: ARDB_CATALOG_ATTRIBUTION,
        items,
    })
}
