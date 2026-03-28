import type { MarketplaceCatalogItem } from '@/lib/marketplace/catalog-types'

/** Ordered image URLs for catalog cards — try in order; advance with `onError` in the UI. */
export function catalogItemImageCandidates(item: MarketplaceCatalogItem): string[] {
    const seen = new Set<string>()
    const out: string[] = []
    function push(u: string | null | undefined) {
        if (!u || !u.trim()) return
        const t = u.trim()
        if (seen.has(t)) return
        seen.add(t)
        out.push(t)
    }
    push(item.imageUrl)
    push(item.iconUrl)
    for (const u of item.sourceImageUrls) push(u)
    push(item.craftedItemIconUrl)
    return out
}
