import 'server-only'

import fs from 'fs/promises'
import path from 'path'

import type { MarketplaceCatalogItem } from '@/lib/marketplace/catalog-types'

export type MarketplaceCatalogFileV1 = {
    version: 1
    syncedAt: string
    itemsById: Record<string, MarketplaceCatalogItem>
}

function useMemoryOnly(): boolean {
    return process.env.NODE_ENV === 'production'
}

/** Production (e.g. Vercel): last sync result per instance; no disk I/O. */
let memoryCatalog: MarketplaceCatalogFileV1 | null = null

export function getMarketplaceCatalogStorePath(): string {
    const override = process.env.MARKETPLACE_CATALOG_PATH
    if (override && override.trim() !== '') return override
    return path.join(/* turbopackIgnore: true */ process.cwd(), 'data', 'marketplace-ardb-catalog.json')
}

export async function readCatalogStore(): Promise<MarketplaceCatalogFileV1 | null> {
    if (useMemoryOnly()) {
        return memoryCatalog
    }
    const p = getMarketplaceCatalogStorePath()
    try {
        const raw = await fs.readFile(p, 'utf8')
        const parsed = JSON.parse(raw) as MarketplaceCatalogFileV1
        if (!parsed || parsed.version !== 1 || typeof parsed.itemsById !== 'object') {
            return null
        }
        return parsed
    } catch (e) {
        const code = (e as NodeJS.ErrnoException)?.code
        if (code === 'ENOENT') return null
        throw e
    }
}

export async function writeCatalogStore(data: MarketplaceCatalogFileV1): Promise<void> {
    if (useMemoryOnly()) {
        memoryCatalog = data
        return
    }
    const p = getMarketplaceCatalogStorePath()
    await fs.mkdir(path.dirname(p), { recursive: true })
    await fs.writeFile(p, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

/** Full replace from latest ARDB sync (idempotent, safe to rerun). */
export async function replaceCatalogItems(items: MarketplaceCatalogItem[]): Promise<MarketplaceCatalogFileV1> {
    const syncedAt = new Date().toISOString()
    const itemsById: Record<string, MarketplaceCatalogItem> = {}
    for (const it of items) {
        itemsById[it.ardbId] = it
    }
    const file: MarketplaceCatalogFileV1 = { version: 1, syncedAt, itemsById }
    await writeCatalogStore(file)
    return file
}
