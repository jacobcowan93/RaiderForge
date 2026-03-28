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

/**
 * GET /api/marketplace/g2g/orders?order_id={id}
 *
 * Order Status Flow — proxies GET /v2/orders/{order_id} (G2G docs).
 * Returns the full G2G order envelope including current status and delivery info.
 * Documented statuses include: unpaid, cancelled, confirmed, and delivery states.
 */
export async function GET(req: NextRequest) {
    const missing = getMissingG2GConfigKeys()
    if (missing.length > 0) return notConfigured(missing)
    const client = createG2GApiClient()
    if (!client) return notConfigured(missing)

    const orderId = req.nextUrl.searchParams.get('order_id')?.trim()
    if (!orderId) {
        return NextResponse.json({ ok: false, error: 'missing_order_id' }, { status: 400 })
    }

    try {
        const env = await client.request({
            method: 'GET',
            path: `/v2/orders/${encodeURIComponent(orderId)}`,
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
 * POST /api/marketplace/g2g/orders
 *
 * Order Delivery Flow / Upload Code Flow — proxies POST /v2/orders/{order_id}/delivery.
 *
 * Expected body:
 * {
 *   order_id: string,          // required — the G2G order to deliver
 *   codes: string[]            // required — delivery codes / digital items to upload
 *   [other fields]             // passed through to G2G as-is (delivery_id, etc.)
 * }
 *
 * Trigger this from your `order.api_delivery` webhook handler after G2G signals
 * readiness. The codes array is forwarded directly to G2G.
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
    const orderId = typeof b.order_id === 'string' ? b.order_id.trim() : ''
    if (!orderId) {
        return NextResponse.json({ ok: false, error: 'missing_order_id' }, { status: 400 })
    }
    if (!Array.isArray(b.codes) || b.codes.length === 0) {
        return NextResponse.json({ ok: false, error: 'missing_codes' }, { status: 400 })
    }

    // Strip order_id from the forwarded payload; it lives in the URL path
    const { order_id: _omit, ...deliveryPayload } = b

    try {
        const env = await client.request({
            method: 'POST',
            path: `/v2/orders/${encodeURIComponent(orderId)}/delivery`,
            body: deliveryPayload,
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
