/** Summarized from ARDB `craftingRequirement.requiredItems` on item detail. */
export type CatalogCraftingIngredient = {
    itemId: string
    name: string
    amount: number
}

/** Local marketplace item row synced from ARDB (metadata only; G2G handles offers). */
export type MarketplaceCatalogItem = {
    source: 'ardb'
    ardbId: string
    name: string
    description: string | null
    rarity: string | null
    itemType: string | null
    value: number | null
    foundIn: string[]
    iconUrl: string | null
    imageUrl: string | null
    sourceImageUrls: string[]
    /** Blueprint detail: icon URL for the crafted item (`blueprintFor`), when ARDB provides it. */
    craftedItemIconUrl: string | null
    stackSize: number | null
    weight: number | null
    /** Present when detail sync included `craftingRequirement`. */
    craftingIngredients?: CatalogCraftingIngredient[]
    ardbUpdatedAt: string
    syncedAt: string
}

export const ARDB_CATALOG_ATTRIBUTION = {
    providerName: 'ARDB',
    providerUrl: 'https://ardb.app/',
    apiDocsUrl: 'https://ardb.app/developers/api',
    disclaimer:
        'ARC Raiders item metadata is periodically synced from ARDB for reference. ARDB may change their API at any time; verify in-game where it matters.',
} as const
