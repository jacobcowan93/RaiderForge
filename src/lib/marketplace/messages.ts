/**
 * User-facing marketplace copy when Prisma / DB persistence is not available.
 * Never mention environment variables or internal config in these strings.
 */
export const MARKETPLACE_PERSISTENCE_UNAVAILABLE =
    'Marketplace listings and orders are temporarily unavailable. Please try again later.'

/** Server logs only — safe to mention ops context; not shown to users. */
export function logMarketplacePersistenceMissing(route: string) {
    console.warn(`[marketplace] ${route}: persistence unavailable (database not configured)`)
}
