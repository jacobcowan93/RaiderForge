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

/** Build standard G2G auth headers for any method / path */
async function g2gAuthHeaders(path: string): Promise<Record<string, string>> {
    const apiKey  = process.env.G2G_API_KEY   ?? ''
    const secret  = process.env.G2G_SECRET_KEY ?? ''
    const userId  = process.env.G2G_USERNAME   ?? ''
    const timestamp = Date.now().toString()
    const { createHmac } = await import('crypto')
    const signature = createHmac('sha256', secret)
        .update(`${G2G_API_BASE}${path}${userId}${timestamp}`)
        .digest('hex')
    return {
        'g2g-api-key':   apiKey,
        'g2g-userid':    userId,
        'g2g-timestamp': timestamp,
        'g2g-signature': signature,
        'Content-Type':  'application/json',
    }
}

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

// ─────────────────────────────────────────────────────────────────────────────
// G2G Offer Management — real escrow via G2G's official API
// All writes go through server actions so credentials never reach the browser.
// ─────────────────────────────────────────────────────────────────────────────

/** Input shape for creating a G2G offer (mirrors /v2/offers POST body) */
export type PostG2gOfferInput = {
    service_id:           string
    brand_id:             string
    product_id:           string
    unit_price:           number      // actual price (e.g. 4.99)
    currency:             string      // ISO-4217, e.g. "USD"
    stock:                number
    min_unit_per_order?:  number
    max_unit_per_order?:  number
    offer_title?:         string
    offer_description?:   string
}

export type PostG2gOfferResult =
    | { ok: true;  offer_id: string; offer_hash: string }
    | { ok: false; status: 'not_configured' }
    | { ok: false; status: 'error'; message: string }

/**
 * postG2gOffer
 *
 * Creates a live offer on G2G via POST /v2/offers.
 * Buyers can purchase through G2G's secure checkout — funds are held in G2G
 * escrow and released to the seller after delivery confirmation.
 *
 * RaiderForge never holds, processes, or touches any funds.
 */
