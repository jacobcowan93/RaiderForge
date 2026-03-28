/**
 * TroubleChute map pages (maps.tcno.co) send a Content-Security-Policy whose
 * frame-ancestors allowlist is limited (e.g. 'self' and https://raidersarc.io).
 * Browsers refuse to render those pages inside an iframe on other origins.
 *
 * We still render an iframe when the request host matches that allowlist, or when
 * NEXT_PUBLIC_TCNO_IFRAME_FORCE=1 (local testing / future allowlist expansion).
 * Otherwise we use the linked-preview fallback so production never shows a huge blank frame.
 */

export function shouldUseTcnoIframeEmbed(hostHeader: string | null): boolean {
    if (process.env.NEXT_PUBLIC_TCNO_IFRAME === '0') return false
    if (process.env.NEXT_PUBLIC_TCNO_IFRAME_FORCE === '1') return true

    const raw = (hostHeader ?? '').trim().toLowerCase()
    const first = raw.split(',')[0]?.trim() ?? ''
    const hostname = first.split(':')[0]
    if (!hostname) return false

    return (
        hostname === 'raidersarc.io' ||
        hostname === 'www.raidersarc.io' ||
        hostname.endsWith('.raidersarc.io')
    )
}
