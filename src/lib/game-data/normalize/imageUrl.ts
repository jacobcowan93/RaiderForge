/**
 * Upstream game-data image paths are inconsistent (relative vs absolute, generic placeholders).
 * Centralize absolutization + placeholder detection so `/api/game/*` returns stable URLs.
 */

const DEFAULT_APP_ORIGIN = 'https://ardb.app'
const DEFAULT_STATIC_BASE = 'https://ardb.app/static'

/** Basenames that are generic placeholders upstream; omit so UI fallbacks apply. */
const GENERIC_IMAGE_BASENAMES = new Set([
    'recipe.webp',
    'recipe.png',
    'recipe.jpg',
    'placeholder.webp',
    'placeholder.png',
    'default.webp',
    'unknown.webp',
    'missing.webp',
])

function pathnameOf(url: string): string {
    const t = url.trim()
    if (!t) return ''
    try {
        if (/^https?:\/\//i.test(t)) return new URL(t).pathname.toLowerCase()
    } catch {
        /* ignore */
    }
    return t.toLowerCase()
}

export function isGenericOrPlaceholderGameImageUrl(url: string): boolean {
    const path = pathnameOf(url)
    if (!path) return true
    const segments = path.split('/').filter(Boolean)
    const base = segments[segments.length - 1] ?? ''
    return GENERIC_IMAGE_BASENAMES.has(base)
}

export function absolutizeGameDataImageUrl(raw: string): string | null {
    const s = raw.trim()
    if (!s) return null
    if (/^https?:\/\//i.test(s)) return s
    if (s.startsWith('//')) return `https:${s}`

    const origin = process.env.GAME_DATA_APP_ORIGIN?.replace(/\/$/, '') || DEFAULT_APP_ORIGIN
    const staticBase = process.env.GAME_DATA_STATIC_BASE_URL?.replace(/\/$/, '') || DEFAULT_STATIC_BASE

    if (s.startsWith('/static/')) {
        return `${origin}${s}`
    }
    if (s.startsWith('/')) {
        return `${staticBase}${s}`
    }
    return `${staticBase}/${s.replace(/^\/+/, '')}`
}

/** First candidate that absolutizes to a non-placeholder URL. */
export function resolveGameDataImageUrl(candidates: Array<string | null | undefined>): string | null {
    for (const c of candidates) {
        if (c == null || typeof c !== 'string') continue
        const abs = absolutizeGameDataImageUrl(c)
        if (!abs) continue
        if (isGenericOrPlaceholderGameImageUrl(abs)) continue
        return abs
    }
    return null
}
