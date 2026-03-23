import { NextResponse } from 'next/server'

import { syncMarketplaceCatalogFromArdb } from '@/lib/marketplace/ardb/sync'

export const dynamic = 'force-dynamic'

/** Long-running bulk fetch + disk write (self-hosted or compatible server). */
export const maxDuration = 300

type SyncBody = {
    hydrateDetails?: boolean
    concurrency?: number
}

function syncAllowed(req: Request): { ok: true } | { ok: false; status: number; message: string } {
    const secret = process.env.MARKETPLACE_CATALOG_SYNC_SECRET
    if (process.env.NODE_ENV === 'production' && !secret) {
        return {
            ok: false,
            status: 503,
            message: 'Set MARKETPLACE_CATALOG_SYNC_SECRET to enable catalog sync in production.',
        }
    }
    if (secret) {
        const auth = req.headers.get('authorization')
        if (auth !== `Bearer ${secret}`) {
            return { ok: false, status: 401, message: 'Unauthorized' }
        }
    }
    return { ok: true }
}

export async function POST(req: Request) {
    const gate = syncAllowed(req)
    if (gate.ok === false) {
        return NextResponse.json({ ok: false, error: gate.message }, { status: gate.status })
    }

    let body: SyncBody = {}
    try {
        const text = await req.text()
        if (text.trim() !== '') body = JSON.parse(text) as SyncBody
    } catch {
        return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 })
    }

    const result = await syncMarketplaceCatalogFromArdb({
        hydrateDetails: body.hydrateDetails !== false,
        concurrency: typeof body.concurrency === 'number' ? body.concurrency : undefined,
    })

    return NextResponse.json({ ok: true, ...result })
}
