import { ARDB_STATIC_BASE } from './constants'
import type { CatalogCraftingIngredient, MarketplaceCatalogItem } from '@/lib/marketplace/catalog-types'
import type { ArdbItemDetail, ArdbItemListEntry } from './types'

/** Map ARDB `type` (or rare `itemType`) onto catalog `itemType` without changing blueprint detection semantics. */
function resolveArdbItemType(merged: ArdbItemDetail | ArdbItemListEntry, listEntry: ArdbItemListEntry): string | null {
    const m = merged as { type?: unknown; itemType?: unknown }
    if (typeof m.type === 'string' && m.type.trim() !== '') return m.type
    if (typeof m.itemType === 'string' && m.itemType.trim() !== '') return m.itemType
    if (typeof listEntry.type === 'string' && listEntry.type.trim() !== '') return listEntry.type
    return null
}

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

    const craftedItemIconUrl = absolutizeStaticPath(
        detail?.blueprintFor && typeof detail.blueprintFor.icon === 'string' ? detail.blueprintFor.icon : null
    )

    const itemType = resolveArdbItemType(merged, listEntry)

    const craftingIngredients = extractCraftingIngredients(detail)

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
        itemType,
        value: typeof merged.value === 'number' ? merged.value : listEntry.value,
        foundIn: Array.isArray(merged.foundIn) ? merged.foundIn : listEntry.foundIn,
        iconUrl,
        imageUrl,
        sourceImageUrls,
        craftedItemIconUrl,
        stackSize: typeof detail?.stackSize === 'number' ? detail.stackSize : null,
        weight: typeof detail?.weight === 'number' ? detail.weight : null,
        ...(craftingIngredients.length > 0 ? { craftingIngredients } : {}),
        ardbUpdatedAt: typeof merged.updatedAt === 'string' ? merged.updatedAt : listEntry.updatedAt,
        syncedAt,
    }
}

function extractCraftingIngredients(detail: ArdbItemDetail | undefined) {
    const req = detail?.craftingRequirement?.requiredItems
    if (!Array.isArray(req) || req.length === 0) return []
    const out: CatalogCraftingIngredient[] = []
    for (const row of req) {
        const item = row?.item
        if (!item || typeof item.name !== 'string' || item.name.trim() === '') continue
        const id = typeof item.id === 'string' && item.id.trim() !== '' ? item.id : item.name
        const amount = typeof row.amount === 'number' && row.amount > 0 ? row.amount : 1
        out.push({ itemId: id, name: item.name.trim(), amount })
    }
    return out
}
