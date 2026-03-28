import 'server-only'

import { NextRequest, NextResponse } from 'next/server'

import { tryLoadG2GServerConfig } from '@/lib/marketplace/g2g/env'
import {
    verifyG2GWebhookSignature,
    isWebhookTimestampFresh,
} from '@/lib/marketplace/g2g/webhooks'

/**
 * POST /api/webhooks/g2g
 *
 * G2G sends order and offer lifecycle events here. Configure this URL in the
 * G2G seller dashboard → Webhooks.
 *
 * Security:
 *  - Replay protection: g2g-timestamp must be within ±5 minutes of server clock.
 *  - HMAC-SHA256 signature verified with G2G_WEBHOOK_SECRET when set.
 *  - In production, requests are rejected when G2G_WEBHOOK_SECRET is absent.
 *  - In development, signature is skipped with a console warning.
 *
 * G2G requires a 2xx response to mark the event as successfully received.
 * Do heavy work asynchronously (queue / background job) to stay under their
 * response-time threshold.
 *
 * Documented event types (G2G OpenAPI v2):
 *   order.created | order.confirmed | order.delivery_status | order.api_delivery
 *   order.cancelled | order.completed | order.rollback_cancelled
 *   order.rollback_completed | order.case_opened | offer.low_stock
 */
export async function POST(request: NextRequest) {
    const config = tryLoadG2GServerConfig()

    // ── 1. Required signing headers ───────────────────────────────────────────
    const signature = request.headers.get('g2g-signature')
    const timestamp = request.headers.get('g2g-timestamp')

    if (!signature || !timestamp) {
        console.warn('[G2G Webhook] Rejected: missing g2g-signature or g2g-timestamp')
        return NextResponse.json({ error: 'missing_headers' }, { status: 401 })
    }

    // ── 2. Replay-attack window ───────────────────────────────────────────────
    if (!isWebhookTimestampFresh(timestamp)) {
        console.warn('[G2G Webhook] Rejected: timestamp outside 5-minute window')
        return NextResponse.json({ error: 'timestamp_expired' }, { status: 401 })
    }

    // ── 3. HMAC-SHA256 signature verification ─────────────────────────────────
    if (config?.webhookSecret) {
        const webhookUrl =
            process.env.G2G_WEBHOOK_URL ??
            `${process.env.NEXTAUTH_URL ?? ''}/api/webhooks/g2g`

        const valid = verifyG2GWebhookSignature({
            webhookUrl,
            userId: config.userId,
            timestamp,
            receivedSignature: signature,
            webhookSecret: config.webhookSecret,
        })

        if (!valid) {
            console.warn('[G2G Webhook] Rejected: invalid HMAC-SHA256 signature')
            return NextResponse.json({ error: 'invalid_signature' }, { status: 401 })
        }
    } else {
        // No webhook secret configured — safe only in development
        if (process.env.NODE_ENV === 'production') {
            console.error(
                '[G2G Webhook] Rejected: G2G_WEBHOOK_SECRET is not set.' +
                    ' Unverified webhooks are not accepted in production.'
            )
            return NextResponse.json({ error: 'webhook_secret_not_configured' }, { status: 503 })
        }
        console.warn(
            '[G2G Webhook] G2G_WEBHOOK_SECRET not set — skipping signature verification (development only)'
        )
    }

    // ── 4. Parse event body ───────────────────────────────────────────────────
    let event: unknown
    try {
        event = await request.json()
    } catch {
        return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
    }

    if (!event || typeof event !== 'object' || Array.isArray(event)) {
        return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })
    }

    const e = event as Record<string, unknown>
    const eventType = typeof e.event_type === 'string' ? e.event_type : 'unknown'
    const orderId = typeof e.order_id === 'string' ? e.order_id : undefined
    const offerId = typeof e.offer_id === 'string' ? e.offer_id : undefined

    // ── 5. Structured server logging (no secrets, no full body in production) ─
    if (process.env.NODE_ENV === 'development') {
        console.info('[G2G Webhook]', eventType, JSON.stringify(e, null, 2))
    } else {
        console.info('[G2G Webhook] Received', { event_type: eventType, order_id: orderId, offer_id: offerId })
    }

    // ── 6. Event dispatch ─────────────────────────────────────────────────────
    // Extend each case with your business logic (database writes, notifications,
    // delivery triggers, etc.) as your platform grows.
    switch (eventType) {
        case 'order.created':
            // Order placed by buyer; not yet paid. Reserve inventory if applicable.
            break

        case 'order.confirmed':
            // Payment confirmed. Prepare delivery.
            break

        case 'order.delivery_status':
            // G2G delivery tracking update (fully_delivered / partial_delivered / unfulfilled).
            break

        case 'order.api_delivery':
            // G2G is ready for the seller to upload codes via POST /v2/orders/{id}/delivery.
            // Trigger your automated code-delivery logic here.
            break

        case 'order.cancelled':
            // Order cancelled (payment failure or buyer action). Release reserved stock.
            break

        case 'order.completed':
            // Buyer confirmed receipt. Process final settlement / analytics.
            break

        case 'order.rollback_cancelled':
            // Edge case: a cancelled order reverted to unpaid. Monitor for re-payment.
            break

        case 'order.rollback_completed':
            // Edge case: completed order reverted after buyer dispute. Investigate.
            break

        case 'order.case_opened':
            // Buyer filed a dispute. Respond in G2G resolution centre.
            break

        case 'offer.low_stock':
            // Offer below configured low-stock threshold. Restock or reprice.
            break

        default:
            console.warn('[G2G Webhook] Unrecognised event_type:', eventType)
    }

    // ── 7. Acknowledge immediately — G2G retries on non-2xx ──────────────────
    return NextResponse.json({ received: true })
}

/**
 * GET /api/webhooks/g2g
 * Lightweight liveness probe. G2G may ping this URL to verify it is reachable.
 */
export async function GET() {
    return NextResponse.json({ ok: true, endpoint: 'g2g-webhook' })
}
