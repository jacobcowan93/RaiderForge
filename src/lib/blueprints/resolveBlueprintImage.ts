import type { NormalizedBlueprint } from '@/lib/blueprints/normalizeBlueprints'

/** ARDB blueprint rows often use this for both `image` and `icon`. */
const GENERIC_RECIPE_RE = /\/recipe\.webp$/i

function isGenericRecipeUrl(url: string | null | undefined): boolean {
    return !url || GENERIC_RECIPE_RE.test(url)
}

/** Normalize for optional local filename lookups (future / manual overrides). */
export function blueprintLookupKey(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
}

const LOCAL_BY_ARDB_ID: Record<string, string> = {}

const LOCAL_BY_NAME_KEY: Record<string, string> = {}

function firstNonGenericSource(urls: string[]): string | null {
    for (const u of urls) {
        if (typeof u === 'string' && u.trim() !== '' && !isGenericRecipeUrl(u)) return u
    }
    return null
}

type ImageFields = Pick<
    NormalizedBlueprint,
    'id' | 'name' | 'imageUrl' | 'iconUrl' | 'sourceImageUrls' | 'craftedItemIconUrl'
>

/**
 * Priority (per product spec + ARDB shape):
 * 1. Item-specific `imageUrl` (skip generic recipe sheet)
 * 2. Item-specific `iconUrl`
 * 3. Local overrides (`public/` assets)
 * 4. ARDB `sourceImageUrls` (inspect renders)
 * 5. `craftedItemIconUrl` from blueprintFor (crafted item icon)
 * 6. Generic `imageUrl` / `iconUrl` last resort
 */
export function resolveBlueprintImage(b: ImageFields): string | null {
    if (b.imageUrl && !isGenericRecipeUrl(b.imageUrl)) return b.imageUrl
    if (b.iconUrl && !isGenericRecipeUrl(b.iconUrl)) return b.iconUrl

    const localId = LOCAL_BY_ARDB_ID[b.id]
    if (localId && localId.trim() !== '') return localId
    const localName = LOCAL_BY_NAME_KEY[blueprintLookupKey(b.name)]
    if (localName && localName.trim() !== '') return localName

    const fromSources = firstNonGenericSource(b.sourceImageUrls)
    if (fromSources) return fromSources
    if (b.sourceImageUrls.length > 0 && b.sourceImageUrls[0]?.trim() !== '') return b.sourceImageUrls[0]

    if (b.craftedItemIconUrl && !isGenericRecipeUrl(b.craftedItemIconUrl)) return b.craftedItemIconUrl

    if (b.imageUrl) return b.imageUrl
    if (b.iconUrl) return b.iconUrl
    return null
}
