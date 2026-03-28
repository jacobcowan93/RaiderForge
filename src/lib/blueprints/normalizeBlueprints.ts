import type { MarketplaceCatalogItem } from '@/lib/marketplace/catalog-types'

/** ARDB list/detail `type` for craft recipe items (observed live API value: lowercase `"blueprint"`). */
const ARDB_BLUEPRINT_ITEM_TYPE = 'blueprint'

export type NormalizedBlueprint = {
    /** Stable id — ARDB item id from catalog. */
    id: string
    name: string
    /** Spreadsheet `Blueprints` label when this row was allowlist-matched. */
    trackerDisplayName?: string
    /** Spreadsheet `Type` column when allowlist-matched. */
    spreadsheetType?: string | null
    /** 1-based order from spreadsheet allowlist. */
    spreadsheetOrder?: number | null
    description: string | null
    /** From ARDB; many blueprint rows use `null`. */
    rarity: string | null
    /** Same as catalog `itemType` (expected `"blueprint"` for this subset). */
    itemType: string
    /** ARDB loot / location tags when present. */
    foundIn: string[]
    iconUrl: string | null
    imageUrl: string | null
    /** ARDB detail `sources` (e.g. inspect art); often the only non-generic image for blueprints. */
    sourceImageUrls: string[]
    /** ARDB `blueprintFor.icon` — crafted item icon when present. */
    craftedItemIconUrl: string | null
}

export function isBlueprintCatalogItem(item: MarketplaceCatalogItem): boolean {
    if (item.itemType == null || item.itemType.trim() === '') return false
    return item.itemType.trim().toLowerCase() === ARDB_BLUEPRINT_ITEM_TYPE
}

export function normalizeBlueprintFromCatalogItem(item: MarketplaceCatalogItem): NormalizedBlueprint {
    return {
        id: item.ardbId,
        name: item.name,
        description: item.description,
        rarity: item.rarity,
        itemType: item.itemType ?? ARDB_BLUEPRINT_ITEM_TYPE,
        foundIn: [...item.foundIn].filter((s) => typeof s === 'string' && s.trim() !== '').sort((a, b) => a.localeCompare(b)),
        iconUrl: item.iconUrl,
        imageUrl: item.imageUrl,
        sourceImageUrls: Array.isArray(item.sourceImageUrls) ? [...item.sourceImageUrls] : [],
        craftedItemIconUrl: item.craftedItemIconUrl ?? null,
    }
}

export function blueprintsFromCatalogItems(items: MarketplaceCatalogItem[]): NormalizedBlueprint[] {
    return items.filter(isBlueprintCatalogItem).map(normalizeBlueprintFromCatalogItem)
}

/** For ordering; unknown / null sorts after legendary. */
const RARITY_RANK: Record<string, number> = {
    common: 0,
    uncommon: 1,
    rare: 2,
    epic: 3,
    legendary: 4,
}

export function raritySortKey(rarity: string | null): number {
    if (rarity == null || rarity.trim() === '') return 999
    const k = rarity.trim().toLowerCase()
    return k in RARITY_RANK ? RARITY_RANK[k]! : 100
}

export function collectFoundInTags(blueprints: NormalizedBlueprint[]): string[] {
    const set = new Set<string>()
    for (const b of blueprints) {
        for (const t of b.foundIn) set.add(t)
    }
    return [...set].sort((a, b) => a.localeCompare(b))
}
