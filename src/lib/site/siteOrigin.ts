/**
 * Canonical origin (scheme + host, no trailing slash) for:
 * - Next.js `metadataBase` and absolute Open Graph / Twitter URLs
 * - `buildSkillTreeShareUrl` so "Copy share link" matches what crawlers see
 *
 * **Configuration:** set `NEXT_PUBLIC_SITE_URL` in `.env.local` (see `.env.example`).
 * Production should use your real domain (e.g. `https://raiderforge.org`) so Discord,
 * Twitter/X, and Slack unfurl previews with the correct links and images.
 *
 * Falls back to `https://raiderforge.org` when unset so builds and CI still resolve metadata.
 */
export function getSiteOrigin(): string {
    if (typeof process.env.NEXT_PUBLIC_SITE_URL === 'string' && process.env.NEXT_PUBLIC_SITE_URL.length > 0) {
        return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
    }
    return 'https://raiderforge.org'
}
