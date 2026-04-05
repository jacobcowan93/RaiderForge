'use server'

/**
 * G2G Marketplace Server Actions
 *
 * All G2G API credentials are read exclusively server-side.
 * These actions are safe to import from Client Components — Next.js
 * ensures the server-side code is never bundled into the client.
 *
 * Credentials used (all server-only, never exposed to browser):
 *   G2G_API_KEY       — API access key
 *   G2G_SECRET_KEY    — HMAC signing secret
 *   G2G_USERNAME      — G2G seller user ID
 *   G2G_API_BASE      — Base URL (default: https://sls.g2g.com)
 *
 * See .env.example for full setup instructions.
 */

const G2G_API_BASE = process.env.G2G_API_BASE ?? 'https://sls.g2g.com'

export type G2GConnectionResult =
    | { ok: true;  status: 'connected'; sellerStatus: string; accountStatus: string; userId: string }
    | { ok: false; status: 'not_configured' }
    | { ok: false; status: 'error'; message: string }

/**
 * testG2gConnection
 *
 * Pings the G2G /v2/store endpoint to verify credentials are valid.
 * Returns structured result — never throws.
 *
 * Safe to call from Client Components via the "use server" boundary.
 */
export async function testG2gConnection(): Promise<G2GConnectionResult> {
    const apiKey  = process.env.G2G_API_KEY  ?? ''
    const secret  = process.env.G2G_SECRET_KEY ?? ''
    const userId  = process.env.G2G_USERNAME   ?? ''

    if (!apiKey || !secret || !userId) {
        return { ok: false, status: 'not_configured' }
    }

    try {
        const timestamp = Date.now().toString()
        const path      = '/v2/store'

        // HMAC-SHA256 signature: webhookUrl + userId + timestamp
        // Using dynamic import to avoid pulling crypto into the client bundle
        const { createHmac } = await import('crypto')
        const canonical = `${G2G_API_BASE}${path}${userId}${timestamp}`
        const signature = createHmac('sha256', secret).update(canonical).digest('hex')

        const res = await fetch(`${G2G_API_BASE}${path}`, {
            method: 'GET',
            headers: {
                'g2g-api-key':   apiKey,
                'g2g-userid':    userId,
                'g2g-timestamp': timestamp,
                'g2g-signature': signature,
                'Content-Type':  'application/json',
            },
            // 8s timeout — if G2G is slow we don't want to hang the UI
            signal: AbortSignal.timeout(8000),
        })

        if (!res.ok) {
            const body = await res.text().catch(() => '')
            return {
                ok: false,
                status: 'error',
                message: `G2G returned HTTP ${res.status}${body ? `: ${body.slice(0, 120)}` : ''}`,
            }
        }

        const json = await res.json() as {
            code?: string
            payload?: { user_id?: string; account_status?: string; seller_status?: string }
        }

        if (json.code !== '20000001') {
            return {
                ok: false,
                status: 'error',
                message: `Unexpected G2G response code: ${json.code ?? 'unknown'}`,
            }
        }

        return {
            ok: true,
            status: 'connected',
            sellerStatus:  json.payload?.seller_status  ?? 'unknown',
            accountStatus: json.payload?.account_status ?? 'unknown',
            userId:        json.payload?.user_id        ?? userId,
        }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        return { ok: false, status: 'error', message }
    }
}

/**
 * checkG2gConfigured
 *
 * Server-only check — returns true if all three G2G credentials are present.
 * Used by the layout to conditionally show the "G2G Connected" badge without
 * actually making an outbound network request.
 */
export async function checkG2gConfigured(): Promise<boolean> {
    return Boolean(
        process.env.G2G_API_KEY &&
        process.env.G2G_SECRET_KEY &&
        process.env.G2G_USERNAME,
    )
}