export async function postG2gOffer(input: PostG2gOfferInput): Promise<PostG2gOfferResult> {
    const apiKey = process.env.G2G_API_KEY   ?? ''
    const secret = process.env.G2G_SECRET_KEY ?? ''
    const userId = process.env.G2G_USERNAME   ?? ''

    if (!apiKey || !secret || !userId) {
        return { ok: false, status: 'not_configured' }
    }

    try {
        const path    = '/v2/offers'
        const headers = await g2gAuthHeaders(path)

        // Build the offer body — omit undefined optional fields
        const body: Record<string, unknown> = {
            service_id: input.service_id,
            brand_id:   input.brand_id,
            product_id: input.product_id,
            unit_price: input.unit_price,
            currency:   input.currency,
            stock:      input.stock,
        }
        if (input.min_unit_per_order != null) body.min_unit_per_order = input.min_unit_per_order
        if (input.max_unit_per_order != null) body.max_unit_per_order = input.max_unit_per_order
        if (input.offer_title)               body.offer_title        = input.offer_title
        if (input.offer_description)         body.offer_description  = input.offer_description

        const res = await fetch(`${G2G_API_BASE}${path}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(15_000),
        })

        if (!res.ok) {
            const text = await res.text().catch(() => '')
            return {
                ok: false,
                status: 'error',
                message: `G2G returned HTTP ${res.status}${text ? `: ${text.slice(0, 200)}` : ''}`,
            }
        }

        const json = await res.json() as {
            code?:    string
            payload?: { offer_id?: string; offer_hash?: string }
        }

        if (json.code !== '20000001') {
            return {
                ok: false,
                status: 'error',
                message: `G2G returned code ${json.code ?? 'unknown'} — offer may not have been created`,
            }
        }

        return {
            ok:         true,
            offer_id:   json.payload?.offer_id   ?? '',
            offer_hash: json.payload?.offer_hash ?? '',
        }
    } catch (err: unknown) {
        return {
            ok:      false,
            status:  'error',
            message: err instanceof Error ? err.message : String(err),
        }
    }
}

/** Input for updating an existing G2G offer */
export type UpdateG2gOfferInput = {
    offer_id:            string
    unit_price?:         number
    stock?:              number
    offer_title?:        string
    offer_description?:  string
    min_unit_per_order?: number
    max_unit_per_order?: number
}

export type UpdateG2gOfferResult =
    | { ok: true }
    | { ok: false; status: 'not_configured' }
    | { ok: false; status: 'error'; message: string }

/**
 * updateG2gOffer — PATCH /v2/offers/{offer_id}
 * Lets sellers edit price, stock, or copy on an existing live G2G offer.
 */
export async function updateG2gOffer(input: UpdateG2gOfferInput): Promise<UpdateG2gOfferResult> {
    const apiKey = process.env.G2G_API_KEY   ?? ''
    const secret = process.env.G2G_SECRET_KEY ?? ''
    const userId = process.env.G2G_USERNAME   ?? ''

    if (!apiKey || !secret || !userId) return { ok: false, status: 'not_configured' }

    try {
        const path    = `/v2/offers/${encodeURIComponent(input.offer_id)}`
        const headers = await g2gAuthHeaders(path)

        const body: Record<string, unknown> = {}
        if (input.unit_price         != null) body.unit_price         = input.unit_price
        if (input.stock              != null) body.stock              = input.stock
        if (input.offer_title)               body.offer_title        = input.offer_title
        if (input.offer_description)         body.offer_description  = input.offer_description
        if (input.min_unit_per_order != null) body.min_unit_per_order = input.min_unit_per_order
        if (input.max_unit_per_order != null) body.max_unit_per_order = input.max_unit_per_order

        const res = await fetch(`${G2G_API_BASE}${path}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(12_000),
        })

        if (!res.ok) {
            const text = await res.text().catch(() => '')
            return { ok: false, status: 'error', message: `G2G PATCH ${res.status}${text ? `: ${text.slice(0, 200)}` : ''}` }
        }

        const json = await res.json() as { code?: string }
        if (json.code !== '20000001') {
            return { ok: false, status: 'error', message: `G2G code ${json.code ?? 'unknown'}` }
        }
        return { ok: true }
    } catch (err: unknown) {
        return { ok: false, status: 'error', message: err instanceof Error ? err.message : String(err) }
    }
}

/** Result for deleting a G2G offer */
export type DeleteG2gOfferResult =
    | { ok: true }
    | { ok: false; status: 'not_configured' }
    | { ok: false; status: 'error'; message: string }

/**
 * deleteG2gOffer — DELETE /v2/offers/{offer_id}
 * Removes a live G2G offer from the marketplace.
 */
export async function deleteG2gOffer(offer_id: string): Promise<DeleteG2gOfferResult> {
    const apiKey = process.env.G2G_API_KEY   ?? ''
    const secret = process.env.G2G_SECRET_KEY ?? ''
    const userId = process.env.G2G_USERNAME   ?? ''

    if (!apiKey || !secret || !userId) return { ok: false, status: 'not_configured' }

    try {
        const path    = `/v2/offers/${encodeURIComponent(offer_id)}`
        const headers = await g2gAuthHeaders(path)

        const res = await fetch(`${G2G_API_BASE}${path}`, {
            method:  'DELETE',
            headers,
            signal:  AbortSignal.timeout(10_000),
        })

        if (!res.ok) {
            const text = await res.text().catch(() => '')
            return { ok: false, status: 'error', message: `G2G DELETE ${res.status}${text ? `: ${text.slice(0, 200)}` : ''}` }
        }

        return { ok: true }
    } catch (err: unknown) {
        return { ok: false, status: 'error', message: err instanceof Error ? err.message : String(err) }
    }
}
