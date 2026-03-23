import 'server-only'

export type G2GServerConfig = {
    apiBaseUrl: string
    accessKeyId: string
    secretAccessKey: string
    userId: string
    /** For webhook HMAC verification (Phase 5); optional in Phase 1. */
    webhookSecret?: string
    /** Minimum spacing between outbound API calls (ms). */
    minRequestIntervalMs: number
}

function trim(s: string | undefined): string {
    return (s ?? '').trim()
}

function collectSources(): {
    apiBaseUrl: string
    accessKeyId: string
    secretAccessKey: string
    userId: string
    webhookSecret: string
    minInterval: string
} {
    return {
        apiBaseUrl: trim(process.env.G2G_API_BASE_URL || process.env.G2G_API_BASE),
        accessKeyId: trim(process.env.G2G_ACCESS_KEY_ID || process.env.G2G_API_KEY),
        secretAccessKey: trim(process.env.G2G_SECRET_ACCESS_KEY || process.env.G2G_SECRET),
        userId: trim(process.env.G2G_USER_ID || process.env.G2G_USERNAME),
        webhookSecret: trim(process.env.G2G_WEBHOOK_SECRET),
        minInterval: trim(process.env.G2G_MIN_REQUEST_INTERVAL_MS)
    }
}

export function getMissingG2GConfigKeys(): string[] {
    const s = collectSources()
    const missing: string[] = []
    if (!s.apiBaseUrl) missing.push('G2G_API_BASE (or G2G_API_BASE_URL)')
    if (!s.accessKeyId) missing.push('G2G_ACCESS_KEY_ID (or G2G_API_KEY)')
    if (!s.secretAccessKey) missing.push('G2G_SECRET_ACCESS_KEY (or G2G_SECRET)')
    if (!s.userId) missing.push('G2G_USER_ID (or G2G_USERNAME)')
    return missing
}

/**
 * Returns validated server config, or null if required variables are absent.
 * Never logs secret values.
 */
export function tryLoadG2GServerConfig(): G2GServerConfig | null {
    const missing = getMissingG2GConfigKeys()
    if (missing.length > 0) {
        if (process.env.NODE_ENV === 'development') {
            console.warn('[G2G] Marketplace server integration disabled:', missing.join(', '))
        }
        return null
    }

    const s = collectSources()
    let minRequestIntervalMs = 250
    if (s.minInterval) {
        const n = Number(s.minInterval)
        if (Number.isFinite(n) && n >= 0) minRequestIntervalMs = n
    }

    let apiBaseUrl = s.apiBaseUrl.replace(/\/+$/, '')

    return {
        apiBaseUrl,
        accessKeyId: s.accessKeyId,
        secretAccessKey: s.secretAccessKey,
        userId: s.userId,
        webhookSecret: s.webhookSecret || undefined,
        minRequestIntervalMs
    }
}
