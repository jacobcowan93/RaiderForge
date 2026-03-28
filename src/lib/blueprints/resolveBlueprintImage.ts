import type { NormalizedBlueprint } from '@/lib/blueprints/normalizeBlueprints'
import { blueprintLookupKey } from '@/lib/blueprints/blueprintSlug'
import { resolveReferenceBlueprintArt } from '@/lib/blueprints/blueprintReferenceArt'

export { blueprintLookupKey } from '@/lib/blueprints/blueprintSlug'

/** ARDB blueprint rows often use this for both `image` and `icon`. */
const GENERIC_RECIPE_RE = /\/recipe\.webp$/i

function isGenericRecipeUrl(url: string | null | undefined): boolean {
    return !url || GENERIC_RECIPE_RE.test(url)
}

const LOCAL_BY_ARDB_ID: Record<string, string> = {}

const LOCAL_BY_NAME_KEY: Record<string, string> = {}

const warnedMissingImageIds = new Set<string>()

function firstNonGenericSource(urls: string[]): string | null {
    for (const u of urls) {
        if (typeof u === 'string' && u.trim() !== '' && !isGenericRecipeUrl(u)) return u
    }
    return null
}

type ImageFields = Pick<
    NormalizedBlueprint,
    | 'id'
    | 'name'
    | 'imageUrl'
    | 'iconUrl'
    | 'sourceImageUrls'
    | 'craftedItemIconUrl'
    | 'trackerDisplayName'
>

function displayLabelForReferenceArt(b: ImageFields): string {
    if (b.trackerDisplayName?.trim()) return b.trackerDisplayName.trim()
    return b.name.replace(/\s+blueprint\s*$/i, '').trim()
}

/**
 * Priority:
 * 1. Local tiles sliced from the reference tracker grid (`public/assets/blueprints/registry`), keyed by spreadsheet label
 * 2. Item-specific ARDB `imageUrl` / `iconUrl` (skip generic recipe sheet)
 * 3. Manual `LOCAL_BY_ARDB_ID` / `LOCAL_BY_NAME_KEY` overrides
 * 4. ARDB `sourceImageUrls`, then `craftedItemIconUrl`
 * 5. Generic `imageUrl` / `iconUrl` last resort
 */
export function resolveBlueprintImage(b: ImageFields): string | null {
    const refArt = resolveReferenceBlueprintArt(displayLabelForReferenceArt(b))
    if (refArt) return refArt

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

    if (process.env.NODE_ENV === 'development' && !warnedMissingImageIds.has(b.id)) {
        warnedMissingImageIds.add(b.id)
        console.warn('[blueprints] No image resolved for', displayLabelForReferenceArt(b), `(id ${b.id})`)
    }
    return null
}
