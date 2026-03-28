import type { NormalizedBlueprint } from '@/lib/blueprints/normalizeBlueprints'

/** ARDB blueprint rows usually point `image`/`icon` here; per-item art is in `sourceImageUrls`. */
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

/** Optional: ARDB item id → public URL under `public/`. */
const LOCAL_BY_ARDB_ID: Record<string, string> = {
    // angled_grip_t2_blueprint: '/images/blueprints/angled-grip-ii.webp',
}

/** Optional: `blueprintLookupKey(name)` → public URL. */
const LOCAL_BY_NAME_KEY: Record<string, string> = {}

function firstNonGenericSource(urls: string[]): string | null {
    for (const u of urls) {
        if (typeof u === 'string' && u.trim() !== '' && !isGenericRecipeUrl(u)) return u
    }
    return null
}

/**
 * Priority (catalog + ARDB reality):
 * 1. Non-generic `imageUrl` from catalog
 * 2. Non-generic `iconUrl` from catalog
 * 3. Explicit local assets (when you add files under `public/`)
 * 4. ARDB `sourceImageUrls` (inspect art — typically the real per-blueprint image)
 * 5. Generic `imageUrl` / `iconUrl` (recipe sheet) last
 */
export function resolveBlueprintImage(b: Pick<NormalizedBlueprint, 'id' | 'name' | 'imageUrl' | 'iconUrl' | 'sourceImageUrls'>): string | null {
    if (b.imageUrl && !isGenericRecipeUrl(b.imageUrl)) return b.imageUrl
    if (b.iconUrl && !isGenericRecipeUrl(b.iconUrl)) return b.iconUrl

    const localId = LOCAL_BY_ARDB_ID[b.id]
    if (localId && localId.trim() !== '') return localId
    const localName = LOCAL_BY_NAME_KEY[blueprintLookupKey(b.name)]
    if (localName && localName.trim() !== '') return localName

    const fromSources = firstNonGenericSource(b.sourceImageUrls)
    if (fromSources) return fromSources
    if (b.sourceImageUrls.length > 0 && b.sourceImageUrls[0]?.trim() !== '') return b.sourceImageUrls[0]

    if (b.imageUrl) return b.imageUrl
    if (b.iconUrl) return b.iconUrl
    return null
}
