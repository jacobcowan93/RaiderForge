import type { MarketplaceCatalogItem } from '@/lib/marketplace/catalog-types'

export type LoadoutSlotId = 'primary' | 'secondary' | 'utility1' | 'utility2' | 'armor' | 'backpack'

export const LOADOUT_SLOTS: { id: LoadoutSlotId; label: string; hint: string }[] = [
    { id: 'primary', label: 'Primary', hint: 'Main weapon' },
    { id: 'secondary', label: 'Secondary', hint: 'Sidearm / backup' },
    { id: 'utility1', label: 'Utility 1', hint: 'Gadget / tool' },
    { id: 'utility2', label: 'Utility 2', hint: 'Gadget / tool' },
    { id: 'armor', label: 'Armor', hint: 'Protection' },
    { id: 'backpack', label: 'Backpack', hint: 'Storage' },
]

/** Serializable item snapshot for slots + localStorage. */
export type LoadoutItemRef = {
    ardbId: string
    name: string
    rarity: string | null
    itemType: string | null
    iconUrl: string | null
    weight: number | null
}

export type LoadoutPersistedV1 = {
    v: 1
    name: string
    slots: Partial<Record<LoadoutSlotId, LoadoutItemRef>>
}

export function catalogItemToRef(item: MarketplaceCatalogItem): LoadoutItemRef {
    const icon =
        item.iconUrl?.trim() ||
        item.imageUrl?.trim() ||
        item.craftedItemIconUrl?.trim() ||
        item.sourceImageUrls.find((u) => u?.trim()) ||
        null
    return {
        ardbId: item.ardbId,
        name: item.name,
        rarity: item.rarity,
        itemType: item.itemType,
        iconUrl: icon,
        weight: item.weight,
    }
}

export const LOADOUT_DRAG_MIME = 'application/x-raiderforge-loadout-item'
