/**
 * ARDB item list for server-side integrations (marketplace backup, future tooling).
 * API: https://ardb.app/api — see catalog sync pipeline for normalized rows.
 */

import 'server-only'

import { fetchAllItems } from '@/lib/marketplace/ardb/client'
import type { ArdbItemListEntry } from '@/lib/marketplace/ardb/types'

export type ArdbItemsFetchResult = {
    items: ArdbItemListEntry[]
    ok: boolean
    error?: string
}

/**
 * Raw ARDB /items array. Prefer `/api/marketplace/catalog` for hydrated blueprint metadata in the app UI.
 */
export async function fetchArdbItems(): Promise<ArdbItemsFetchResult> {
    try {
        const items = await fetchAllItems()
        return { items, ok: true }
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        console.warn('[ardb-items] fetchAllItems failed:', msg)
        return { items: [], ok: false, error: msg }
    }
}
