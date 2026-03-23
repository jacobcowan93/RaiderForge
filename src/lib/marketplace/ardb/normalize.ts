import { ARDB_STATIC_BASE } from './constants'
import type { MarketplaceCatalogItem } from '@/lib/marketplace/catalog-types'
import type { ArdbItemDetail, ArdbItemListEntry } from './types'

function absolutizeStaticPath(relativeOrAbsolute: string | undefined | null): string | null {
    if (relativeOrAbsolute == null || relativeOrAbsolute === '') return null
    const v = relativeOrAbsolute
    if (v.startsWith('http://') || v.startsWith('https://')) return v
    const path = v.startsWith('/') ? v : `/${v}`
    return `${ARDB_STATIC_BASE}${path}`
}

export function normalizeArdbItemToCatalog(
    listEntry: ArdbItemListEntry,
    detail: ArdbItemDetail | undefined,
    syncedAt: string
): MarketplaceCatalogItem {
    const merged = detail ?? listEntry
    const iconPath = detail?.icon ?? listEntry.icon
    const imagePath = detail?.image

    const sources = detail?.sources
    const sourceImageUrls: string[] = []
    if (Array.isArray(sources)) {
        for (const s of sources) {
            if (typeof s !== 'string') continue
            const abs = absolutizeStaticPath(s)
            if (abs) sourceImageUrls.push(abs)
        }
    }

    const iconUrl = absolutizeStaticPath(iconPath)
    const imageUrl = absolutizeStaticPath(imagePath)

    return {
        source: 'ardb',
        ardbId: listEntry.id,
        name: typeof merged.name === 'string' ? merged.name : listEntry.name,
        description:
            typeof merged.description === 'string'
                ? merged.description
                : typeof listEntry.description === 'string'
                  ? listEntry.description
                  : null,
        rarity: merged.rarity ?? listEntry.rarity,
        itemType: typeof merged.type === 'string' ? merged.type : listEntry.type,
        value: typeof merged.value === 'number' ? merged.value : listEntry.value,
        foundIn: Array.isArray(merged.foundIn) ? merged.foundIn : listEntry.foundIn,
        iconUrl,
        imageUrl,
        sourceImageUrls,
        stackSize: typeof detail?.stackSize === 'number' ? detail.stackSize : null,
        weight: typeof detail?.weight === 'number' ? detail.weight : null,
        ardbUpdatedAt: typeof merged.updatedAt === 'string' ? merged.updatedAt : listEntry.updatedAt,
        syncedAt,
    }
}
