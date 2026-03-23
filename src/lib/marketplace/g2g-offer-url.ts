/**
 * External listing URL on G2G (checkout stays on G2G). Override with NEXT_PUBLIC_G2G_OFFER_BASE if needed.
 */
export function getG2GOfferExternalUrl(offerId: string): string {
    const raw = process.env.NEXT_PUBLIC_G2G_OFFER_BASE ?? 'https://www.g2g.com'
    const base = raw.replace(/\/+$/, '')
    return `${base}/offers/${encodeURIComponent(offerId)}`
}
