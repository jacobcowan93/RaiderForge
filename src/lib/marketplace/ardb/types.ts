/**
 * Shapes observed from GET /items and GET /items/{id} as of integration.
 * Optional fields tolerate API evolution per ARDB docs.
 */

export type ArdbItemListEntry = {
    id: string
    name: string
    description?: string
    rarity: string | null
    type: string
    foundIn: string[]
    value: number
    icon?: string
    updatedAt: string
}

/** Nested item summaries returned inside detail payloads (e.g. crafting). */
export type ArdbItemNestedRef = {
    id: string
    name: string
    rarity: string | null
    type: string
    foundIn: string[]
    value: number
    icon?: string
    updatedAt: string
}

export type ArdbCraftingRequirement = {
    outputAmount: number
    requiredItems: Array<{ item: ArdbItemNestedRef; amount: number }>
}

export type ArdbBreakIntoEntry = {
    item: ArdbItemNestedRef
    amount: number
}

export type ArdbItemDetail = ArdbItemListEntry & {
    stackSize?: number
    weight?: number
    image?: string
    sources?: string[]
    maps?: unknown[]
    quickUseSpecs?: Record<string, number>
    craftingRequirement?: ArdbCraftingRequirement
    breaksInto?: ArdbBreakIntoEntry[]
    /** Present on some blueprint detail payloads — the item this blueprint crafts. */
    blueprintFor?: ArdbItemNestedRef
}
