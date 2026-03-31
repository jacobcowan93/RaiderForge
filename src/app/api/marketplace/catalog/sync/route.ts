import { createHmac, timingSafeEqual } from 'crypto'
import { NextResponse } from 'next/server'

import { syncMarketplaceCatalogFromArdb } from '@/lib/marketplace/ardb/sync'

export const dynamic = 'force-dynamic'

/** Long-running bulk fetch + disk write (self-hosted or compatible server). */
export const maxDuration = 300

type SyncBody = {
    hydrateDetails?: boolean
    concurrency?: number
}

type VercelWebhookBody = {
    type?: string
    event?: string
    target?: string
    payload?: {
        target?: string
    }
}

function verifyVercelSignature(rawBody: string, signature: string, secret: string) {
    const expected = createHmac('sha1', secret).update(rawBody).digest('hex')
    const provided = signature.startsWith('sha1=') ? signature.slice(5) : signature
    if (expected.length !== provided.length) return false
    return timingSafeEqual(Buffer.from(expected), Buffer.from(provided))
}

function syncAllowed(req: Request, rawBody: string): { ok: true } | { ok: false; status: number; message: string } {
    const routeSecret = process.env.MARKETPLACE_CATALOG_SYNC_SECRET
    const webhookSecret = process.env.VERCEL_DEPLOY_HOOK_SECRET
    if (process.env.NODE_ENV === 'production' && !routeSecret && !webhookSecret) {
        return {
            ok: false,
            status: 503,
            message: 'Set MARKETPLACE_CATALOG_SYNC_SECRET or VERCEL_DEPLOY_HOOK_SECRET to enable production catalog sync.',
        }
    }

    if (webhookSecret) {
        const signature = req.headers.get('x-vercel-signature')
        if (signature && verifyVercelSignature(rawBody, signature, webhookSecret)) {
            return { ok: true }
        }
    }

    if (routeSecret) {
        const auth = req.headers.get('authorization')
        const urlSecret = new URL(req.url).searchParams.get('secret')
        if (auth === `Bearer ${routeSecret}` || urlSecret === routeSecret) {
            return { ok: true }
        }
    }

    return { ok: false, status: 401, message: 'Unauthorized' }
}

export async function POST(req: Request) {
    if (process.env.NODE_ENV === 'development') {
        console.log('✅ Catalog sync triggered (dev mode)')
    }

    let rawBody = ''
    let body: SyncBody & VercelWebhookBody = {}
    try {
        rawBody = await req.text()
        if (rawBody.trim() !== '') body = JSON.parse(rawBody) as SyncBody & VercelWebhookBody
    } catch {
        return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 })
    }

    const gate = syncAllowed(req, rawBody)
    if (gate.ok === false) {
        return NextResponse.json({ ok: false, error: gate.message }, { status: gate.status })
    }

    const eventType = body.type ?? body.event
    if (eventType && !['deployment.ready', 'deployment.succeeded'].includes(eventType)) {
        return NextResponse.json({ ok: true, skipped: true, reason: `Ignored event ${eventType}` })
    }

    const deploymentTarget = body.payload?.target ?? body.target
    if (deploymentTarget && deploymentTarget !== 'production') {
        return NextResponse.json({ ok: true, skipped: true, reason: `Ignored ${deploymentTarget} deployment` })
    }

    try {
        const result = await syncMarketplaceCatalogFromArdb({
            hydrateDetails: body.hydrateDetails !== false,
            concurrency: typeof body.concurrency === 'number' ? body.concurrency : undefined,
        })
        return NextResponse.json({ ok: true, ...result })
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        console.error('[marketplace/catalog/sync] Catalog sync failed:', msg)
        return NextResponse.json({ ok: false, error: msg }, { status: 500 })
    }
}
