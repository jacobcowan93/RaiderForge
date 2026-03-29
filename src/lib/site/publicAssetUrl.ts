/**
 * Prefix for static files when the app is served under `basePath` (must match `next.config` and
 * `NEXT_PUBLIC_BASE_PATH`, e.g. `/RaiderForge`). Omit or empty for root hosting (typical Vercel custom domain).
 */
export function normalizePublicAssetUrl(path: string): string {
    const trimmed = path.trim()
    if (!trimmed) return trimmed
    const base = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/$/, '')
    const p = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
    if (!base) return p
    /** Avoid `/base/base/...` if `next/image` or the path already included the prefix. */
    if (p === base || p.startsWith(`${base}/`)) return p
    return `${base}${p}`
}
