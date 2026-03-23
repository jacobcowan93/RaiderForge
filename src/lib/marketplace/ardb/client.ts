import 'server-only'

import { ARDB_API_BASE } from './constants'
import type { ArdbItemDetail, ArdbItemListEntry } from './types'

async function ardbFetchJson<T>(path: string): Promise<T> {
    const url = `${ARDB_API_BASE}${path.startsWith('/') ? path : `/${path}`}`
    const res = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
    })
    if (!res.ok) {
        const body = await res.text().catch(() => '')
        throw new Error(`ARDB request failed ${res.status} ${path}${body ? `: ${body.slice(0, 200)}` : ''}`)
    }
    return res.json() as Promise<T>
}

export async function fetchAllItems(): Promise<ArdbItemListEntry[]> {
    const data = await ardbFetchJson<unknown>('/items')
    if (!Array.isArray(data)) {
        throw new Error('ARDB GET /items: expected a JSON array')
    }
    return data as ArdbItemListEntry[]
}

export async function fetchItemById(id: string): Promise<ArdbItemDetail> {
    const encoded = encodeURIComponent(id)
    const data = await ardbFetchJson<unknown>(`/items/${encoded}`)
    if (data === null || typeof data !== 'object' || Array.isArray(data)) {
        throw new Error('ARDB GET /items/{id}: expected a JSON object')
    }
    return data as ArdbItemDetail
}
