import 'server-only'

import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Verifies a G2G inbound webhook signature.
 *
 * Per G2G "Webhook Security" docs the canonical string is:
 *   webhook_url + user_id + timestamp
 * HMAC-SHA256 is computed with the webhook secret as the key; result is hex-encoded.
 *
 * timingSafeEqual prevents timing-oracle attacks.
 * Returns false on any error (bad hex, wrong length, etc.) rather than throwing.
 */
export function verifyG2GWebhookSignature(opts: {
    webhookUrl: string
    userId: string
    timestamp: string
    receivedSignature: string
    webhookSecret: string
}): boolean {
    try {
        const { webhookUrl, userId, timestamp, receivedSignature, webhookSecret } = opts
        if (!webhookSecret || !receivedSignature) return false

        const canonicalString = webhookUrl + userId + timestamp
        const expected = createHmac('sha256', webhookSecret)
            .update(canonicalString, 'utf8')
            .digest('hex')

        const expectedBuf = Buffer.from(expected, 'hex')
        const receivedBuf = Buffer.from(receivedSignature, 'hex')

        // Lengths must match before timingSafeEqual (different lengths = different inputs = invalid)
        if (expectedBuf.length !== receivedBuf.length) return false
        return timingSafeEqual(expectedBuf, receivedBuf)
    } catch {
        return false
    }
}

/**
 * Returns false if the parsed timestamp is outside the allowed replay window.
 * Defaults to ±5 minutes, matching the G2G recommendation.
 */
export function isWebhookTimestampFresh(timestamp: string, windowMs = 5 * 60 * 1000): boolean {
    const ts = parseInt(timestamp, 10)
    if (!Number.isFinite(ts)) return false
    return Math.abs(Date.now() - ts) <= windowMs
}
