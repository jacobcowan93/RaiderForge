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

function pushUnique(out: string[], seen: Set<string>, url: string | null | undefined) {
    if (!url || !url.trim()) return
    const u = url.trim()
    if (seen.has(u)) return
    seen.add(u)
    out.push(u)
}

export type BlueprintImageFields = Pick<
    NormalizedBlueprint,
    | 'id'
    | 'name'
    | 'imageUrl'
    | 'iconUrl'
    | 'sourceImageUrls'
    | 'craftedItemIconUrl'
    | 'trackerDisplayName'
>

function displayLabelForReferenceArt(b: BlueprintImageFields): string {
    if (b.trackerDisplayName?.trim()) return b.trackerDisplayName.trim()
    return b.name.replace(/\s+blueprint\s*$/i, '').trim()
}

/**
 * Ordered candidate URLs for `<img src>` — try in order; use `onError` in the UI to advance when a URL 404s or fails.
 * This avoids blank tiles when the registry path is wrong in production while ARDB art would still load.
 */
export function resolveBlueprintImageCandidates(b: BlueprintImageFields): string[] {
    const seen = new Set<string>()
    const out: string[] = []

    pushUnique(out, seen, resolveReferenceBlueprintArt(displayLabelForReferenceArt(b)))

    pushUnique(out, seen, b.imageUrl && !isGenericRecipeUrl(b.imageUrl) ? b.imageUrl : null)
    pushUnique(out, seen, b.iconUrl && !isGenericRecipeUrl(b.iconUrl) ? b.iconUrl : null)

    const localId = LOCAL_BY_ARDB_ID[b.id]
    pushUnique(out, seen, localId)
    const localName = LOCAL_BY_NAME_KEY[blueprintLookupKey(b.name)]
    pushUnique(out, seen, localName)

    const fromSources = firstNonGenericSource(b.sourceImageUrls)
    pushUnique(out, seen, fromSources)
    if (b.sourceImageUrls.length > 0 && b.sourceImageUrls[0]?.trim() !== '') {
        pushUnique(out, seen, b.sourceImageUrls[0])
    }

    pushUnique(
        out,
        seen,
        b.craftedItemIconUrl && !isGenericRecipeUrl(b.craftedItemIconUrl) ? b.craftedItemIconUrl : null
    )

    pushUnique(out, seen, b.imageUrl)
    pushUnique(out, seen, b.iconUrl)

    return out
}

/**
 * First candidate (legacy callers: export, print). Prefer `resolveBlueprintImageCandidates` + onError in UI.
 */
export function resolveBlueprintImage(b: BlueprintImageFields): string | null {
    const c = resolveBlueprintImageCandidates(b)
    if (c.length === 0) {
        if (process.env.NODE_ENV === 'development' && !warnedMissingImageIds.has(b.id)) {
            warnedMissingImageIds.add(b.id)
            console.warn('[blueprints] No image resolved for', displayLabelForReferenceArt(b), `(id ${b.id})`)
        }
        return null
    }
    return c[0]!
}
