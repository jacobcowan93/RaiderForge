import 'server-only'

import { NextRequest, NextResponse } from 'next/server'

import { createG2GApiClient } from '@/lib/marketplace/g2g/client'
import { getMissingG2GConfigKeys } from '@/lib/marketplace/g2g/env'
import { G2GParseError, G2GResponseError } from '@/lib/marketplace/g2g/errors'

function notConfigured(missing: string[]) {
    return NextResponse.json(
        { ok: false, error: 'g2g_not_configured', missingKeys: missing },
        { status: 503 }
    )
}

function g2gErr(e: unknown) {
    if (e instanceof G2GResponseError) {
        return NextResponse.json(
            { ok: false, error: 'g2g_error', status: e.status, code: e.code, request_id: e.requestId },
            { status: 502 }
        )
    }
    if (e instanceof G2GParseError) {
        return NextResponse.json({ ok: false, error: 'g2g_parse_error' }, { status: 502 })
    }
    return NextResponse.json({ ok: false, error: 'internal_error' }, { status: 500 })
}

/** Required fields per G2G Create Offer spec. */
const REQUIRED_CREATE_FIELDS = ['service_id', 'brand_id', 'product_id', 'unit_price', 'currency'] as const

/**
 * GET /api/marketplace/g2g/inventory
 *
 * Returns the authenticated seller's own offers via POST /v2/offers/search
 * with a seller_id filter scoped to the configured G2G user.
 *
 * Query params:
 *   page       — 1-based (default 1)
 *   page_size  — max 50 (default 20)
 *   status     — optional filter e.g. "live" | "inactive"
 */
export async function GET(req: NextRequest) {
    const missing = getMissingG2GConfigKeys()
    if (missing.length > 0) return notConfigured(missing)
    const client = createG2GApiClient()
    if (!client) return notConfigured(missing)

    const sp = req.nextUrl.searchParams
    const page = Math.max(1, parseInt(sp.get('page') ?? '1', 10) || 1)
    const pageSize = Math.min(50, Math.max(1, parseInt(sp.get('page_size') ?? '20', 10) || 20))
    const status = sp.get('status')

    const filter: Record<string, unknown> = { seller_id: client.config.userId }
    if (status) filter.status = status

    try {
        const env = await client.request({
            method: 'POST',
            path: '/v2/offers/search',
            body: { filter, page, page_size: pageSize },
        })
        return NextResponse.json({
            ok: true,
            request_id: env.request_id,
            code: env.code,
            message: env.message,
            warning: env.warning,
            payload: env.payload,
        })
    } catch (e) {
        return g2gErr(e)
    }
}

/**
 * POST /api/marketplace/g2g/inventory
 *
 * Create Offer Flow — proxies POST /v2/offers (G2G docs).
 *
 * Required body fields: service_id, brand_id, product_id, unit_price, currency.
 * All other fields (title, description, available_qty, status, delivery_method_list,
 * etc.) are passed through to G2G unchanged.
 */
export async function POST(req: NextRequest) {
    const missing = getMissingG2GConfigKeys()
    if (missing.length > 0) return notConfigured(missing)
    const client = createG2GApiClient()
    if (!client) return notConfigured(missing)

    let body: unknown
    try {
        body = await req.json()
    } catch {
        return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return NextResponse.json({ ok: false, error: 'invalid_body' }, { status: 400 })
    }

    const b = body as Record<string, unknown>
    const missingFields = REQUIRED_CREATE_FIELDS.filter((k) => !b[k])
    if (missingFields.length > 0) {
        return NextResponse.json(
            { ok: false, error: 'missing_required_fields', fields: missingFields },
            { status: 400 }
        )
    }

    try {
        const env = await client.request({ method: 'POST', path: '/v2/offers', body })
        return NextResponse.json({
            ok: true,
            request_id: env.request_id,
            code: env.code,
            message: env.message,
            warning: env.warning,
            payload: env.payload,
        })
    } catch (e) {
        return g2gErr(e)
    }
}

/**
 * PATCH /api/marketplace/g2g/inventory?offer_id={id}
 *
 * Update Offer — proxies PATCH /v2/offers/{offer_id} (G2G docs).
 * Partial update; only supplied fields are changed.
 */
export async function PATCH(req: NextRequest) {
    const missing = getMissingG2GConfigKeys()
    if (missing.length > 0) return notConfigured(missing)
    const client = createG2GApiClient()
    if (!client) return notConfigured(missing)

    const offerId = req.nextUrl.searchParams.get('offer_id')?.trim()
    if (!offerId) {
        return NextResponse.json({ ok: false, error: 'missing_offer_id' }, { status: 400 })
    }

    let body: unknown
    try {
        body = await req.json()
    } catch {
        return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return NextResponse.json({ ok: false, error: 'invalid_body' }, { status: 400 })
    }

    try {
        const env = await client.request({
            method: 'PATCH',
            path: `/v2/offers/${encodeURIComponent(offerId)}`,
            body,
        })
        return NextResponse.json({
            ok: true,
            request_id: env.request_id,
            code: env.code,
            message: env.message,
            warning: env.warning,
            payload: env.payload,
        })
    } catch (e) {
        return g2gErr(e)
    }
}

/**
 * DELETE /api/marketplace/g2g/inventory?offer_id={id}
 *
 * Remove Offer — proxies DELETE /v2/offers/{offer_id} (G2G docs).
 */
export async function DELETE(req: NextRequest) {
    const missing = getMissingG2GConfigKeys()
    if (missing.length > 0) return notConfigured(missing)
    const client = createG2GApiClient()
    if (!client) return notConfigured(missing)

    const offerId = req.nextUrl.searchParams.get('offer_id')?.trim()
    if (!offerId) {
        return NextResponse.json({ ok: false, error: 'missing_offer_id' }, { status: 400 })
    }

    try {
        const env = await client.request({
            method: 'DELETE',
            path: `/v2/offers/${encodeURIComponent(offerId)}`,
        })
        return NextResponse.json({
            ok: true,
            request_id: env.request_id,
            code: env.code,
            message: env.message,
            warning: env.warning,
            payload: env.payload,
        })
    } catch (e) {
        return g2gErr(e)
    }
}
