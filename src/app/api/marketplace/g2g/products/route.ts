import { NextRequest, NextResponse } from 'next/server'

import { createG2GApiClient } from '@/lib/marketplace/g2g/client'
import { getMissingG2GConfigKeys } from '@/lib/marketplace/g2g/env'
import { G2GParseError, G2GResponseError } from '@/lib/marketplace/g2g/errors'

const PRODUCT_QUERY_KEYS = ['category_id', 'service_id', 'brand_id', 'q'] as const

/** GET /v2/products — Get Products (G2G docs). */
export async function GET(req: NextRequest) {
    const missing = getMissingG2GConfigKeys()
    if (missing.length > 0) {
        return NextResponse.json({ ok: false, error: 'g2g_not_configured', missingKeys: missing }, { status: 503 })
    }
    const client = createG2GApiClient()
    if (!client) {
        return NextResponse.json({ ok: false, error: 'g2g_not_configured', missingKeys: missing }, { status: 503 })
    }

    const query: Record<string, string | undefined> = {}
    const sp = req.nextUrl.searchParams
    for (const key of PRODUCT_QUERY_KEYS) {
        const v = sp.get(key)
        if (v !== null) query[key] = v
    }

    try {
        const env = await client.request({
            method: 'GET',
            path: '/v2/products',
            query: Object.keys(query).length > 0 ? query : undefined
        })
        return NextResponse.json({
            ok: true,
            request_id: env.request_id,
            code: env.code,
            message: env.message,
            warning: env.warning,
            payload: env.payload
        })
    } catch (e) {
        if (e instanceof G2GResponseError) {
            return NextResponse.json(
                {
                    ok: false,
                    error: 'g2g_error',
                    status: e.status,
                    code: e.code,
                    request_id: e.requestId
                },
                { status: 502 }
            )
        }
        if (e instanceof G2GParseError) {
            return NextResponse.json({ ok: false, error: 'g2g_parse_error' }, { status: 502 })
        }
        return NextResponse.json({ ok: false, error: 'internal_error' }, { status: 500 })
    }
}
